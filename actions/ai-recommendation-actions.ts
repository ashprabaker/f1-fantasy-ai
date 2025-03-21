"use server"

import { openai } from "@/lib/openai";
import { ActionState } from "@/types";
import { SelectMarketDriver, SelectMarketConstructor, SelectDriver, SelectConstructor } from "@/db/schema";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

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

export async function generateTeamRecommendationsAction(
  teamData: TeamData,
  marketDrivers: SelectMarketDriver[],
  marketConstructors: SelectMarketConstructor[]
): Promise<ActionState<Recommendation>> {
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
    
    // Call OpenAI API with structured output format
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert F1 Fantasy advisor. Provide detailed analysis and recommendations for Fantasy F1 teams.
                   STRICT RULE: Your recommended team MUST stay under the budget limit of $${FIXED_BUDGET}M.
                   Your analysis should be written in Markdown format with proper headings, bullet points, and formatting.
                   Always calculate the total cost of your recommended team and verify it is under budget before responding.
                   Include performance insights and value analysis for each recommended driver and constructor.
                   You must return a properly structured JSON response with exactly 5 drivers and 2 constructors.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: zodResponseFormat(F1RecommendationSchema, "recommendation"),
      temperature: 0.7,
      max_tokens: 2000
    });
    
    // Extract the parsed response
    const aiResponse = completion.choices[0].message.parsed;
    
    // If parsed response is null, return an error
    if (!aiResponse) {
      return {
        isSuccess: false,
        message: "Failed to parse AI response"
      };
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
    
    return {
      isSuccess: true,
      message: "Recommendations generated successfully",
      data: recommendation
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return { isSuccess: false, message: "Failed to generate recommendations" };
  }
} 