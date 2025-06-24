
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisReport } from '../types';

// Access API_KEY from import.meta.env for Vite projects
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  // This will be caught by the App component and shown to the user.
  throw new Error("VITE_API_KEY environment variable is not set. Please configure it in your .env file and on your deployment platform (e.g., Vercel) to use STREAKSENSE.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const modelName = 'gemini-2.5-flash-preview-04-17';

const ROLE_BLOCK_CONTENT = `You are STREAKSENSE, an expert Major League Baseball (MLB) data analyst and a specialized API. Your sole purpose is to provide a detailed player performance analysis report for the "Beat the Streak" fantasy game. You are precise, data-driven, and provide your output in a strict JSON format.`;

const CONTEXT_BLOCK_CONTENT = (date: string, humanReadableDate: string) => `The user requires a comprehensive analysis report for MLB games scheduled on ${date} (formatted as ${humanReadableDate}). The report is used to identify top player picks for the "Beat the Streak" game, where the goal is to select a player who will get at least one hit. Your analysis must be deep, incorporating a wide range of metrics to justify your selections.`;

const RULES_BLOCK_CONTENT = `1.  **JSON Only:** Your entire response MUST be a single, valid JSON object. It must start with '{' and end with '}'. Do not include any introductory text, explanations, apologies, or markdown code fences like \`\`\`json.
2.  **Exactly 5 Recommendations:** The "recommendations" array in the JSON MUST contain exactly 5 player objects. No more, no less.
3.  **Complete Data Population:** All fields listed in the main part of the schema (excluding those explicitly noted as optional examples like \`imageUrl\` or specific chart data that might be omitted if not applicable) MUST be populated with a valid, non-null, and non-empty value of the correct type.
    - \`executiveSummary.keyTableSynopsis.data\` MUST contain data for the 5 recommended players.
    - **Shared Radar Chart Keys:** For \`hitterStrengths\` and \`pitcherProfile\` in the \`synthesis\` object of each recommendation, you MUST use the following 5-6 keys consistently: "Contact", "Power", "Discipline", "AvoidK", "Speed", "Adaptability". Populate these with percentile scores (0-100).
    - **\`playerSpecificVerdict\` Content:** This field is CRITICAL. It MUST contain a detailed, multi-section textual analysis for the player, formatted using standard Markdown. See the example within the schema for structure.
4.  **Data Accuracy:** All data, including stats, probabilities, and player details, should be as accurate as possible for the given date.
5.  **Markdown Usage:** Use standard Markdown for formatting within the \`playerSpecificVerdict\` string: \`## Title\`, \`### Subtitle\`, \`**bold text**\`, \`*italic text*\`, and unordered lists using \`-\` or \`*\`.`;

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
          "player": "Name of 1st Recommended Player", "team": "Team", "pos": "Pos",
          "compositeProb": "Prob%", "modelXProb": "Prob%", "streak": "5"
        }
        // ... (4 more players)
      ]
    }
  },
  "recommendations": [
    {
      "player": "Shohei Ohtani (Example Player)",
      "team": "LAD (Example Team)",
      "position": "DH (Example Position)",
      "imageUrl": "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39832.png&w=350&h=254 (Optional URL)",
      "playerSpecificVerdict": "## Deep Dive Analysis for Shohei Ohtani\\n\\n### A. Core Performance & Platoon Dominance\\n(Provide a narrative discussing Ohtani's current season performance, hitting streaks, any notable platoon splits (vs LHP/RHP), and overall offensive profile. Include key supporting stats inline or as a short list. Example: Ohtani is hitting .315 with a 1.050 OPS this season. Against RHP, he boasts a 1.100 OPS...)\\n\\n### B. Statcast Validation\\n(Discuss Ohtani's key Statcast metrics. Describe why these metrics support his selection. Examples: Hard Hit %, Barrel %, xwOBA, Avg Exit Velocity. Mention percentiles if available. Example: His xwOBA of .420 ranks in the 95th percentile, indicating elite quality of contact...)\\n\\n### C. The Matchup Analysis\\n(Detail the matchup against the opposing starting pitcher. Include pitcher's name, team, relevant stats like ERA, WHIP. Discuss any BvP history. Analyze Park Factors for the game venue and relevant Weather Conditions. Example: Tonight, Ohtani faces RHP John Doe (3.50 ERA, 1.15 WHIP). Ohtani is 3-for-7 lifetime against Doe. The game is at Petco Park, which is generally pitcher-friendly, but the wind is blowing out...)\\n\\n### D. Models & Final Verdict\\n(Include probabilities or insights from any predictive models you are simulating. Provide a concise final verdict statement summarizing why Ohtani is a strong pick. Include a brief risk assessment. Example: Our primary model gives Ohtani an 85% hit probability. **Verdict:** Ohtani's elite skills and favorable specific matchup elements make him a top recommendation. **Risk:** Low, given consistent performance, though the opposing pitcher has been effective recently.)",
      "corePerformance": {
        "slashLine2025": ".310/.405/.650", "OPS2025": "1.055",
        "activeHittingStreak": {"games": "5", "details": "5-game hitting streak (9-for-22, .409 AVG)"}
      },
      "statcastValidation": [ 
          {"label": "Hard Hit %", "value": "55.2%", "percentile": 92},
          {"label": "xwOBA", "value": ".410", "percentile": 94}
      ],
      "matchup": {
        "pitcher": "Logan Webb", "team": "SFG", "ERA": "3.10", "WHIP": "1.05", "battingAverageAgainst": ".235",
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
  ],
  "watchListCautionaryNotes": {
    "honorableMentions": [
      { "player": "Example Player", "team": "XYZ", "description": "Reason.", "compositeHitProbability": 72.3 }
    ],
    "ineligiblePlayersToNote": [
      { "player": "Example Player", "team": "ABC", "reason": "Reason." }
    ]
  }
}`;

const TASK_BLOCK_CONTENT = (humanReadableDate: string) => `Now, generate the complete, valid JSON report for ${humanReadableDate} following all the rules and the exact schema provided above. Your entire output must be the JSON object itself, containing exactly 5 unique player recommendations. The \`playerSpecificVerdict\` for each recommendation must be a comprehensive, multi-section analysis formatted with Markdown.`;

const constructPrompt = (date: string, humanReadableDate: string): string => {
  return `<ROLE>
${ROLE_BLOCK_CONTENT}
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
  const prompt = constructPrompt(date, humanReadableDate);
  try {
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
             responseMimeType: "application/json",
             temperature: 0.4,
        },
    });
    
    let jsonText = result.text;

    if (!jsonText) {
      console.error("Received empty or undefined text response from AI.");
      const fullResponse = JSON.stringify(result, null, 2);
      console.error("Full AI Response:", fullResponse.substring(0, 1000));
      throw new Error("Received empty response from AI. Check console for more details.");
    }

    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonText.match(fenceRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }

    try {
      const parsedData: AnalysisReport = JSON.parse(jsonText);
      if (!parsedData.recommendations || parsedData.recommendations.length !== 5) {
        console.warn("Parsed data is missing 'recommendations' or does not have 5 items.", parsedData);
      }
      if (parsedData.recommendations.some(p => !p.playerSpecificVerdict || p.playerSpecificVerdict.length < 50)) {
         console.warn("Some recommendations have very short or missing 'playerSpecificVerdict'.", parsedData.recommendations.map(p=> ({player: p.player, verdictLength: p.playerSpecificVerdict?.length || 0 })));
      }
      return parsedData;
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      console.error("Problematic JSON string attempt:", jsonText.substring(0,1000) + "...");
      throw new Error(`Failed to parse analysis data from AI. Raw response snippet: ${jsonText.substring(0,500)}...`);
    }

  } catch (error) {
    console.error('Error fetching data from Gemini:', error);
    if (typeof error === 'object' && error !== null) {
        console.error('Full error object:', JSON.stringify(error, null, 2));
    }

    if (error instanceof Error) {
        if (error.message.includes("candidate") || error.message.includes("block") || error.message.includes("safety")) { 
            throw new Error("The AI model's response was blocked or incomplete, possibly due to safety settings or content policy. Please try a different query or date.");
        }
        throw new Error(`Failed to fetch analysis data: ${error.message}`);
    }
    throw new Error(`Failed to fetch analysis data: ${String(error)}`);
  }
};
