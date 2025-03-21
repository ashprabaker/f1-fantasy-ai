"use strict";
"use server";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/services/fantasy-scraper.ts
var fantasy_scraper_exports = {};
__export(fantasy_scraper_exports, {
  scrapeF1FantasyData: () => scrapeF1FantasyData,
  testF1FantasyScraper: () => testF1FantasyScraper
});
module.exports = __toCommonJS(fantasy_scraper_exports);
var import_playwright_core = require("playwright-core");
var BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY || "bb_live_PihgjiForhZcZcMBfT9Y_s6T_V8";
var BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID || "4c975589-ce65-4d8f-b2cd-3c241bc97eb1";
var F1_FANTASY_URL = "https://fantasy.formula1.com/en/create-team";
async function createBrowserbaseSession() {
  console.log("Creating Browserbase session...");
  try {
    const response = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: {
        "x-bb-api-key": BROWSERBASE_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectId: BROWSERBASE_PROJECT_ID
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Browserbase session: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log("Browserbase session created:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error creating Browserbase session:", error);
    throw error;
  }
}
async function scrapeF1FantasyData() {
  var _a, _b;
  console.log("Fetching F1 Fantasy data...");
  let sessionId = null;
  let browser = null;
  try {
    sessionId = await createBrowserbaseSession();
    browser = await import_playwright_core.chromium.connectOverCDP(
      `wss://connect.browserbase.com?apiKey=${BROWSERBASE_API_KEY}&sessionId=${sessionId}`
    );
    const defaultContext = browser.contexts()[0];
    const page = defaultContext.pages()[0];
    console.log("Navigating to F1 Fantasy site...");
    await page.goto(F1_FANTASY_URL, { waitUntil: "networkidle", timeout: 3e4 });
    await page.screenshot({ path: "/tmp/f1-fantasy-landing.png" });
    console.log("Saved screenshot to /tmp/f1-fantasy-landing.png");
    console.log("Fetching driver data from API...");
    const playersResponse = await page.evaluate(async () => {
      try {
        const response = await fetch("https://fantasy.formula1.com/api/public/game/players");
        if (!response.ok) throw new Error(`API response error: ${response.status}`);
        return await response.json();
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    });
    const constructorsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch("https://fantasy.formula1.com/api/public/game/teams");
        if (!response.ok) throw new Error(`API response error: ${response.status}`);
        return await response.json();
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    });
    console.log("API responses received:", {
      playersResponseKeys: Object.keys(playersResponse || {}),
      constructorsResponseKeys: Object.keys(constructorsResponse || {})
    });
    const drivers = [];
    if (playersResponse && playersResponse.players) {
      for (const player of playersResponse.players) {
        drivers.push({
          id: ((_a = player.id) == null ? void 0 : _a.toString()) || "",
          name: player.last_name ? `${player.first_name} ${player.last_name}` : player.name || "Unknown Driver",
          team: player.team_name || "",
          price: parseFloat(player.price || "0"),
          fantasyPoints: parseFloat(player.season_score || "0"),
          teamLogo: player.team_logo || "",
          driverImage: player.image || ""
        });
      }
    } else {
      console.log("No player data from API, trying alternative extraction...");
      const extractedPlayerData = await page.evaluate(() => {
        const scriptData = Array.from(document.querySelectorAll("script")).map((script) => script.textContent || "").filter((content) => content.includes("player") || content.includes("driver")).join("\n");
        const playerMatches = scriptData.match(/player[^{]*{[^}]*}/g) || [];
        const driverMatches = scriptData.match(/driver[^{]*{[^}]*}/g) || [];
        return {
          playerMatches,
          driverMatches,
          hasPlayersData: scriptData.includes("players:"),
          hasDriversData: scriptData.includes("drivers:")
        };
      });
      console.log("Alternative extraction results:", extractedPlayerData);
    }
    const constructors = [];
    if (constructorsResponse && constructorsResponse.teams) {
      for (const team of constructorsResponse.teams) {
        constructors.push({
          id: ((_b = team.id) == null ? void 0 : _b.toString()) || "",
          name: team.name || "Unknown Team",
          price: parseFloat(team.price || "0"),
          fantasyPoints: parseFloat(team.season_score || "0"),
          teamLogo: team.logo || ""
        });
      }
    } else {
      console.log("No constructor data from API");
    }
    console.log(`Extracted ${drivers.length} drivers and ${constructors.length} constructors`);
    return {
      drivers,
      constructors,
      lastUpdated: /* @__PURE__ */ new Date()
    };
  } catch (error) {
    console.error("Error scraping F1 Fantasy data:", error);
    return {
      drivers: [],
      constructors: [],
      lastUpdated: /* @__PURE__ */ new Date()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
    if (sessionId) {
      try {
        await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
          method: "DELETE",
          headers: {
            "x-bb-api-key": BROWSERBASE_API_KEY
          }
        });
        console.log("Browserbase session cleaned up");
      } catch (e) {
        console.error("Error cleaning up Browserbase session:", e);
      }
    }
  }
}
async function testF1FantasyScraper() {
  try {
    console.log("Testing F1 Fantasy scraper...");
    const data = await scrapeF1FantasyData();
    console.log("F1 Fantasy data scraped:");
    console.log(`- Drivers: ${data.drivers.length}`);
    console.log(`- Constructors: ${data.constructors.length}`);
    if (data.drivers.length > 0) {
      console.log("\nExample driver:");
      console.log(data.drivers[0]);
    }
    if (data.constructors.length > 0) {
      console.log("\nExample constructor:");
      console.log(data.constructors[0]);
    }
    return data;
  } catch (error) {
    console.error("Error testing F1 Fantasy scraper:", error);
    throw error;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  scrapeF1FantasyData,
  testF1FantasyScraper
});
