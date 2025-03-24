"use server"

import { openai } from "@/lib/openai";
import { ActionState } from "@/types";
import { SelectMarketDriver, SelectMarketConstructor, SelectDriver, SelectConstructor } from "@/db/schema";
import { z } from "zod";

interface TeamData {
  drivers: SelectDriver[];
  constructors: SelectConstructor[];
}

interface Recommendation {
  analysis: string;
  recommendedTeam: {
    drivers: SelectMarketDriver[];
    constructors: SelectMarketConstructor[];
  };
}

// Define Zod schema for structured output
const F1RecommendationSchema = z.object({
  analysis: z.string().describe("Detailed analysis of the current team, explanation for recommended changes, and insights into the value proposition of each selected driver and constructor. Use Markdown formatting."),
  recommendedDrivers: z.array(z.string()).describe("List of exactly 5 driver names for the recommended team. These must be exact matches of names from the available drivers list."),
  recommendedConstructors: z.array(z.string()).describe("List of exactly 2 constructor names for the recommended team. These must be exact matches of names from the available constructors list."),
  totalCost: z.number().describe("The calculated total cost of the recommended team in millions. This must be less than the fixed budget of 100M.")
});

type AIRecommendationResponse = z.infer<typeof F1RecommendationSchema>;

// Store the latest recommendation for each user
const recommendationStore = new Map<string, {
  recommendation: Recommendation | null;
  inProgress: boolean;
  timestamp: number;
}>();

/**
 * Helper function to clean response content from markdown code blocks that LLMs might return
 */
function cleanResponseJson(content: string): string {
  // Handle null or undefined content
  if (!content) {
    return "{}";
  }

  // If the response contains markdown code fences (```json), extract just the JSON content
  if (content.includes("```")) {
    // Find the start of JSON after the code fence
    const jsonStart = content.indexOf("```") + 3;
    // Skip the language identifier line if present (e.g., ```json)
    const contentStart = content.indexOf("\n", jsonStart) + 1;
    // Find the end closing fence
    const jsonEnd = content.lastIndexOf("```");
    
    if (jsonEnd > contentStart) {
      // Extract only the content between code fences
      return content.substring(contentStart, jsonEnd).trim();
    }
  }
  
  // Handle leading/trailing whitespace
  content = content.trim();

  // If content starts with a valid JSON character, return it
  if (content.startsWith("{") || content.startsWith("[")) {
    return content;
  }
  
  // If we get here, try to find any JSON-like content
  const jsonStartIndex = content.indexOf("{");
  const jsonEndIndex = content.lastIndexOf("}");
  
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    return content.substring(jsonStartIndex, jsonEndIndex + 1);
  }
  
  // Return the original content if we can't find any JSON structure
  return content;
}

export async function generateTeamRecommendationsAction(
  teamData: TeamData,
  marketDrivers: SelectMarketDriver[],
  marketConstructors: SelectMarketConstructor[],
  userId: string
): Promise<ActionState<{ inProgress: boolean }>> {
  try {
    // Rate limiting is now handled through the subscriptions table
    // We removed the profiles table rate limiting functionality
    
    // Check if we already have a recent recommendation for this user
    const userRecommendation = recommendationStore.get(userId);
    
    // If recommendation is already in progress, return that status
    if (userRecommendation?.inProgress) {
      return {
        isSuccess: true,
        message: "Recommendation generation in progress",
        data: { inProgress: true }
      };
    }
    
    // If we have a recent recommendation (less than 2 minutes old), return it
    if (userRecommendation?.recommendation && 
        (Date.now() - userRecommendation.timestamp) < 2 * 60 * 1000) {
      return {
        isSuccess: true,
        message: "Using recent recommendation",
        data: { inProgress: false }
      };
    }
    
    // Set in-progress flag
    recommendationStore.set(userId, {
      recommendation: null,
      inProgress: true,
      timestamp: Date.now()
    });
    
    // Start background process
    generateRecommendationInBackground(teamData, marketDrivers, marketConstructors, userId);
    
    // Return immediately with in-progress status
    return {
      isSuccess: true,
      message: "Recommendation generation started",
      data: { inProgress: true }
    };
  } catch (error) {
    console.error("Error initiating recommendation generation:", error);
    return { 
      isSuccess: false, 
      message: "Failed to start recommendation generation",
      data: { inProgress: false }
    };
  }
}

