"use server"

/**
 * Service for scraping F1 Fantasy data using Firecrawl API
 */
import { openai } from "@/lib/openai"
import { DataExtractionError, FantasyDataError } from "./custom-errors"

const FIRECRAWL_API_KEY = "fc-24d9d966dd454f8aa41ceba018832a36"
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v0/scrape"

export interface DriverFantasyData {
  name: string
  team: string
  price: number
  points: number
}

export interface ConstructorFantasyData {
  name: string
  price: number
  points: number
}

/**
 * Scrape driver fantasy data from the F1 Fantasy website
 */
export async function scrapeDriverFantasyData(): Promise<string> {
  try {
    // First try with the default URL
    const defaultUrl = "https://fantasy.formula1.com/en/statistics/details?tab=driver&filter=fPoints";
    
    let response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: defaultUrl,
        pageOptions: {
          onlyMainContent: false, // Get full page content
          waitForNetworkIdle: true,
          javascript: true,
          timeout: 30000, // 30 second timeout
          waitFor: "table", // Wait for table elements to load
          screenshotOptions: {
            fullPage: true // For debugging
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to scrape driver data: ${response.statusText}`);
    }
    
    let data = await response.json();
    
    // Add detailed logging
    console.log("Firecrawl driver response keys:", Object.keys(data));
    
    // Check for nested content in data.data
    let content = "";
    if (data.data && data.data.content) {
      content = data.data.content;
    } else if (data.data && data.data.markdown) {
      content = data.data.markdown;
    } else if (data.markdown) {
      content = data.markdown;
    } else if (data.content) {
      content = data.content;
    }
    
    console.log("Content available:", !!content, "Length:", content.length);
    
    // If the content is too short, try with different options
    if (!content || content.length < 2000) {
      console.log("First attempt yielded insufficient content, trying with different options...");
      
      // Try again with different options
      response = await fetch(FIRECRAWL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: defaultUrl,
          pageOptions: {
            onlyMainContent: false, // Get the full page
            waitForNetworkIdle: true,
            javascript: true,
            timeout: 45000, // 45 second timeout
            waitFor: ".drivers-table, table", // Specific CSS selector for driver table
            waitForTimeout: 10000 // Wait 10 seconds after page load
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to scrape driver data with extended timeout: ${response.statusText}`);
      }
      
      data = await response.json();
      console.log("Alternative options response keys:", Object.keys(data));
      
      // Check for nested content again
      if (data.data && data.data.content) {
        content = data.data.content;
      } else if (data.data && data.data.markdown) {
        content = data.data.markdown;
      } else if (data.markdown) {
        content = data.markdown;
      } else if (data.content) {
        content = data.content;
      }
      
      console.log("Alternative content available:", !!content, "Length:", content.length);
    }
    
    // If content is still too short, try a completely different URL
    if (!content || content.length < 2000) {
      console.log("Second attempt yielded insufficient content, trying alternative URL...");
      
      // Try with the statistics page instead
      const alternativeUrl = "https://fantasy.formula1.com/en/statistics";
      
      response = await fetch(FIRECRAWL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: alternativeUrl,
          pageOptions: {
            onlyMainContent: false, // Get full page
            waitForNetworkIdle: true,
            javascript: true,
            timeout: 45000, // 45 second timeout
            waitFor: "table", // Wait for any table
            waitForTimeout: 15000 // Wait 15 seconds after page load
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to scrape driver data from alternative URL: ${response.statusText}`);
      }
      
      data = await response.json();
      console.log("Alternative URL response keys:", Object.keys(data));
      
      // Check for nested content again
      if (data.data && data.data.content) {
        content = data.data.content;
      } else if (data.data && data.data.markdown) {
        content = data.data.markdown;
      } else if (data.markdown) {
        content = data.markdown;
      } else if (data.content) {
        content = data.content;
      }
      
      console.log("Alternative URL content available:", !!content, "Length:", content.length);
    }
    
    if (!content) {
      console.error("No content field found in any Firecrawl response:", JSON.stringify(data).slice(0, 300) + "...");
    } else {
      // Log the actual content
      console.log("Raw driver content preview:", content.substring(0, 300));
      
      // Check for driver related keywords to validate content
      const hasDriverData = content.toLowerCase().includes("driver") && 
        (content.toLowerCase().includes("name") || content.toLowerCase().includes("points"));
      
      console.log("Content appears to contain driver data:", hasDriverData);
      
      // Log specific keywords to help debug
      console.log("Content contains 'driver table':", content.toLowerCase().includes("driver table"));
      console.log("Content contains 'fantasy points':", content.toLowerCase().includes("fantasy points"));
      console.log("Content contains table tags:", content.includes("<table"));
    }
    
    return content;
  } catch (error) {
    console.error("Error scraping driver fantasy data:", error);
    throw new Error("Failed to scrape driver fantasy data");
  }
}

/**
 * Scrape constructor fantasy data from the F1 Fantasy website
 */
export async function scrapeConstructorFantasyData(): Promise<string> {
  try {
    // First try with the default URL
    const defaultUrl = "https://fantasy.formula1.com/en/statistics/details?tab=constructor&filter=fPoints";
    
    let response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: defaultUrl,
        pageOptions: {
          onlyMainContent: false, // Get full page content
          waitForNetworkIdle: true,
          javascript: true,
          timeout: 30000, // 30 second timeout
          waitFor: "table", // Wait for table elements to load
          screenshotOptions: {
            fullPage: true // For debugging
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to scrape constructor data: ${response.statusText}`);
    }
    
    let data = await response.json();
    
    // Add detailed logging
    console.log("Firecrawl constructor response keys:", Object.keys(data));
    
    // Check for nested content in data.data
    let content = "";
    if (data.data && data.data.content) {
      content = data.data.content;
    } else if (data.data && data.data.markdown) {
      content = data.data.markdown;
    } else if (data.markdown) {
      content = data.markdown;
    } else if (data.content) {
      content = data.content;
    }
    
    console.log("Content available:", !!content, "Length:", content.length);
    
    // If the content is too short, try the alternative URL with different options
    if (!content || content.length < 2000) {
      console.log("First attempt yielded insufficient content, trying with different options...");
      
      // Try again with different options
      response = await fetch(FIRECRAWL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: defaultUrl,
          pageOptions: {
            onlyMainContent: false, // Get the full page
            waitForNetworkIdle: true,
            javascript: true,
            timeout: 45000, // 45 second timeout
            waitFor: ".constructors-table", // Specific CSS selector for constructor table
            waitForTimeout: 10000 // Wait 10 seconds after page load
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to scrape constructor data with extended timeout: ${response.statusText}`);
      }
      
      data = await response.json();
      console.log("Alternative options response keys:", Object.keys(data));
      
      // Check for nested content again
      if (data.data && data.data.content) {
        content = data.data.content;
      } else if (data.data && data.data.markdown) {
        content = data.data.markdown;
      } else if (data.markdown) {
        content = data.markdown;
      } else if (data.content) {
        content = data.content;
      }
      
      console.log("Alternative content available:", !!content, "Length:", content.length);
    }
    
    // If content is still too short, try a completely different URL
    if (!content || content.length < 2000) {
      console.log("Second attempt yielded insufficient content, trying alternative URL...");
      
      // Try with the statistics page instead
      const alternativeUrl = "https://fantasy.formula1.com/en/statistics";
      
      response = await fetch(FIRECRAWL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: alternativeUrl,
          pageOptions: {
            onlyMainContent: false, // Get full page
            waitForNetworkIdle: true,
            javascript: true,
            timeout: 45000, // 45 second timeout
            waitFor: "table", // Wait for any table
            waitForTimeout: 15000 // Wait 15 seconds after page load
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to scrape constructor data from alternative URL: ${response.statusText}`);
      }
      
      data = await response.json();
      console.log("Alternative URL response keys:", Object.keys(data));
      
      // Check for nested content again
      if (data.data && data.data.content) {
        content = data.data.content;
      } else if (data.data && data.data.markdown) {
        content = data.data.markdown;
      } else if (data.markdown) {
        content = data.markdown;
      } else if (data.content) {
        content = data.content;
      }
      
      console.log("Alternative URL content available:", !!content, "Length:", content.length);
    }
    
    if (!content) {
      console.error("No content field found in any Firecrawl response:", JSON.stringify(data).slice(0, 300) + "...");
    } else {
      // Log the actual content
      console.log("Raw constructor content preview:", content.substring(0, 300));
      
      // Check for constructors related keywords to validate content
      const hasConstructorData = content.toLowerCase().includes("constructor") && 
        (content.toLowerCase().includes("team") || content.toLowerCase().includes("points"));
      
      console.log("Content appears to contain constructor data:", hasConstructorData);
    }
    
    return content;
  } catch (error) {
    console.error("Error scraping constructor fantasy data:", error);
    throw new Error("Failed to scrape constructor fantasy data");
  }
}

