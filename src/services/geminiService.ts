

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisReport, PlayerData } from '../types';

// Access API_KEY from import.meta.env for Vite projects
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY environment variable is not set. Please configure it in your .env file and on your deployment platform (e.g., Vercel) to use STREAKSENSE.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const analysisModelName = 'gemini-2.5-flash-preview-04-17';
const chatModelName = 'gemini-2.5-flash-preview-04-17'; 


// --- For Analysis Report ---
const ROLE_BLOCK_CONTENT_ANALYSIS = `You are STREAKSENSE, an expert Major League Baseball (MLB) data analyst and a specialized API. Your sole purpose is to provide a detailed player performance analysis report for the "Beat the Streak" fantasy game. You are precise, data-driven, and provide your output in a strict JSON format.`;
const CONTEXT_BLOCK_CONTENT = (date: string, humanReadableDate: string) => `The user requires a comprehensive analysis report for MLB games scheduled on ${date} (formatted as ${humanReadableDate}). The report is used to identify top player picks for the "Beat the Streak" game, where the goal is to select a player who will get at least one hit. Your analysis must be deep, incorporating a wide range of metrics to justify your selections.`;

const RULES_BLOCK_CONTENT = `1.  **JSON Only:** Your entire response MUST be a single, valid JSON object. It must start with '{' and end with '}'. Do not include any introductory text, explanations, apologies, or markdown code fences like \`\`\`json.
2.  **Exactly 5 Recommendations:** The "recommendations" array in the JSON MUST contain exactly 5 player objects. No more, no less.
3.  **Complete Data Population & \`playerSpecificVerdict\` Formatting:**
    -   All fields listed in the main part of the schema (excluding those explicitly noted as optional examples like specific chart data that might be omitted if not applicable) MUST be populated with a valid, non-null, and non-empty value of the correct type.
    -   **MLB ID is CRITICAL:** For each player in \`recommendations\`, you MUST attempt to find and include their official MLB Player ID in the \`mlbId\` field. This ID is typically found in the URL of their player page on MLB.com (e.g., for Freddie Freeman, ID 518692 is from \`https://www.mlb.com/player/freddie-freeman-518692\`). Providing \`mlbId\` is highly preferred over \`imageUrl\` for accurate image sourcing. If \`mlbId\` is found, you do not need to provide \`imageUrl\`. If \`mlbId\` cannot be found, you may provide \`imageUrl\` as a fallback, ensuring it is accurate and publicly accessible.
    -   \`executiveSummary.keyTableSynopsis.data\` MUST contain data for the 5 recommended players.
    -   **Shared Radar Chart Keys:** For \`hitterStrengths\` and \`pitcherProfile\` in the \`synthesis\` object of each recommendation, you MUST use the following 5-6 keys consistently: "Contact", "Power", "Discipline", "AvoidK", "Speed", "Adaptability". Populate these with percentile scores (0-100).
    -   **\`playerSpecificVerdict\` Formatting and Content:** This field is CRITICAL and requires specific Markdown structure:
        1.  Start with a main title using \`##\`, e.g., \`## Deep Dive Analysis for [Player Name]\`.
        2.  Follow with exactly four main section subtitles using \`###\`:
            -   \`### A. Core Performance & Platoon Dominance\`
            -   \`### B. Statcast Validation\`
            -   \`### C. The Matchup Analysis\`
            -   \`### D. Models & Final Verdict\`
        3.  **Under each \`###\` subtitle, provide detailed narrative text as plain paragraphs.** These paragraphs MUST NOT be prefixed with any heading markers (e.g., do not use \`##\`, \`###\`, or \`####\` for these narrative blocks).
        4.  Within these narratives, you can use \`**bold text**\`, \`*italic text*\`, and unordered lists (starting with \`-\` or \`*\`) for items like stats or model outputs.
        5.  Refer to the example for \`playerSpecificVerdict\` in the \`<SCHEMA>\` section for guidance on the expected content for each section, including batter's last game performance, pitcher's throwing hand, detailed pitcher stats (K/9, BB/9, HR/9, common pitches), and comprehensive BvP data.
4.  **Data Accuracy:** All data, including stats, probabilities, and player details, should be as accurate as possible for the given date.
5.  **Full Team Names:** For all 'team' fields in the JSON (e.g., player's team, opposing pitcher's team), use the full team name (e.g., "Los Angeles Dodgers", "New York Yankees", "Houston Astros"). Do not use abbreviations like "LAD", "NYY", "HOU".
6.  **General Markdown Usage:** For fields allowing Markdown (primarily \`playerSpecificVerdict\`), strictly adhere to the formatting rules specified (e.g., Rule 3 for \`playerSpecificVerdict\`). Use \`**bold text**\` and \`*italic text*\` for emphasis, and unordered lists (lines starting with \`-\` or \`*\`) for lists of items. Do not introduce other complex Markdown elements unless specified.`;

