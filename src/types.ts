
export interface KeyTableSynopsisData {
  player: string;
  team: string;
  pos: string;
  compositeProb: string;
  modelXProb: string; // Or a more generic model name from prompt
  streak: string | number; // Can be string "N/A" or number
}

export interface KeyTableSynopsis {
  headers: string[];
  data: KeyTableSynopsisData[];
  notes?: string[];
}

export interface ExecutiveSummaryData {
  situationalOverview: string;
  keyTableSynopsis: KeyTableSynopsis;
}

export interface RecentPerformance {
  last7GamesAvg: number[];
  last15GamesAvg: number[];
  last30GamesAvg: number[];
}

export interface StatcastMetric {
  label: string;
  value: string; 
  percentile: number; 
}

export interface MatchupData {
  pitcher: string;
  team: string; 
  ERA: string;
  WHIP: string;
  battingAverageAgainst: string;
  // Optional: Data for pitcher arsenal vulnerability chart
  pitchVulnerabilities?: Array<{ pitchType: string; vulnerabilityScore: number }>;
}

export interface PredictiveModel {
  modelName: string;
  probability: string; 
}

export interface ParkFactor {
    venue: string;
    historicalTendency: string;
}

export interface WeatherCondition {
    forecast: string; // e.g., "Clear, 72°F, Wind 5mph L to R"
}

export interface SynthesisData {
  predictiveModels: PredictiveModel[];
  BvPHistory?: string;
  parkFactors?: ParkFactor;
  weatherConditions?: WeatherCondition;
  // Optional: Data for hitter vs pitcher radar chart
  hitterStrengths?: Record<string, number>; // e.g., { "Contact": 80, "Power": 75 ... }
  pitcherProfile?: Record<string, number>; // e.g., { "vsFastball": 70, "vsBreaking": 65 ... }
}

export interface CorePerformanceData {
  slashLine2025: string;
  OPS2025: string;
  activeHittingStreak: {
    games: number | string; 
    details?: string;
  };
  recentPerformance: RecentPerformance;
}

export interface PlayerData {
  player: string;
  team: string;
  position: string;
  corePerformance: CorePerformanceData;
  statcastValidation: StatcastMetric[];
  matchup: MatchupData;
  synthesis: SynthesisData;
  finalVerdict: {
    compositeHitProbability: number; 
  };
  // Optional: A specific short "verdict" text for the player for the "Verdict" tab
  playerSpecificVerdict?: string;
}

export interface HonorableMention {
  player: string;
  team: string;
  description: string;
}

export interface IneligiblePlayer {
  player: string;
  team: string;
  reason: string;
}

export interface WatchListCautionaryNotesData {
  honorableMentions: HonorableMention[];
  ineligiblePlayersToNote: IneligiblePlayer[];
}

export interface AnalysisReport {
  reportTitle: string;
  date: string; 
  executiveSummary: ExecutiveSummaryData;
  recommendations: PlayerData[];
  watchListCautionaryNotes: WatchListCautionaryNotesData;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