/**
 * Helper function to clean response content from markdown code blocks that Claude might return
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

/**
 * Extract structured driver data from the scraped content using OpenRouter with structured output
 */
export async function extractDriverData(content: string): Promise<DriverFantasyData[]> {
  try {
    if (!content || content.trim().length < 10) {
      throw new FantasyDataError("Empty or insufficient content received for drivers");
    }
    
    // Pre-process content to improve extraction quality
    let processedContent = content;
    
    // Check if we've received HTML content from Jina
    if (content.includes("<html") || content.includes("<!DOCTYPE")) {
      console.log("Received HTML content - extracting tables...");
      
      // Focus on content more likely to contain driver data
      if (content.includes("driver") && content.includes("points")) {
        // Extract just content with driver tables
        processedContent = content;
      }
    }
    
    // Simplify the content and focus on extraction
    const cleanContent = processedContent.replace(/\r\n/g, '\n').trim();
    console.log("Raw driver content length:", cleanContent.length);
    
    console.log("Extracting driver data with Gemini AI using structured output...");
    
    // Define schema for structured output
    const driverSchema = {
      type: "object",
      properties: {
        drivers: {
          type: "array",
          description: "List of all F1 drivers with their current fantasy data",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: {
                type: "string",
                description: "Full name of the driver exactly as displayed"
              },
              team: {
                type: "string",
                description: "Team name exactly as displayed"
              },
              price: {
                type: "number",
                description: "Driver's price in millions without currency symbols (e.g., 29.3 not $29.3M)"
              },
              points: {
                type: "number",
                description: "Current fantasy points as an integer, can be negative (e.g., -17)"
              }
            },
            required: ["name", "team", "price", "points"]
          }
        }
      },
      required: ["drivers"]
    };
    
    // Use Gemini model
    const response = await openai.chat.completions.create({
      model: "google/gemini-pro-1.5",
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "driverData",
          strict: true,
          schema: driverSchema
        }
      },
      messages: [
        {
          role: "system",
          content: `You are a data extraction specialist that ONLY extracts real driver data from F1 Fantasy website content.
          
          <EXTRACTION_RULES>
          - ONLY extract REAL data that exists in the provided content
          - Look for tables, rows, or lists that contain driver information
          - Search for HTML tables and structured data in the content
          - Pay special attention to any tabular data with driver names and numbers
          - Search for price values that include $ or M (like $25.4M)
          - Carefully match the exact spelling of driver names and teams as they appear
          - Convert prices to numbers without currency symbols (29.3 not $29.3M)
          - Return points exactly as they appear in the data
          - F1 has approximately 20 drivers across 10 teams - be thorough in your search
          - IMPORTANT: You must extract any driver data you can find, even if incomplete
          - If you find any driver data at all, include it
          </EXTRACTION_RULES>
          
          <EXPECTED_DATA_FORMAT>
          The driver data is likely in a table or structured format with:
          - Driver names (e.g., "Max Verstappen", "Lewis Hamilton")
          - Team affiliations (e.g., "Red Bull Racing", "Mercedes")
          - Price values (usually with $ and M, like $29.3M)
          - Points values (numbers, possibly with + or - prefix)
          </EXPECTED_DATA_FORMAT>
          
          Make sure to look throughout the entire content, especially in table structures.
          Return your response in the exact schema requested with a "drivers" array.
          If you can't find enough information, at minimum return the drivers you can find.`
        },
        {
          role: "user",
          content: `<TASK>
          Extract all F1 Fantasy driver data from the content below. The content contains HTML or text from the F1 Fantasy website.
          
          F1 teams include: McLaren, Red Bull Racing, Mercedes, Ferrari, Williams, Haas, Alpine, Aston Martin, Kick Sauber, and Racing Bulls.
          
          Drivers might include names like: Max Verstappen, Lewis Hamilton, Charles Leclerc, Lando Norris, George Russell, etc.
          
          ANALYZE THOROUGHLY:
          - Look for table structures and rows
          - Check for lists of drivers with numerical data
          - Search for driver names followed by price information
          - Examine any sections containing points data
          - Look for numeric values near driver names
          - Pay special attention to areas containing both driver names and monetary values
          - Ensure you make a complete sweep of the entire document
          
          Your job is to extract all relevant driver data from the content. At minimum, try to find at least 
          a few drivers with their teams, prices and points.
          </TASK>
          
          <REAL_CONTENT_TO_EXTRACT_FROM>
          ${cleanContent}
          </REAL_CONTENT_TO_EXTRACT_FROM>`
        }
      ],
      temperature: 0.2,
      max_tokens: 100000
    });
    
    // Add detailed error handling and logging
    if (!response.choices?.length || !response.choices[0]) {
      console.error("Invalid response structure from OpenRouter:", response);
      throw new DataExtractionError("Invalid response structure from OpenRouter for driver data extraction");
    }
    
    const responseContent = response.choices[0].message?.content;
    if (!responseContent) {
      throw new DataExtractionError("Empty response from OpenRouter for driver data extraction");
    }
    
    // Log the raw response content to debug
    console.log("Raw AI response content:", responseContent.substring(0, 500) + (responseContent.length > 500 ? "..." : ""));
    
    try {
      // Clean the response content to handle markdown code blocks
      const cleanedContent = cleanResponseJson(responseContent);
      const parsedData = JSON.parse(cleanedContent);
      
      if (!parsedData.drivers || !Array.isArray(parsedData.drivers) || parsedData.drivers.length === 0) {
        console.error("Invalid or empty drivers array in OpenRouter response");
        console.log("Full OpenRouter response content:", responseContent);
        
        // Since we're focused on the primary method, we'll throw a clear error instead of using fallbacks
        throw new DataExtractionError("No driver data found in the content. The extraction returned an empty array.");
      }
      
      // Log the successful extraction
      console.log("Extracted driver data with AI:", JSON.stringify(parsedData.drivers, null, 2));
      console.log("Number of drivers extracted with AI:", parsedData.drivers.length);
      
      return parsedData.drivers;
    } catch (e: unknown) {
      console.error("Error parsing AI response:", e);
      console.log("AI response content:", responseContent);
      throw new DataExtractionError(`Error parsing AI driver data response: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (error: unknown) {
    console.error("Error extracting driver data with AI:", error);
    // Rethrow the error to the calling function
    if (error instanceof DataExtractionError || error instanceof FantasyDataError) {
      throw error;
    }
    throw new DataExtractionError(`Failed to extract driver data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract structured constructor data from the scraped content using OpenRouter with structured output
 */
export async function extractConstructorData(content: string): Promise<ConstructorFantasyData[]> {
  try {
    if (!content || content.trim().length < 100) {
      throw new Error("Constructor content is too short or empty");
    }
    
    // Clean and normalize the content
    const cleanContent = content.replace(/\r\n/g, '\n').trim();
    console.log("Raw constructor content length:", cleanContent.length);
    
    console.log("Extracting constructor data with AI using structured output...");

    const constructorSchema = {
      type: "object",
      properties: {
        constructors: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { 
                type: "string",
                description: "Full team name exactly as displayed (e.g., 'McLaren', 'Ferrari', etc.)"
              },
              price: { 
                type: "number",
                description: "Constructor's price in millions without currency symbols (e.g., 30.3 not $30.3M)"
              },
              points: { 
                type: "number",
                description: "Current fantasy points as an integer, can be negative (e.g., -20)"
              }
            },
            required: ["name", "price", "points"]
          }
        }
      },
      required: ["constructors"]
    };
    
    const response = await openai.chat.completions.create({
      model: "google/gemini-pro-1.5",
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "constructorData",
          strict: true,
          schema: constructorSchema
        }
      },
      messages: [
        {
          role: "system",
          content: `You are a data extraction specialist that ONLY extracts real constructor/team data from F1 Fantasy website content.
          
          <EXTRACTION_RULES>
          - ONLY extract REAL constructor data that exists in the provided content
          - NEVER hallucinate or make up data not present in the content
          - If you can't find specific information about a team, omit that team entirely
          - Maintain exact team name spelling as it appears in the content
          - Convert prices to numbers without currency symbols (30.6 not $30.6M)
          - Return points exactly as they appear in the data
          - F1 has exactly 10 teams - do not invent teams
          - Only return teams where you find actual price and points data
          </EXTRACTION_RULES>
          
          Your response must be valid JSON with a "constructors" array following the schema:
          ${JSON.stringify(constructorSchema, null, 2)}`
        },
        {
          role: "user",
          content: `<TASK>
          Extract all F1 constructor/team data from the content below. Look for:
          - Team names (e.g., McLaren, Ferrari, Red Bull Racing, etc.)
          - Price values (in millions, convert to number format)
          - Fantasy points
          
          ONLY extract data you can find in the content. Do NOT make up or hallucinate any data.
          If you're unsure about a value, OMIT that team entirely rather than guessing.
          It's better to return accurate data for fewer teams than to make up values.
          </TASK>
          
          <REAL_CONTENT_TO_EXTRACT_FROM>
          ${cleanContent}
          </REAL_CONTENT_TO_EXTRACT_FROM>`
        }
      ],
      temperature: 0.1 // Lower temperature for more deterministic extraction
    });
    
    // Add error handling for response structure
    if (!response.choices?.length || !response.choices[0]) {
      console.error("Invalid response structure from OpenRouter:", response);
      throw new Error("Invalid response structure from OpenRouter for constructor data extraction");
    }
    
    const responseContent = response.choices[0].message?.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenRouter for constructor data extraction");
    }
    
    try {
      // Clean the response content to handle markdown code blocks
      const cleanedContent = cleanResponseJson(responseContent);
      const parsedData = JSON.parse(cleanedContent);
      
      if (!parsedData.constructors || !Array.isArray(parsedData.constructors)) {
        console.error("Invalid constructors array in OpenRouter response");
        return []; // Return empty array instead of fallback data
      }
      
      // If constructors array is empty or too small, log warning but continue
      if (parsedData.constructors.length < 5) {
        console.error("Too few constructors found in OpenRouter response");
      }
      
      // Log the number of constructors found
      console.log("Extracted constructor data with AI:", JSON.stringify(parsedData.constructors, null, 2));
      console.log("Number of constructors extracted with AI:", parsedData.constructors.length);
      
      return parsedData.constructors;
    } catch (e: unknown) {
      console.error("Error parsing AI response:", e);
      console.log("AI response content:", responseContent.substring(0, 500));
      throw new Error(`Error parsing constructor data: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (error: unknown) {
    console.error("Error extracting constructor data with AI:", error);
    throw new Error(`Failed to extract constructor data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generic function to scrape any webpage with Firecrawl
 */
export async function scrapeWebpage(url: string): Promise<string> {
  try {
    console.log(`Scraping webpage ${url} with Firecrawl...`);
    
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: url,
        pageOptions: {
          onlyMainContent: false,
          waitForNetworkIdle: true,
          javascript: true,
          timeout: 30000, // 30 seconds
          waitFor: 'table',
          waitForTimeout: 10000, // 10 seconds
          screenshotOptions: {
            fullPage: true
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to scrape webpage ${url}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for nested content in data.data
    let content = "";
    if (data.data && data.data.content) {
      content = data.data.content;
    } else if (data.data && data.data.markdown) {
      content = data.data.markdown;
    } else if (data.markdown) {
      content = data.markdown;
    } else if (data.content) {
      content = data.content;
    }
    
    console.log(`Scraped content from ${url}, length: ${content.length}`);
    
    if (!content) {
      console.error(`No content found for ${url}`);
      console.error("Response keys:", Object.keys(data));
    }
    
    return content;
  } catch (error) {
    console.error(`Error scraping webpage ${url}:`, error);
    throw new Error(`Failed to scrape webpage ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
} 