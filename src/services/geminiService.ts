
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisReport } from '../types';

// Vite exposes env variables through import.meta.env
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  // This will be caught by the App component and shown to the user.
  throw new Error("VITE_API_KEY environment variable is not set. Please configure it in your .env file (for local development) or hosting provider's settings to use STREAKSENSE.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const modelName = 'gemini-2.5-flash-preview-04-17'; 

const constructPrompt = (date: string, humanReadableDate: string): string => {
  return `
System: You are an expert MLB analyst, STREAKSENSE. Provide a detailed player performance analysis report for the date ${date} (which is ${humanReadableDate}) in JSON format.
The JSON structure MUST be exactly as follows. Do not add any extra text before or after the JSON block. Ensure all string values are properly escaped within the JSON.
Do not use markdown like \`\`\`json or \`\`\` around the JSON response.

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
        {"player": "Juan Soto", "team": "NYY", "pos": "OF", "compositeProb": "79.5%", "modelXProb": "77.0%", "streak": "N/A"}
      ],
      "notes": ["Probabilities are based on a combination of proprietary models and expert analysis.", "Streak refers to active hitting streak."]
    }
  },
  "recommendations": [
    {
      "player": "Shohei Ohtani",
      "team": "LAD",
      "position": "DH",
      "corePerformance": {
        "slashLine2025": ".310/.405/.650",
        "OPS2025": "1.055",
        "activeHittingStreak": {"games": 5, "details": "5-game hitting streak (9-for-22, .409 AVG)"},
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
        "ERA": "3.10", "WHIP": "1.05", "battingAverageAgainst": ".235"
      },
      "synthesis": {
        "predictiveModels": [
          {"modelName": "Baseball Musings NN", "probability": "85.0%"},
          {"modelName": "STREAKSENSE Alpha", "probability": "87.0%"}
        ],
        "BvPHistory": "5-for-12 (.417), 2 HR vs Webb",
        "parkFactors": {"venue": "Dodger Stadium", "historicalTendency": "Slightly Hitter-Friendly"},
        "weatherConditions": {"forecast": "Clear, 72°F, Wind 5mph L to R"}
      },
      "finalVerdict": {
        "compositeHitProbability": 88.5
      }
    },
    {
      "player": "Bobby Witt Jr.",
      "team": "KC",
      "position": "SS",
      "corePerformance": {
        "slashLine2025": ".290/.350/.510",
        "OPS2025": ".860",
        "activeHittingStreak": {"games": 3, "details": "3-game hitting streak (4-for-11, .364 AVG)"},
        "recentPerformance": {
           "last7GamesAvg": [0.250, 0.200, 0.300, 0.330, 0.280, 0.310, 0.260],
           "last15GamesAvg": [0.260,0.280,0.220,0.310,0.300,0.270,0.290,0.320,0.250,0.280,0.330,0.260,0.300,0.290,0.270],
           "last30GamesAvg": [0.280,0.270,0.290,0.260,0.300,0.310,0.250,0.280,0.290,0.320,0.270,0.260,0.300,0.290,0.280,0.310,0.270,0.290,0.300,0.280,0.260,0.290,0.310,0.300,0.280,0.270,0.290,0.300,0.320,0.280]
        }
      },
      "statcastValidation": [
        {"label": "Hard Hit %", "value": "48.0%", "percentile": 80},
        {"label": "Barrel %", "value": "12.0%", "percentile": 78},
        {"label": "Sprint Speed", "value": "30.1 ft/s", "percentile": 98},
        {"label": "xwOBA", "value": ".365", "percentile": 82}
      ],
      "matchup": {
        "pitcher": "Tarik Skubal",
        "team": "DET",
        "ERA": "2.90", "WHIP": "1.00", "battingAverageAgainst": ".220"
      },
      "synthesis": {
        "predictiveModels": [
          {"modelName": "Baseball Musings NN", "probability": "80.5%"},
          {"modelName": "STREAKSENSE Alpha", "probability": "81.0%"}
        ],
        "BvPHistory": "2-for-8 (.250) vs Skubal",
        "parkFactors": {"venue": "Kauffman Stadium", "historicalTendency": "Neutral"},
        "weatherConditions": {"forecast": "Partly Cloudy, 78°F, Wind 8mph Out to CF"}
      },
      "finalVerdict": {
        "compositeHitProbability": 82.1
      }
    }
  ],
  "watchListCautionaryNotes": {
    "honorableMentions": [
      {"player": "Aaron Judge", "team": "NYY", "description": "Consistently high exit velocities, facing a rookie pitcher."},
      {"player": "Corbin Carroll", "team": "ARI", "description": "Speed threat, good matchup against a contact pitcher."}
    ],
    "ineligiblePlayersToNote": [
      {"player": "Mike Trout", "team": "LAA", "reason": "Day-to-day (minor injury)."},
      {"player": "Ronald Acuña Jr.", "team": "ATL", "reason": "Scheduled day off."}
    ]
  }
}
`;
};

export const fetchAnalysisForDate = async (date: string, humanReadableDate: string): Promise<AnalysisReport> => {
  const prompt = constructPrompt(date, humanReadableDate);
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.5, 
      }
    });
    
    let jsonText = response.text.trim();

    // Use a regex literal for clarity and to avoid escaping issues with string constructor
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonText.match(fenceRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }
    
    if (!jsonText.startsWith('{')) {
        const jsonStartIndex = jsonText.indexOf('{');
        if (jsonStartIndex > -1) {
            jsonText = jsonText.substring(jsonStartIndex);
        }
    }
    if (!jsonText.endsWith('}')) {
        const jsonEndIndex = jsonText.lastIndexOf('}');
        if (jsonEndIndex > -1) {
            jsonText = jsonText.substring(0, jsonEndIndex + 1);
        }
    }

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
    throw new Error(`Failed to fetch analysis data: ${error instanceof Error ? error.message : String(error)}`);
  }
};