const SCHEMA_BLOCK_CONTENT = (humanReadableDate: string) => `You MUST generate a JSON object that strictly adheres to the following structure. All string values must be properly escaped.

{
  "reportTitle": "STREAKSENSE Daily Briefing",
  "date": "${humanReadableDate}",
  "executiveSummary": {
    "situationalOverview": "Provide a concise overview of the day's MLB slate, key matchups, and any overarching themes or trends relevant to player performance.",
    "keyTableSynopsis": {
      "headers": ["Player", "Team", "Pos", "Composite Prob.", "Neural Net Prob.", "Streak (Games)"],
      "data": [
        // Populate with data for the 5 recommended players
        {
          "player": "Name of 1st Recommended Player", "team": "Full Team Name", "pos": "Pos",
          "compositeProb": "Prob%", "modelXProb": "Prob%", "streak": "5"
        }
        // ... (4 more players, using full team names)
      ]
    }
  },
  "recommendations": [
    {
      "player": "Shohei Ohtani (Example Player)",
      "mlbId": "660271 (Example: Official MLB Player ID)",
      "team": "Los Angeles Dodgers (Example: Full Team Name)",
      "position": "DH (Example Position)",
      "imageUrl": "Optional fallback URL if mlbId cannot be found",
      "playerSpecificVerdict": "## Deep Dive Analysis for Shohei Ohtani\\n\\n### A. Core Performance & Platoon Dominance\\n(Provide a narrative discussing Ohtani's current season performance, hitting streaks including average during streak, **last game performance (e.g., '2-for-4, HR')**, any notable platoon splits (vs LHP/RHP), and overall offensive profile. Include key supporting stats inline or as a short list. Example: Ohtani is hitting .315 with a 1.050 OPS this season. He is currently on a **7-game hitting streak (10-for-28, .357 AVG)**. In his last game, he went 2-for-5 with a double. Against RHP, he boasts a 1.100 OPS...)\\n\\n### B. Statcast Validation\\n(Discuss Ohtani's key Statcast metrics. Describe why these metrics support his selection. Examples: Hard Hit %, Barrel %, xwOBA, Avg Exit Velocity. Mention percentiles if available. Example: His xwOBA of .420 ranks in the 95th percentile, indicating elite quality of contact...)\\n\\n### C. The Matchup Analysis\\n(Detail the matchup against the opposing starting pitcher. Include pitcher's full name, **throwing hand (LHP/RHP)**, team (full name), relevant stats like ERA, WHIP, **K/9, BB/9, HR/9, and common pitch types (e.g., Fastball, Slider, Curveball)**. Discuss **comprehensive BvP history: At-bats (AB), Hits (H), Doubles (2B), Triples (3B), Home Runs (HR), RBIs, Walks (BB), Strikeouts (K), and the calculated BA/OBP/SLG from these encounters.** Example: 'Tonight, Ohtani faces RHP John 'The Hurler' Doe (LHP, 3.50 ERA, 1.15 WHIP, 9.5 K/9, primary pitches: Sinker, Slider). Ohtani is 3-for-7 lifetime (.429 BA / .429 OBP / .857 SLG) against Doe, with 1 HR and 2 RBI.' Analyze Park Factors for the game venue and relevant Weather Conditions. Example: The game is at Petco Park, which is generally pitcher-friendly, but the wind is blowing out...)\\n\\n### D. Models & Final Verdict\\n(Include probabilities or insights from any predictive models you are simulating. Provide a concise final verdict statement summarizing why Ohtani is a strong pick. Include a brief risk assessment. Example: Our primary model gives Ohtani an 85% hit probability. **Verdict:** Ohtani's elite skills and favorable specific matchup elements make him a top recommendation. **Risk:** Low, given consistent performance, though the opposing pitcher has been effective recently.)",
      "corePerformance": {
        "slashLine2025": ".310/.405/.650", "OPS2025": "1.055",
        "activeHittingStreak": {"games": "5", "details": "5-game hitting streak (9-for-22, .409 AVG)"},
        "lastGamePerformance": "2-for-4, 1 HR, 2 RBI (Example: Batter's last game stats)"
      },
      "statcastValidation": [ 
          {"label": "Hard Hit %", "value": "55.2%", "percentile": 92},
          {"label": "xwOBA", "value": ".410", "percentile": 94}
      ],
      "matchup": {
        "pitcher": "Logan Webb", "team": "San Francisco Giants (Example: Full Team Name)", "ERA": "3.10", "WHIP": "1.05", "battingAverageAgainst": ".235",
        "pitchVulnerabilities": [ {"pitchType": "Sinker", "vulnerabilityScore": 0.18} ]
      },
      "synthesis": { 
        "predictiveModels": [ {"modelName": "STREAKSENSE Alpha", "probability": "87.0%"} ],
        "BvPHistory": "5-for-12 (.417), 2 HR vs Webb",
        "parkFactors": {"venue": "Dodger Stadium", "historicalTendency": "Slightly Hitter-Friendly"},
        "weatherConditions": {"forecast": "Clear, 72°F, Wind 5mph L to R"},
        "hitterStrengths": { "Contact": 85, "Power": 92, "Discipline": 78, "AvoidK": 88, "Speed": 70, "Adaptability": 80 },
        "pitcherProfile": { "Contact": 60, "Power": 55, "Discipline": 65, "AvoidK": 70, "Speed": 40, "Adaptability": 75 },
        "hitterRadarMetrics": { "xBA": 88, "HardHitPct": 92, "AvgExitVelo": 94, "BarrelPct": 85, "ChaseRate": 70, "WhiffPct": 75 }
      },
      "finalVerdict": {
        "compositeHitProbability": 88.5
      }
    }
    // ... (4 more player recommendations following this detailed structure, including mlbId, full team names, and detailed playerSpecificVerdict)
  ],
  "watchListCautionaryNotes": {
    "honorableMentions": [
      { "player": "Example Player", "team": "Full Team Name", "description": "Reason.", "compositeHitProbability": 72.3 }
    ],
    "ineligiblePlayersToNote": [
      { "player": "Example Player", "team": "Full Team Name", "reason": "Reason." }
    ]
  }
}`;

