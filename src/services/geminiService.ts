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
3.  **Complete Data Population:** Every single field in the provided JSON schema MUST be populated with a valid, non-null, and non-empty value of the correct type. This is critical. Pay special attention to populating all nested objects and arrays, including:
    - \`executiveSummary.situationalOverview\`
    - \`executiveSummary.keyTableSynopsis.data\` (must contain data for the 5 recommended players)
    - All fields within each of the 5 \`recommendations\` objects.
    - \`corePerformance.recentPerformance\` arrays (\`last7GamesAvg\`, \`last15GamesAvg\`, \`last30GamesAvg\`) must be fully populated.
    - \`statcastValidation\` array must be fully populated.
    - \`synthesis.predictiveModels\` array must be fully populated.
4.  **Data Accuracy:** All data, including stats, probabilities, and player details, should be as accurate as possible for the given date.
</RULES>

<SCHEMA>
You MUST generate a JSON object that strictly adheres to the following structure. All string values must be properly escaped.

{
  "reportTitle": "STREAKSENSE Daily Briefing",
  "date": "${humanReadableDate}",
  "executiveSummary": {
    "situationalOverview": "Provide a concise overview of the day's MLB slate, key matchups, and any overarching themes or trends relevant to player performance. Example: 'A packed slate today with several high-profile pitching matchups. Weather could be a factor in eastern games. Focus on hitters in favorable park factors.'",
    "keyTableSynopsis": {
      "headers":,
      "data": [
        {"player": "string", "team": "string", "pos": "string", "compositeProb": "string", "modelXProb": "string", "streak": "string"},
        {"player": "string", "team": "string", "pos": "string", "compositeProb": "string", "modelXProb": "string", "streak": "string"},
        {"player": "string", "team": "string", "pos": "string", "compositeProb": "string", "modelXProb": "string", "streak": "string"},
        {"player": "string", "team": "string", "pos": "string", "compositeProb": "string", "modelXProb": "string", "streak": "string"},
        {"player": "string", "team": "string", "pos": "string", "compositeProb": "string", "modelXProb": "string", "streak": "string"}
      ],
      "notes":
    }
  },
  "recommendations":,
          "last15GamesAvg": [0.0],
          "last30GamesAvg": [0.0]
        }
      },
      "statcastValidation": [
        {"label": "string", "value": "string", "percentile": 0},
        {"label": "string", "value": "string", "percentile": 0},
        {"label": "string", "value": "string", "percentile": 0},
        {"label": "string", "value": "string", "percentile": 0}
      ],
      "matchup": {
        "pitcher": "string",
        "team": "string",
        "ERA": "string", "WHIP": "string", "battingAverageAgainst": "string"
      },
      "synthesis": {
        "predictiveModels": [
          {"modelName": "string", "probability": "string"},
          {"modelName": "string", "probability": "string"}
        ],
        "BvPHistory": "string",
        "parkFactors": {"venue": "string", "historicalTendency": "string"},
        "weatherConditions": {"forecast": "string"}
      },
      "finalVerdict": {
        "compositeHitProbability": 0.0
      }
    }
  ],
  "watchListCautionaryNotes": {
    "honorableMentions": [
      {"player": "string", "team": "string", "description": "string"}
    ],
    "ineligiblePlayersToNote": [
      {"player": "string", "team": "string", "reason": "string"}
    ]
  }
}
</SCHEMA>

<TASK>
Now, generate the complete, valid JSON report for ${humanReadableDate} following all the rules and the exact schema provided above. Your entire output must be the JSON object itself.
</TASK>`;
};

export const fetchAnalysisForDate = async (date: string, humanReadableDate: string): Promise<AnalysisReport> => {
  const prompt = constructPrompt(date, humanReadableDate);
  try {
    const request = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    };

    const result: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
      ...request
    });
    
    const jsonText = result.text;

    // The response should already be clean JSON due to responseMimeType,
    // but this cleanup logic is kept as a defensive fallback.
    // No need to check startsWith or endsWith if the API guarantees JSON, but it's safe.
    try {
      const parsedData: AnalysisReport = JSON.parse(jsonText);
      return parsedData;
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      console.error("Problematic JSON string:", jsonText);
      throw new Error(`Failed to parse analysis data from AI. Raw response: ${jsonText.substring(0,500)}...`);
    }

  } catch (error) {
    console.error('Error fetching data from Gemini:', error);
    if (error instanceof Error && error.message.includes("candidate")) { 
        throw new Error("The AI model's response was blocked or incomplete. This might be due to safety settings or content policy. Please try a different query or date.");
    }
    throw new Error(`Failed to fetch analysis data: ${error instanceof Error? error.message : String(error)}`);
  }
};
