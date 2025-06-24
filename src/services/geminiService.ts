
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
3.  **Complete Data Population:** All fields listed in the main part of the schema (excluding those explicitly noted as optional examples like \`playerSpecificVerdict\` or \`imageUrl\` within the recommendation object structure) MUST be populated with a valid, non-null, and non-empty value of the correct type. This is critical. Pay special attention to populating all nested objects and arrays.
    - \`executiveSummary.keyTableSynopsis.data\` MUST contain data for the 5 recommended players.
    - **Shared Radar Chart Keys:** For \`hitterStrengths\` and \`pitcherProfile\` in the \`synthesis\` object of each recommendation, you MUST use the following 5-6 keys consistently: "Contact", "Power", "Discipline", "AvoidK", "Speed", "Adaptability". Populate these with percentile scores (0-100) representing the player's skill or the pitcher's vulnerability/strength related to that aspect.
    - **Optional Fields:** \`playerSpecificVerdict\`, \`imageUrl\`, \`matchup.pitchVulnerabilities\`, \`synthesis.hitterStrengths\`, \`synthesis.pitcherProfile\`, \`synthesis.hitterRadarMetrics\`. Populate these with appropriate data if available and relevant; otherwise, they can be omitted or provided as empty structures (e.g., empty array \`[]\` or empty object \`{}\`).
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
        {
          "player": "Name of 1st Recommended Player",
          "team": "Team of 1st Recommended Player",
          "pos": "Position of 1st Recommended Player",
          "compositeProb": "Composite Probability of 1st Recommended Player (as string with %)",
          "modelXProb": "Relevant Model Probability of 1st Recommended Player (as string with %)",
          "streak": "Hitting Streak of 1st Recommended Player (string or number, e.g., '5' or 'N/A')"
        }
        // ... (repeat this structure for the other 4 recommended players)
      ]
    }
  },
  "recommendations": [
    {
      "player": "Shohei Ohtani (Example Player for Structure)",
      "team": "LAD (Example Team)",
      "position": "DH (Example Position)",
      "imageUrl": "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39832.png&w=350&h=254 (Example URL, provide if known, otherwise omit)",
      "playerSpecificVerdict": "Ohtani's elite plate discipline and hard-hit ability make him a prime candidate. (Example text)",
      "corePerformance": {
        "slashLine2025": ".310/.405/.650 (Example Format)",
        "OPS2025": "1.055 (Example Format)",
        "activeHittingStreak": {"games": "5 (Example)", "details": "5-game hitting streak (9-for-22, .409 AVG, 2 HR) (Example details)"},
        "recentPerformance": {
          "last7GamesAvg": [0.280, 0.300, 0.320, 0.250, 0.400, 0.350, 0.380],
          "last15GamesAvg": [0.290, 0.270, 0.310, 0.330, 0.260, 0.300, 0.350, 0.280, 0.320, 0.360, 0.290, 0.310, 0.300, 0.340, 0.370],
          "last30GamesAvg": [0.300, 0.280, 0.290, 0.310, 0.320, 0.270, 0.300, 0.330, 0.350, 0.290, 0.280, 0.310, 0.340, 0.300, 0.320, 0.330, 0.290, 0.300, 0.310, 0.320, 0.300, 0.290, 0.330, 0.340, 0.310, 0.300, 0.280, 0.320, 0.350, 0.360]
        }
      },
      "statcastValidation": [
        {"label": "Hard Hit %", "value": "55.2% (Example Format)", "percentile": 92},
        {"label": "Barrel %", "value": "18.5% (Example Format)", "percentile": 95},
        {"label": "Avg Exit Velocity", "value": "94.1 mph (Example Format)", "percentile": 93},
        {"label": "xwOBA", "value": ".410 (Example Format)", "percentile": 94}
      ],
      "matchup": {
        "pitcher": "Logan Webb (Example Pitcher)", "team": "SFG (Example Opponent Team)", "ERA": "3.10", "WHIP": "1.05", "battingAverageAgainst": ".235",
        "pitchVulnerabilities": [
            {"pitchType": "Sinker", "vulnerabilityScore": 0.18},
            {"pitchType": "Changeup", "vulnerabilityScore": 0.25}
        ]
      },
      "synthesis": {
        "predictiveModels": [
          {"modelName": "Baseball Musings NN (Example Model)", "probability": "85.0%"},
          {"modelName": "STREAKSENSE Alpha (Example Model)", "probability": "87.0%"}
        ],
        "BvPHistory": "5-for-12 (.417), 2 HR vs Webb (Example)",
        "parkFactors": {"venue": "Dodger Stadium (Example Venue)", "historicalTendency": "Slightly Hitter-Friendly (Example Tendency)"},
        "weatherConditions": {"forecast": "Clear, 72°F, Wind 5mph L to R (Example Forecast)"},
        "hitterStrengths": { 
            "Contact": 85, "Power": 92, "Discipline": 78, "AvoidK": 88, "Speed": 70, "Adaptability": 80 
        },
        "pitcherProfile": { 
            "Contact": 60, "Power": 55, "Discipline": 65, "AvoidK": 70, "Speed": 40, "Adaptability": 75 
        },
        "hitterRadarMetrics": {
            "xBA": 88, "HardHitPct": 92, "AvgExitVelo": 94, "BarrelPct": 85, "ChaseRate": 70, "WhiffPct": 75
        }
      },
      "finalVerdict": {
        "compositeHitProbability": 88.5
      }
    }
    // Reminder: Generate 4 MORE unique player objects like the example above.
  ],
  "watchListCautionaryNotes": {
    "honorableMentions": [
      {
        "player": "Example Honorable Mention Player Name", 
        "team": "XYZ (Example Team)",
        "description": "Reason for honorable mention.",
        "compositeHitProbability": 72.3
      }
    ],
    "ineligiblePlayersToNote": [
      {
        "player": "Example Ineligible Player Name", 
        "team": "ABC (Example Team)",
        "reason": "Reason for ineligibility."
      }
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
