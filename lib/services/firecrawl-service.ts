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
    } catch (e: unknown) {
      console.error("Error parsing AI response:", e);
      console.log("AI response content:", responseContent.substring(0, 500));
      throw new DataExtractionError(`Error parsing AI driver data response: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (error: unknown) {
    console.error("Error extracting driver data with AI:", error);
    // Rethrow the error instead of returning fallback data
    if (error instanceof DataExtractionError || error instanceof FantasyDataError) {
      throw error;
    }
    throw new DataExtractionError(`Failed to extract driver data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract structured constructor data from the scraped content using OpenAI with structured output
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
      model: process.env.OPENAI_MODEL || "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert data extraction specialist that can find team/constructor data even in messy HTML content. 
          Your sole purpose is to extract F1 Fantasy constructor data from webpages that may have complex structures.
          
          IMPORTANT: Thoroughly examine the entire content for constructor/team data, even if it's buried deep in tables or divs.
          Look for patterns of team names followed by prices ($XX.XM) and points values.
          
          If the data is unclear or ambiguous, make your best effort to extract what's available.
          
          NEVER return a template example - only extract real data found in the content.
          Try VERY HARD to find at least some teams in the content.
          
          Return the data in JSON format that matches this schema: ${JSON.stringify(constructorSchema)}
          `
        },
        {
          role: "user",
          content: `Extract ALL constructor/team data from this F1 Fantasy content and return it as JSON. 
          
          The content contains team names, prices, and fantasy points, but they might be dispersed throughout the page.
          Look for rows or sections containing information about the 10 F1 teams.
          
          Team names will be like: McLaren, Ferrari, Red Bull Racing, Mercedes, etc.
          Prices typically appear with dollar signs and 'M' for millions, like $30.3M
          Points can be positive or negative numbers.
          
          The content may be in HTML format with tables, divs, or other structures.
          
          BE THOROUGH - search the content exhaustively for team data.
          USE YOUR BEST JUDGMENT to identify team data patterns.
          
          If the content quality is poor, still extract whatever partial team data you can find.
          
          Format examples (NOT current data - DO NOT COPY THESE VALUES):
          1. McLaren, 30.3, 71
          2. Mercedes, 23.0, 67
          
          Content to extract from:
          ${cleanContent}`
        }
      ],
      temperature: 0.3 // Higher temperature for more creativity in extraction
    });
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI for constructor data extraction");
    }
    
    try {
      const parsedData = JSON.parse(responseContent);
      
      if (!parsedData.constructors || !Array.isArray(parsedData.constructors)) {
        console.error("Invalid constructors array in OpenAI response");
        console.log("AI response content:", responseContent);
        throw new Error("Invalid constructors array format");
      }
      
      // If constructors array is empty, throw an error
      if (parsedData.constructors.length === 0) {
        console.error("Empty constructors array in OpenAI response");
        console.log("AI response content:", responseContent);
        throw new Error("No constructors found in content");
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
 * @unused
 * @eslint-disable @typescript-eslint/no-unused-vars
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * @unused
 * @eslint-disable @typescript-eslint/no-unused-vars
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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