const TASK_BLOCK_CONTENT = (humanReadableDate: string) => `Now, generate the complete, valid JSON report for ${humanReadableDate} following all the rules and the exact schema provided above. Your entire output must be the JSON object itself, containing exactly 5 unique player recommendations. Each player MUST have an 'mlbId' if retrievable. Each player's 'team' and 'matchup.team' fields must be full team names. The \`playerSpecificVerdict\` for each recommendation must be a comprehensive, multi-section analysis formatted with Markdown as per Rule 3, including detailed pitcher information, BvP stats, and batter's last game performance.`;


const constructAnalysisPrompt = (date: string, humanReadableDate: string): string => {
  return `<ROLE>
${ROLE_BLOCK_CONTENT_ANALYSIS}
</ROLE>
<CONTEXT>
${CONTEXT_BLOCK_CONTENT(date, humanReadableDate)}
</CONTEXT>
<RULES>
${RULES_BLOCK_CONTENT}
</RULES>
<SCHEMA>
${SCHEMA_BLOCK_CONTENT(humanReadableDate)}
</SCHEMA>
<TASK>
${TASK_BLOCK_CONTENT(humanReadableDate)}
</TASK>`;
};

export const fetchAnalysisForDate = async (date: string, humanReadableDate: string): Promise<AnalysisReport> => {
  const prompt = constructAnalysisPrompt(date, humanReadableDate);
  try {
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: analysisModelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }], 
        config: {
             responseMimeType: "application/json",
             temperature: 0.4,
        },
    });
    
    let jsonText = result.text;

    if (!jsonText) {
      console.error("Received empty or undefined text response from AI for analysis.");
      if (result && result.candidates && result.candidates.length > 0) {
        console.error("AI Analysis Response Candidate Details:", JSON.stringify(result.candidates[0], null, 2).substring(0,1000));
        if (result.candidates[0].finishReason !== 'STOP') {
             throw new Error(`AI analysis generation stopped prematurely due to: ${result.candidates[0].finishReason}. Check safety ratings or prompt complexity.`);
        }
      } else {
         console.error("Full AI Analysis Response (if available):", JSON.stringify(result, null, 2).substring(0, 1000));
      }
      throw new Error("Received empty response from AI for analysis. Check console for details.");
    }

    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonText.match(fenceRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }
    
    if (!jsonText.startsWith('{') && jsonText.includes('{')) {
        jsonText = jsonText.substring(jsonText.indexOf('{'));
    }
    if (!jsonText.endsWith('}') && jsonText.includes('}')) {
        jsonText = jsonText.substring(0, jsonText.lastIndexOf('}') + 1);
    }

    try {
      const parsedData: AnalysisReport = JSON.parse(jsonText);
      if (!parsedData.recommendations || parsedData.recommendations.length === 0) {
        console.warn("Parsed analysis data is missing 'recommendations' or has zero items. Prompt asked for 5.", parsedData);
      } else if (parsedData.recommendations.length !== 5) {
        console.warn(`Parsed analysis data has ${parsedData.recommendations.length} recommendations, but prompt asked for 5.`, parsedData);
      }

      if (parsedData.recommendations && parsedData.recommendations.some(p => !p.playerSpecificVerdict || p.playerSpecificVerdict.length < 50)) {
         console.warn("Some recommendations have very short or missing 'playerSpecificVerdict'.", parsedData.recommendations.map(p=> ({player: p.player, verdictLength: p.playerSpecificVerdict?.length || 0 })));
      }
      // App.tsx will now handle stamping fetchedAt on recommendations
      return parsedData;
    } catch (e) {
      console.error("Failed to parse JSON analysis response:", e);
      console.error("Problematic JSON analysis string attempt:", jsonText.substring(0,1000) + "...");
      throw new Error(`Failed to parse analysis data from AI. Raw response snippet: ${jsonText.substring(0,500)}...`);
    }

  } catch (error) {
    console.error('Error fetching analysis data from Gemini:', error);
    if (typeof error === 'object' && error !== null) {
        if ('message' in error) console.error('Error message:', (error as Error).message);
    }

    let errorMessage = "Failed to fetch analysis data.";
    if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("candidate") || errorMessage.includes("block") || errorMessage.includes("safety") || errorMessage.includes("finishReason")) { 
            errorMessage = "The AI model's analysis response was blocked or incomplete, possibly due to safety settings, content policy, or prompt complexity. Please try a different date or simplify the request if this persists.";
        } else if (errorMessage.includes("API key")) {
            errorMessage = "Invalid API Key. Please check your VITE_API_KEY configuration.";
        }
    } else {
        errorMessage = `An unknown error occurred: ${String(error)}`;
    }
    throw new Error(errorMessage);
  }
};

