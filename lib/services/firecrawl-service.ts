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
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: "https://fantasy.formula1.com/en/statistics/details?tab=driver&filter=fPoints",
        pageOptions: {
          onlyMainContent: true,
          waitForNetworkIdle: true
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to scrape driver data: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Add detailed logging
    console.log("Firecrawl driver response keys:", Object.keys(data))
    
    // Check for nested content in data.data
    let content = ""
    if (data.data && data.data.content) {
      content = data.data.content
    } else if (data.data && data.data.markdown) {
      content = data.data.markdown
    } else if (data.markdown) {
      content = data.markdown
    } else if (data.content) {
      content = data.content
    }
    
    console.log("Content available:", !!content, "Length:", content.length)
    
    if (!content) {
      console.error("No content field found in Firecrawl response:", JSON.stringify(data).slice(0, 300) + "...")
    } else {
      // Log the actual content
      console.log("Raw driver content preview:", content.substring(0, 300))
    }
    
    return content
  } catch (error) {
    console.error("Error scraping driver fantasy data:", error)
    throw new Error("Failed to scrape driver fantasy data")
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
          onlyMainContent: true,
          waitForNetworkIdle: true,
          javascript: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to scrape constructor data: ${response.statusText}`)
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
    
    // If the content is too short, try the alternative URL
    if (!content || content.length < 200) {
      console.log("First attempt yielded insufficient content, trying alternative URL...");
      
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
            javascript: true
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
      
      console.log("Alternative content available:", !!content, "Length:", content.length);
    }
    
    if (!content) {
      console.error("No content field found in any Firecrawl response:", JSON.stringify(data).slice(0, 300) + "...");
    } else {
      // Log the actual content
      console.log("Raw constructor content preview:", content.substring(0, 300));
    }
    
    return content;
  } catch (error) {
    console.error("Error scraping constructor fantasy data:", error);
    throw new Error("Failed to scrape constructor fantasy data");
  }
}

/**
 * Extract structured driver data from the scraped content using OpenAI with structured output
 */
export async function extractDriverData(content: string): Promise<DriverFantasyData[]> {
  try {
    if (!content || content.trim().length < 10) {
      throw new FantasyDataError("Empty or insufficient content received for drivers");
    }
    
    console.log("Raw driver content length:", content.length);
    console.log("Extracting driver data with AI using structured output...");
    
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
    
    // Add specific table markers if they don't exist
    if (!processedContent.includes("Drivers Table")) {
      processedContent = "## F1 Fantasy 2025 Drivers Table\n\n" + processedContent;
    }
    
    // Look for driver data in the markdown content or HTML
    const cleanContent = `
The F1 Fantasy 2025 driver data extracted from the website:

IMPORTANT - BELOW IS THE ACTUAL CONTENT TO EXTRACT FROM:
${processedContent}

NOTE: The following is just a template format example and NOT real data - DO NOT use these specific values:
Drivers Table FORMAT EXAMPLE (NOT REAL DATA):
1. Lando Norris, McLaren, $29.3M, 59 points
2. Andrea Kimi Antonelli, Mercedes, $19.0M, 32 points
3. Max Verstappen, Red Bull Racing, $28.5M, 29 points
4. George Russell, Mercedes, $21.1M, 25 points
5. Nico Hulkenberg, Kick Sauber, $7.0M, 20 points
`;
    
    // Define schema for structured output
    const driverSchema = {
      type: "object",
      properties: {
        drivers: {
          type: "array",
          description: "List of all F1 drivers with their current fantasy data",
          items: {
            type: "object",
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
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a specialized data extraction expert for Formula 1 Fantasy. 
          Your task is to extract F1 Fantasy driver data from the provided HTML or text content.
          The content may contain HTML tags, tables, or plain text, and you need to find and extract the driver information.
          
          Look for driver names, their teams, prices (in millions), and fantasy points.
          Return results in the specified JSON schema format with no explanations.
          
          If you can't find clear driver data in the content, return an empty array rather than making up data.
          
          IMPORTANT: Your task is to extract REAL data from the website content. 
          Any example data provided is ONLY for format reference and should NOT be returned unless it matches exactly what's in the actual content.
          
          Use the following JSON schema for your response:
          ${JSON.stringify(driverSchema, null, 2)}`
        },
        {
          role: "user",
          content: `Extract all driver data from the F1 Fantasy website content below. 
          
          The content may include HTML tags, tables, or text data. Look carefully for driver statistics containing:
          - Driver names
          - Team names
          - Price values (usually with $ and M, like $29.3M)
          - Points values (could be positive or negative numbers)
          
          Make sure to:
          - Extract ALL drivers listed (there should be approximately 20 drivers)
          - Keep exactly the same spelling and format of names
          - Return precise price values as numbers (e.g., 29.3, not "$29.3M")
          - Return exact points as numbers
          - Return an empty array if you can't find clear driver data
          
          IMPORTANT: I'm providing some formatting examples, but these are NOT the current data values.
          DO NOT copy these example values - they are ONLY to show the expected format.
          You must extract the ACTUAL current values from the content I'm providing.
          
          Format examples (NOT current data):
          1. Lando Norris, McLaren, 29.3, 59
          2. Andrea Kimi Antonelli, Mercedes, 19.0, 32
          
          Content to extract from:
          ${cleanContent}`
        }
      ],
      temperature: 0.1 // Lower temperature for more deterministic outputs
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new DataExtractionError("Empty response from OpenAI for driver data extraction");
    }
    
    try {
      const parsedData = JSON.parse(responseContent);
      
      if (!parsedData.drivers || !Array.isArray(parsedData.drivers) || parsedData.drivers.length === 0) {
        throw new DataExtractionError("Invalid or empty drivers array in OpenAI response");
      }
      
      // The response is already validated by OpenAI against our schema
      // but let's check data quality anyway
      if (parsedData.drivers.length < 5) {
        throw new DataExtractionError(`Only extracted ${parsedData.drivers.length} drivers, which seems too few`);
      }
      
      console.log("Extracted driver data with AI:", JSON.stringify(parsedData.drivers, null, 2));
      console.log("Number of drivers extracted with AI:", parsedData.drivers.length);
      
      return parsedData.drivers;
    } catch (e: any) {
      console.error("Error parsing AI response:", e);
      console.log("AI response content:", responseContent.substring(0, 500));
      throw new DataExtractionError(`Error parsing AI driver data response: ${e.message}`);
    }
  } catch (error: any) {
    console.error("Error extracting driver data with AI:", error);
    // Rethrow the error instead of returning fallback data
    if (error instanceof DataExtractionError || error instanceof FantasyDataError) {
      throw error;
    }
    throw new DataExtractionError(`Failed to extract driver data: ${error.message}`);
  }
}

