
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisReport } from '../types';

// Vite exposes env variables through import.meta.env
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  // This will be caught by the App component and shown to the user.
  throw new Error("VITE_API_KEY environment variable is not set. Please configure it in your.env file (for local development) or hosting provider's settings to use STREAKSENSE.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const modelName = 'gemini-2.5-flash-preview-04-17';

const constructPrompt = (date: string, humanReadableDate: string): string => {
  return `<ROLE>
You are STREAKSENSE, an expert Major League Baseball (MLB) data analyst and a specialized API. Your sole purpose is to provide a detailed player performance analysis report for the "Beat the Streak" fantasy game. You are precise, data-driven, and provide your output in a strict JSON format.
</ROLE>

<CONTEXT>
The user requires a comprehensive analysis report for MLB games scheduled on ${date} (formatted as ${humanReadableDate}). The report is used to identify top player picks for the "Beat the Streak" game, where the goal is to select a player who will get at least one hit. Your analysis must be deep, incorporating a wide range of metrics to justify your selections.
</CONTEXT>

<RULES>
1.  **JSON Only:** Your entire response MUST be a single, valid JSON object. It must start with '{' and end with '}'. Do not include any introductory text, explanations, apologies, or markdown code fences like \`\`\`json.
2.  **Exactly 5 Recommendations:** The "recommendations" array in the JSON MUST contain exactly 5 player objects. No more, no less.
3.  **Complete Data Population:** All fields listed in the main part of the schema (excluding those explicitly noted as optional examples like \`playerSpecificVerdict\` within the recommendation object structure) MUST be populated with a valid, non-null, and non-empty value of the correct type. This is critical. Pay special attention to populating all nested objects and arrays, including:
    - \`executiveSummary.situationalOverview\`
    - \`executiveSummary.keyTableSynopsis.data\` (must contain data for the 5 recommended players and all its fields)
    - All fields within each of the 5 \`recommendations\` objects, *except for the explicitly optional ones listed below*.
    - \`corePerformance.recentPerformance\` arrays (\`last7GamesAvg\`, \`last15GamesAvg\`, \`last30GamesAvg\`) must be fully populated with numerical arrays of appropriate length (e.g., 7, 15, 30 numbers).
    - \`statcastValidation\` array must be fully populated with 4 distinct metrics.
    - \`synthesis.predictiveModels\` array must be fully populated with at least 2 distinct models.
    - **Optional Fields within each recommendation:** \`playerSpecificVerdict\` (string), \`matchup.pitchVulnerabilities\` (array of objects), \`synthesis.hitterStrengths\` (object), \`synthesis.pitcherProfile\` (object). Populate these with appropriate data if available and relevant; otherwise, they can be omitted from the player object or provided as empty structures (e.g., empty array \`[]\` or empty object \`{}\`) if data is not available or not applicable.
4.  **Data Accuracy:** All data, including stats, probabilities, and player details, should be as accurate as possible for the given date. Ensure streak data is current.
</RULES>

<SCHEMA>
You MUST generate a JSON object that strictly adheres to the following structure. All string values must be properly escaped.

{
  "reportTitle": "STREAKSENSE Daily Briefing",
  "date": "${humanReadableDate}",
  "executiveSummary": {
    "situationalOverview": "Provide a concise overview of the day's MLB slate, key matchups, and any overarching themes or trends relevant to player performance. Example: 'A packed slate today with several high-profile pitching matchups. Weather could be a factor in eastern games. Focus on hitters in favorable park factors.'",
    "keyTableSynopsis": {
      "headers": ["Player", "Team", "Pos", "Composite Prob.", "Neural Net Prob.", "Streak (Games)"],
      "data": [
        {"player": "Shohei Ohtani", "team": "LAD", "pos": "DH", "compositeProb": "88.5%", "modelXProb": "85.0%", "streak": "5"},
        {"player": "Bobby Witt Jr.", "team": "KC", "pos": "SS", "compositeProb": "82.1%", "modelXProb": "80.5%", "streak": "3"},
        {"player": "Juan Soto", "team": "NYY", "pos": "OF", "compositeProb": "79.5%", "modelXProb": "77.0%", "streak": "N/A"},
        {"player": "Player Four", "team": "ATL", "pos": "3B", "compositeProb": "75.0%", "modelXProb": "72.0%", "streak": "2"},
        {"player": "Player Five", "team": "HOU", "pos": "2B", "compositeProb": "73.3%", "modelXProb": "70.1%", "streak": "N/A"}
      ],
      "notes": ["Probabilities are based on a combination of proprietary models and expert analysis.", "Streak refers to active hitting streak."]
    }
  },
  "recommendations": [
    {
      "player": "Shohei Ohtani",
      "team": "LAD",
      "position": "DH",
      "playerSpecificVerdict": "Ohtani's elite plate discipline and hard-hit ability make him a prime candidate against RHP with a tendency to leave breaking balls in the zone. Favorable park factors further boost his chances.",
      "corePerformance": {
        "slashLine2025": ".310/.405/.650",
        "OPS2025": "1.055",
        "activeHittingStreak": {"games": "5", "details": "5-game hitting streak (9-for-22, .409 AVG, 2 HR)"},
        "recentPerformance": {
          "last7GamesAvg": [0.280, 0.300, 0.320, 0.250, 0.400, 0.350, 0.380],
          "last15GamesAvg": [0.290, 0.270, 0.310, 0.330, 0.260, 0.300, 0.350, 0.280, 0.320, 0.360, 0.290, 0.310, 0.300, 0.340, 0.370],
          "last30GamesAvg": [0.300, 0.280, 0.290, 0.310, 0.320, 0.270, 0.300, 0.330, 0.350, 0.290, 0.280, 0.310, 0.340, 0.300, 0.320, 0.330, 0.290, 0.300, 0.310, 0.320, 0.300, 0.290, 0.330, 0.340, 0.310, 0.300, 0.280, 0.320, 0.350, 0.360]
        }
      },
      "statcastValidation": [
        {"label": "Hard Hit %", "value": "55.2%", "percentile": 92},
        {"label": "Barrel %", "value": "18.5%", "percentile": 95},
        {"label": "Avg Exit Velocity", "value": "94.1 mph", "percentile": 93},
        {"label": "xwOBA", "value": ".410", "percentile": 94}
      ],
      "matchup": {
        "pitcher": "Logan Webb",
        "team": "SFG",
        "ERA": "3.10", "WHIP": "1.05", "battingAverageAgainst": ".235",
        "pitchVulnerabilities": [
            {"pitchType": "Sinker", "vulnerabilityScore": 0.18},
            {"pitchType": "Changeup", "vulnerabilityScore": 0.25}
        ]
      },
      "synthesis": {
        "predictiveModels": [
          {"modelName": "Baseball Musings NN", "probability": "85.0%"},
          {"modelName": "STREAKSENSE Alpha", "probability": "87.0%"}
        ],
        "BvPHistory": "5-for-12 (.417), 2 HR vs Webb",
        "parkFactors": {"venue": "Dodger Stadium", "historicalTendency": "Slightly Hitter-Friendly"},
        "weatherConditions": {"forecast": "Clear, 72°F, Wind 5mph L to R"},
        "hitterStrengths": {
            "ContactSkill": 85, "PowerHardHit": 92, "PitchRecognition": 78, "vsRHP": 88, "PlateDiscipline": 80
        },
        "pitcherProfile": {
            "vsFastball": 65, "vsBreaking": 72, "Command": 80, "GroundballRate": 60, "KRate": 75
        }
      },
      "finalVerdict": {
        "compositeHitProbability": 88.5
      }
    }
    // Generate 4 more unique player objects following the exact same structure and data requirements.
    // Ensure data like player name, team, stats, probabilities, BvP, etc., are unique and plausible for each player.
  ],
  "watchListCautionaryNotes": {
    "honorableMentions": [
      {"player": "Aaron Judge", "team": "NYY", "description": "Consistently high exit velocities, facing a rookie pitcher with high walk rate."},
      {"player": "Corbin Carroll", "team": "ARI", "description": "Speed threat, good matchup against a contact pitcher, watch for lineup placement."}
    ],
    "ineligiblePlayersToNote": [
      {"player": "Mike Trout", "team": "LAA", "reason": "Day-to-day (minor wrist soreness)."},
      {"player": "Ronald Acuña Jr.", "team": "ATL", "reason": "Scheduled day off after doubleheader."}
    ]
  }
}
</SCHEMA>

<TASK>
Now, generate the complete, valid JSON report for ${humanReadableDate} following all the rules and the exact schema provided above. Your entire output must be the JSON object itself, containing exactly 5 unique player recommendations.
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
            temperature: 0.4, // Slightly lower for more deterministic structured output
        },
    });
    
    let jsonText = result.text;

    if (!jsonText) {
      console.error("Received empty or undefined text response from AI.");
      // Attempt to get more info from the response if available
      const fullResponse = JSON.stringify(result, null, 2);
      console.error("Full AI Response:", fullResponse.substring(0, 1000));
      throw new Error("Received empty response from AI. Check console for more details.");
    }

    // Defensively clean the response to remove markdown fences.
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonText.match(fenceRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }

    try {
      const parsedData: AnalysisReport = JSON.parse(jsonText);
      // Basic validation: Check for the presence of recommendations array and its length
      if (!parsedData.recommendations || parsedData.recommendations.length !== 5) {
        console.warn("Parsed data is missing 'recommendations' or does not have 5 items.", parsedData);
        // Potentially throw an error if this is a strict requirement for rendering
        // For now, let it pass but log a warning.
      }
      return parsedData;
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      console.error("Problematic JSON string attempt:", jsonText.substring(0,1000) + "..."); // Log more of the string
      throw new Error(`Failed to parse analysis data from AI. Raw response snippet: ${jsonText.substring(0,500)}...`);
    }

  } catch (error) {
    console.error('Error fetching data from Gemini:', error);
     // Log the full error object if it's not a simple string
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