// --- For Player Research Chat (Text Response) ---
const PLAYER_RESEARCH_SYSTEM_INSTRUCTION = `You are a helpful and knowledgeable MLB (Major League Baseball) Player Research Assistant.
Users will ask you questions about MLB players, including stats, recent performance, matchups, strengths, weaknesses, or comparisons.
Provide concise, accurate, and informative answers based on your knowledge up to your last training data.
Format your answers clearly. Use Markdown for light formatting like **bolding** key terms or player names, and bullet points for lists if appropriate.
Do not make unsolicited pick recommendations for "Beat the Streak" or any other game unless the user explicitly asks you to evaluate a player *based on specific criteria they provide for such a game*.
If you don't know an answer or if it's beyond your capabilities (e.g., real-time scores), say so politely.
Keep responses focused on the user's query. Be friendly and conversational.
When providing information about a player, try to include their full team name and MLB ID if you know it. For example, "Shohei Ohtani (Los Angeles Dodgers, mlbId: 660271)".
`;

export const fetchPlayerResearchResponse = async (userQuery: string, playerNameContext?: string): Promise<string> => {
  let prompt = userQuery;
  if (playerNameContext) {
    prompt = `Regarding ${playerNameContext}: ${userQuery}`;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: chatModelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: PLAYER_RESEARCH_SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      }
    });

    if (!response.text) {
      console.error("Received empty or undefined text response from AI for chat.");
       if (response && response.candidates && response.candidates.length > 0) {
        console.error("AI Chat Response Candidate Details:", JSON.stringify(response.candidates[0], null, 2).substring(0,1000));
        if (response.candidates[0].finishReason !== 'STOP') {
             return `I'm sorry, I couldn't fully process that. It seems the response was cut short due to: ${response.candidates[0].finishReason}. Could you try rephrasing?`;
        }
      } else {
         console.error("Full AI Chat Response (if available):", JSON.stringify(response, null, 2).substring(0,1000));
      }
      return "I'm sorry, I couldn't generate a response right now. Please try again.";
    }
    return response.text;
  } catch (error) {
    console.error('Error fetching player research response from Gemini:', error);
     if (typeof error === 'object' && error !== null) {
        if ('message' in error) console.error('Error message:', (error as Error).message);
    }
    let friendlyMessage = "I'm having trouble connecting to my knowledge base at the moment. Please try again in a few moments.";
    if (error instanceof Error) {
        if (error.message.includes("candidate") || error.message.includes("block") || error.message.includes("safety") || error.message.includes("finishReason")) {
            friendlyMessage = "Sorry, my response was blocked or incomplete. This might be due to safety filters. Try rephrasing your question.";
        } else if (error.message.includes("API key")) {
            friendlyMessage = "There seems to be an issue with the API configuration. Please contact support.";
        }
    }
    return friendlyMessage;
  }
};