// Get the latest recommendation for a user
export async function getRecommendationAction(userId: string): Promise<ActionState<Recommendation | null>> {
  try {
    const userRecommendation = recommendationStore.get(userId);
    
    if (!userRecommendation) {
      return {
        isSuccess: false,
        message: "No recommendation found",
        data: null
      };
    }
    
    return {
      isSuccess: !userRecommendation.inProgress,
      message: userRecommendation.inProgress 
        ? "Recommendation generation in progress" 
        : "Recommendation retrieved successfully",
      data: userRecommendation.recommendation
    };
  } catch (error) {
    console.error("Error retrieving recommendation:", error);
    return { isSuccess: false, message: "Failed to retrieve recommendation", data: null };
  }
}

// Background process for generating recommendations
async function generateRecommendationInBackground(
  teamData: TeamData,
  marketDrivers: SelectMarketDriver[],
  marketConstructors: SelectMarketConstructor[],
  userId: string
) {
  try {
    // Use fixed budget of 100M
    const FIXED_BUDGET = 100;
    
    // Calculate current team cost for reference
    const totalDriverPrice = teamData.drivers.reduce((sum, driver) => sum + driver.price, 0);
    const totalConstructorPrice = teamData.constructors.reduce((sum, constructor) => sum + constructor.price, 0);
    const currentTeamCost = totalDriverPrice + totalConstructorPrice;
    
    // Prepare the data for the AI prompt
    const prompt = `
      I need recommendations for an F1 Fantasy team. Here's the current team:
      
      Current Drivers:
      ${teamData.drivers.map(d => `- ${d.name} (Price: $${d.price}M, Points: ${d.points})`).join('\n')}
      
      Current Constructors:
      ${teamData.constructors.map(c => `- ${c.name} (Price: $${c.price}M, Points: ${c.points})`).join('\n')}
      
      Current Team Cost: $${currentTeamCost.toFixed(1)}M
      Total Budget Available: $${FIXED_BUDGET}M
      
      Available Drivers:
      ${marketDrivers.map(d => `- ${d.name} (Price: $${d.price}M, Points: ${d.points}, Team: ${d.team})`).join('\n')}
      
      Available Constructors:
      ${marketConstructors.map(c => `- ${c.name} (Price: $${c.price}M, Points: ${c.points})`).join('\n')}
      
      Please analyze the current team and provide recommendations to improve performance.
      Suggest which drivers and constructors to add or remove based on their price, recent performance, and value for money.
      
      IMPORTANT: You MUST select exactly 5 drivers and 2 constructors for the recommended team.
      CRITICAL: The total cost of your recommended team MUST be LESS THAN $${FIXED_BUDGET}M. 
      If your recommended team exceeds the budget, you will need to make adjustments until it fits within the budget.
      
      Please return a structured JSON response with:
      - analysis: A detailed Markdown-formatted analysis
      - recommendedDrivers: An array of exactly 5 driver names
      - recommendedConstructors: An array of exactly 2 constructor names
      - totalCost: The calculated total cost of your recommended team (which must be under $${FIXED_BUDGET}M)
    `;
    
    // Call OpenRouter API with structured output format
    const completion = await openai.chat.completions.create({
      model: "google/gemini-pro-1.5",
      messages: [
        {
          role: "system",
          content: `You are an expert F1 Fantasy advisor. Provide detailed analysis and recommendations for Fantasy F1 teams.
                   STRICT RULE: Your recommended team MUST stay under the budget limit of $${FIXED_BUDGET}M.
                   Your analysis should be written in Markdown format with proper headings, bullet points, and formatting.
                   Always calculate the total cost of your recommended team and verify it is under budget before responding.
                   Include performance insights and value analysis for each recommended driver and constructor.
                   
                   CRITICAL: Your response MUST be just valid JSON with no markdown or code fence blocks.
                   You must return a properly structured JSON response with exactly 5 drivers and 2 constructors.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "f1_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              analysis: {
                type: "string",
                description: "Detailed analysis of the current team, explanation for recommended changes, and insights into the value proposition of each selected driver and constructor. Use Markdown formatting."
              },
              recommendedDrivers: {
                type: "array",
                description: "List of exactly 5 driver names for the recommended team. These must be exact matches of names from the available drivers list.",
                items: { type: "string" }
              },
              recommendedConstructors: {
                type: "array",
                description: "List of exactly 2 constructor names for the recommended team. These must be exact matches of names from the available constructors list.",
                items: { type: "string" }
              },
              totalCost: {
                type: "number",
                description: "The calculated total cost of the recommended team in millions. This must be less than the fixed budget of 100M."
              }
            },
            required: ["analysis", "recommendedDrivers", "recommendedConstructors", "totalCost"]
          }
        }
      },
      temperature: 0.7,
      max_tokens: 100000
    });
    
    // Extract the response content and parse it
    // Add error handling for response structure
    if (!completion.choices?.length || !completion.choices[0]) {
      console.error("Invalid response structure from OpenRouter:", completion);
      recommendationStore.set(userId, {
        recommendation: null,
        inProgress: false,
        timestamp: Date.now()
      });
      return;
    }
    
    const responseContent = completion.choices[0].message?.content;
    if (!responseContent) {
      recommendationStore.set(userId, {
        recommendation: null,
        inProgress: false,
        timestamp: Date.now()
      });
      return;
    }
    
    // Parse the JSON response
    let aiResponse: AIRecommendationResponse;
    try {
      // Clean the response content to handle markdown code blocks
      const cleanedContent = cleanResponseJson(responseContent);
      aiResponse = JSON.parse(cleanedContent) as AIRecommendationResponse;
    } catch (error) {
      console.error("Error parsing AI recommendation:", error);
      recommendationStore.set(userId, {
        recommendation: null,
        inProgress: false,
        timestamp: Date.now()
      });
      return;
    }
    
    // Validate that we have exactly 5 drivers and 2 constructors
    if (aiResponse.recommendedDrivers.length !== 5) {
      console.warn(`Warning: AI returned ${aiResponse.recommendedDrivers.length} drivers instead of 5`);
    }
    
    if (aiResponse.recommendedConstructors.length !== 2) {
      console.warn(`Warning: AI returned ${aiResponse.recommendedConstructors.length} constructors instead of 2`);
    }
    
    // Map driver and constructor names to full objects
    const recommendedDrivers = aiResponse.recommendedDrivers
      .map(driverName => 
        marketDrivers.find(d => d.name.toLowerCase() === driverName.toLowerCase()))
      .filter((d): d is SelectMarketDriver => d !== undefined);
      
    const recommendedConstructors = aiResponse.recommendedConstructors
      .map(constructorName => 
        marketConstructors.find(c => c.name.toLowerCase() === constructorName.toLowerCase()))
      .filter((c): c is SelectMarketConstructor => c !== undefined);
    
    // Verify team is under budget
    const recommendedTeamCost = [
      ...recommendedDrivers.map(d => d.price),
      ...recommendedConstructors.map(c => c.price)
    ].reduce((sum, price) => sum + price, 0);
    
    // Log for debugging
    console.log(`Recommended team cost: $${recommendedTeamCost.toFixed(1)}M (AI calculated: $${aiResponse.totalCost.toFixed(1)}M, Budget: $${FIXED_BUDGET}M)`);
    
    if (recommendedTeamCost > FIXED_BUDGET) {
      console.warn(`Warning: Recommended team exceeds budget by $${(recommendedTeamCost - FIXED_BUDGET).toFixed(1)}M`);
      
      // Add budget warning to the analysis
      const warningMessage = `⚠️ **Warning: The AI recommended a team that exceeds the budget by $${(recommendedTeamCost - FIXED_BUDGET).toFixed(1)}M**\n\n`;
      aiResponse.analysis = warningMessage + aiResponse.analysis;
    }
    
    // Construct the final recommendation
    const recommendation: Recommendation = {
      analysis: aiResponse.analysis,
      recommendedTeam: {
        drivers: recommendedDrivers,
        constructors: recommendedConstructors
      }
    };
    
    // Store the recommendation
    recommendationStore.set(userId, {
      recommendation,
      inProgress: false,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error in background recommendation generation:", error);
    
    // Reset in-progress flag on error
    const existingData = recommendationStore.get(userId);
    if (existingData) {
      recommendationStore.set(userId, {
        ...existingData,
        inProgress: false
      });
    }
  }
} 