/**
 * Extract structured constructor data from the scraped content using OpenAI with structured output
 */
export async function extractConstructorData(content: string): Promise<ConstructorFantasyData[]> {
  try {
    if (!content || content.trim().length < 10) {
      throw new FantasyDataError("Empty or insufficient content received for constructors");
    }
    
    console.log("Raw constructor content length:", content.length);
    console.log("Extracting constructor data with AI using structured output...");
    
    // Pre-process content to improve extraction quality
    let processedContent = content;
    
    // Check if we've received HTML content from Jina
    if (content.includes("<html") || content.includes("<!DOCTYPE")) {
      console.log("Received HTML content - extracting tables...");
      
      // Focus on content more likely to contain constructor data
      if (content.includes("constructor") && content.includes("points")) {
        // Extract just content with constructor tables
        processedContent = content;
      }
    }
    
    // Add specific table markers if they don't exist
    if (!processedContent.includes("Constructors Table")) {
      processedContent = "## F1 Fantasy 2025 Constructors Table\n\n" + processedContent;
    }
    
    // Look for constructor data in the markdown content or HTML
    const cleanContent = `
The F1 Fantasy 2025 constructor data extracted from the website:

IMPORTANT - BELOW IS THE ACTUAL CONTENT TO EXTRACT FROM:
${processedContent}

NOTE: The following is just a template format example and NOT real data - DO NOT use these specific values:
Constructors Table FORMAT EXAMPLE (NOT REAL DATA):
1. McLaren, $30.3M, 71 points
2. Mercedes, $23.0M, 67 points
3. Ferrari, $27.4M, 36 points
4. Red Bull Racing, $25.1M, 19 points
5. Haas, $7.6M, 14 points
`;
    
    // Define schema for structured output
    const constructorSchema = {
      type: "object",
      properties: {
        constructors: {
          type: "array",
          description: "List of all F1 constructors with their current fantasy data",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Full name of the constructor/team exactly as displayed"
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
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a specialized data extraction expert for Formula 1 Fantasy. 
          Your task is to extract F1 Fantasy constructor/team data from the provided HTML or text content.
          The content may contain HTML tags, tables, or plain text, and you need to find and extract the constructor information.
          
          Look for team names, their prices (in millions), and fantasy points.
          Return results in the specified JSON schema format with no explanations.
          
          If you can't find clear constructor data in the content, return an empty array rather than making up data.
          
          IMPORTANT: Your task is to extract REAL data from the website content. 
          Any example data provided is ONLY for format reference and should NOT be returned unless it matches exactly what's in the actual content.
          
          Use the following JSON schema for your response:
          ${JSON.stringify(constructorSchema, null, 2)}`
        },
        {
          role: "user",
          content: `Extract all constructor/team data from the F1 Fantasy website content below.
          
          The content may include HTML tags, tables, or text data. Look carefully for constructor statistics containing:
          - Team names (like "McLaren", "Ferrari", etc.)
          - Price values (usually with $ and M, like $30.3M)
          - Points values (could be positive or negative numbers)
          
          Make sure to:
          - Extract ALL constructors listed (there should be approximately 10 teams)
          - Keep exactly the same spelling and format of names
          - Return precise price values as numbers (e.g., 30.3, not "$30.3M")
          - Return exact points as numbers
          - Return an empty array if you can't find clear constructor data
          - Do NOT assume points values - only use what's in the data
          
          CRITICAL: DO NOT copy values from my examples. My examples are for format only.
          Only extract data that you actually see in the HTML/text content provided.
          
          Format examples (NOT current data):
          1. McLaren, 30.3, 71
          2. Mercedes, 23.0, 67
          
          Content to extract from:
          ${cleanContent}`
        }
      ],
      temperature: 0.1 // Lower temperature for more deterministic outputs
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new DataExtractionError("Empty response from OpenAI for constructor data extraction");
    }
    
    try {
      const parsedData = JSON.parse(responseContent);
      
      if (!parsedData.constructors || !Array.isArray(parsedData.constructors) || parsedData.constructors.length === 0) {
        throw new DataExtractionError("Invalid or empty constructors array in OpenAI response");
      }
      
      // The response is already validated by OpenAI against our schema
      // but let's check data quality anyway
      if (parsedData.constructors.length < 3) {
        throw new DataExtractionError(`Only extracted ${parsedData.constructors.length} constructors, which seems too few`);
      }
      
      console.log("Extracted constructor data with AI:", JSON.stringify(parsedData.constructors, null, 2));
      console.log("Number of constructors extracted with AI:", parsedData.constructors.length);
      
      return parsedData.constructors;
    } catch (e: any) {
      console.error("Error parsing AI response:", e);
      console.log("AI response content:", responseContent.substring(0, 500));
      throw new DataExtractionError(`Error parsing AI constructor data response: ${e.message}`);
    }
  } catch (error: any) {
    console.error("Error extracting constructor data with AI:", error);
    // Rethrow the error instead of returning fallback data
    if (error instanceof DataExtractionError || error instanceof FantasyDataError) {
      throw error;
    }
    throw new DataExtractionError(`Failed to extract constructor data: ${error.message}`);
  }
}

/**
 * Provides hardcoded F1 driver data as a fallback when API extraction fails
 * @deprecated Use only for development/testing, not in production
 */
function getFallbackDriverData(): DriverFantasyData[] {
  console.log("Using hardcoded F1 driver data for the 2025 season");
  return [
    { name: "Lando Norris", team: "McLaren", price: 29.3, points: 59 },
    { name: "Andrea Kimi Antonelli", team: "Mercedes", price: 19.0, points: 32 },
    { name: "Max Verstappen", team: "Red Bull Racing", price: 28.5, points: 29 },
    { name: "George Russell", team: "Mercedes", price: 21.1, points: 25 },
    { name: "Nico Hulkenberg", team: "Kick Sauber", price: 7.0, points: 20 },
    { name: "Alexander Albon", team: "Williams", price: 12.6, points: 17 },
    { name: "Lance Stroll", team: "Aston Martin", price: 8.7, points: 16 },
    { name: "Charles Leclerc", team: "Ferrari", price: 25.6, points: 12 },
    { name: "Oscar Piastri", team: "McLaren", price: 22.7, points: 10 },
    { name: "Esteban Ocon", team: "Haas", price: 7.5, points: 8 },
    { name: "Lewis Hamilton", team: "Ferrari", price: 23.9, points: 4 },
    { name: "Oliver Bearman", team: "Haas", price: 6.1, points: 2 },
    { name: "Pierre Gasly", team: "Alpine", price: 11.2, points: 1 },
    { name: "Yuki Tsunoda", team: "Racing Bulls", price: 9.0, points: -10 },
    { name: "Liam Lawson", team: "Red Bull Racing", price: 17.4, points: -17 },
    { name: "Gabriel Bortoleto", team: "Kick Sauber", price: 5.4, points: -18 },
    { name: "Carlos Sainz", team: "Williams", price: 12.5, points: -19 },
    { name: "Isack Hadjar", team: "Racing Bulls", price: 5.6, points: -20 },
    { name: "Jack Doohan", team: "Alpine", price: 6.6, points: -20 },
    { name: "Fernando Alonso", team: "Aston Martin", price: 8.2, points: -20 }
  ];
}

/**
 * Provides hardcoded F1 constructor data as a fallback when API extraction fails
 * @deprecated Use only for development/testing, not in production
 */
function getFallbackConstructorData(): ConstructorFantasyData[] {
  console.log("Using hardcoded F1 constructor data for the 2025 season");
  return [
    { name: "McLaren", price: 30.3, points: 71 },
    { name: "Mercedes", price: 23.0, points: 67 },
    { name: "Ferrari", price: 27.4, points: 36 },
    { name: "Red Bull Racing", price: 25.1, points: 19 },
    { name: "Haas", price: 7.6, points: 14 },
    { name: "Williams", price: 12.9, points: 10 },
    { name: "Kick Sauber", price: 5.6, points: 3 },
    { name: "Aston Martin", price: 16.5, points: -20 },
    { name: "Alpine", price: 14.2, points: -25 },
    { name: "Racing Bulls", price: 9.8, points: -30 }
  ];
} 