// --- For Structured Player Report from Chat Context ---
const SINGLE_PLAYER_SCHEMA_BLOCK_CONTENT = (playerName: string, humanReadableDate: string) => `
You MUST generate a JSON object for the player "${playerName}" for the date ${humanReadableDate} that strictly adheres to the PlayerData structure below.
All string values must be properly escaped. Provide as much detail as possible for each field based on your knowledge.

{
  "player": "${playerName}",
  "mlbId": "Attempt to find and include their official MLB Player ID (e.g., '660271')",
  "team": "Full Team Name (e.g., 'Los Angeles Dodgers')",
  "position": "Player's primary position (e.g., 'DH', 'SS', 'OF')",
  "imageUrl": "Optional: A direct URL to a headshot if mlbId is not found. Prefer mlbId.",
  "playerSpecificVerdict": "## Deep Dive Analysis for ${playerName}\\n\\n### A. Core Performance & Platoon Dominance\\n(Provide a narrative discussing the player's current season performance, hitting streaks including average during streak, **last game performance (e.g., '2-for-4, HR')**, any notable platoon splits (vs LHP/RHP), and overall offensive profile. Include key supporting stats inline or as a short list.)\\n\\n### B. Statcast Validation\\n(Discuss key Statcast metrics like Hard Hit %, Barrel %, xwOBA, Avg Exit Velocity. Mention percentiles if available.)\\n\\n### C. The Matchup Analysis\\n(Detail the matchup against the likely opposing starting pitcher for ${humanReadableDate}. Include pitcher's full name, **throwing hand (LHP/RHP)**, team (full name), relevant stats like ERA, WHIP, **K/9, BB/9, HR/9, common pitch types**. Discuss **comprehensive BvP history if available: At-bats (AB), Hits (H), Doubles (2B), Triples (3B), Home Runs (HR), RBIs, Walks (BB), Strikeouts (K), and the calculated BA/OBP/SLG.** Analyze Park Factors for the game venue and relevant Weather Conditions.)\\n\\n### D. Models & Final Verdict\\n(Include probabilities or insights from any predictive models you are simulating. Provide a concise final verdict statement summarizing why this player is a strong or weak consideration for a hit on ${humanReadableDate}. Include a brief risk assessment.)",
  "corePerformance": {
    "slashLine2025": "Season Slash Line (e.g., '.310/.405/.650')", 
    "OPS2025": "Season OPS (e.g., '1.055')",
    "activeHittingStreak": {"games": "Number or 'N/A'", "details": "Details if streak exists (e.g., '5-game hitting streak (9-for-22, .409 AVG)')"},
    "lastGamePerformance": "Player's performance in their most recent game (e.g., '2-for-4, 1 HR, 2 RBI')"
  },
  "statcastValidation": [ 
      {"label": "Hard Hit %", "value": "Value%", "percentile": 0},
      {"label": "xwOBA", "value": ".Value", "percentile": 0}
      // Add other relevant statcast metrics if available
  ],
  "matchup": {
    "pitcher": "Likely Opposing Starting Pitcher's Name or 'TBD'", 
    "team": "Opposing Pitcher's Full Team Name or 'TBD'", 
    "ERA": "Pitcher's ERA", "WHIP": "Pitcher's WHIP", "battingAverageAgainst": "Pitcher's BAA",
    "pitchVulnerabilities": [ {"pitchType": "Sinker", "vulnerabilityScore": 0.0} ] // Optional examples
  },
  "synthesis": { 
    "predictiveModels": [ {"modelName": "STREAKSENSE Simulated", "probability": "Hit Probability%"} ],
    "BvPHistory": "BvP stats vs likely pitcher (e.g., '5-for-12 (.417), 2 HR vs Webb') or 'N/A'",
    "parkFactors": {"venue": "Game Venue", "historicalTendency": "e.g., 'Hitter-Friendly'"},
    "weatherConditions": {"forecast": "e.g., 'Clear, 72°F, Wind 5mph L to R'"},
    "hitterStrengths": { "Contact": 0, "Power": 0, "Discipline": 0, "AvoidK": 0, "Speed": 0, "Adaptability": 0 },
    "pitcherProfile": { "Contact": 0, "Power": 0, "Discipline": 0, "AvoidK": 0, "Speed": 0, "Adaptability": 0 }, // Relative to the hitter's perspective
    "hitterRadarMetrics": { "xBA": 0, "HardHitPct": 0, "AvgExitVelo": 0, "BarrelPct": 0, "ChaseRate": 0, "WhiffPct": 0 }
  },
  "finalVerdict": {
    "compositeHitProbability": 0.0 // Your best estimate of hit probability as a percentage number
  }
}
`;

const constructSinglePlayerReportPrompt = (playerName: string, date: string, humanReadableDate: string): string => {
  // Simplified Role and Task for single player, focusing on the schema.
  return `
<ROLE>
You are STREAKSENSE, an expert Major League Baseball (MLB) data analyst. Your task is to provide a detailed, structured JSON report for a specific player for a given date.
</ROLE>
<CONTEXT>
The user requires a comprehensive analysis for player "${playerName}" for games on ${date} (${humanReadableDate}).
This report will be used to evaluate the player's likelihood of getting a hit.
</CONTEXT>
<RULES>
1.  **JSON Only:** Your entire response MUST be a single, valid JSON object matching the PlayerData schema provided. No introductory text, explanations, or markdown.
2.  **Complete Data Population:** Fill all fields in the PlayerData schema as accurately and completely as possible.
3.  **MLB ID:** Prioritize finding and including the official MLB Player ID.
4.  **Full Team Names:** Use full team names.
5.  **\`playerSpecificVerdict\` Formatting:** Adhere strictly to the Markdown structure detailed in the schema for this field (## Title, ### Subtitles A-D, narrative paragraphs).
</RULES>
<SCHEMA>
${SINGLE_PLAYER_SCHEMA_BLOCK_CONTENT(playerName, humanReadableDate)}
</SCHEMA>
<TASK>
Generate the complete, valid JSON PlayerData report for "${playerName}" for ${humanReadableDate}. Ensure all rules are followed and the schema is matched exactly.
</TASK>
`;
};

export const fetchStructuredReportForPlayer = async (playerName: string, date: string, humanReadableDate: string): Promise<PlayerData | null> => {
  const prompt = constructSinglePlayerReportPrompt(playerName, date, humanReadableDate);
  console.log(`Fetching structured report for ${playerName} on ${humanReadableDate}`);
  try {
    const result: GenerateContentResponse = await ai.models.generateContent({
      model: analysisModelName, // Using analysis model for structured JSON
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.5, 
      },
    });

    let jsonText = result.text;
    if (!jsonText) {
      console.error(`Received empty response from AI for structured report of ${playerName}.`);
      if (result && result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason !== 'STOP') {
        throw new Error(`AI structured report generation for ${playerName} stopped prematurely: ${result.candidates[0].finishReason}`);
      }
      return null;
    }

    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonText.match(fenceRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }
    if (!jsonText.startsWith('{') && jsonText.includes('{')) {
        jsonText = jsonText.substring(jsonText.indexOf('{'));
    }
    if (!jsonText.endsWith('}') && jsonText.includes('}')) {
        jsonText = jsonText.substring(0, jsonText.lastIndexOf('}') + 1);
    }
    
    try {
      const parsedData: PlayerData = JSON.parse(jsonText);
      if (!parsedData.player || !parsedData.finalVerdict) {
        console.warn(`Parsed structured report for ${playerName} is missing key fields.`, parsedData);
        return null;
      }
      // Add fetchedAt timestamp
      parsedData.fetchedAt = new Date();
      console.log(`Successfully fetched and parsed structured report for ${playerName}`);
      return parsedData;
    } catch (e) {
      console.error(`Failed to parse JSON for structured report of ${playerName}:`, e);
      console.error("Problematic JSON string:", jsonText.substring(0, 500) + "...");
      return null;
    }
  } catch (error) {
    console.error(`Error fetching structured report for ${playerName} from Gemini:`, error);
    throw error; 
  }
};
