
export interface KeyTableSynopsisData {
  player: string;
  team: string; // Full team name, e.g., "Los Angeles Dodgers"
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
  team: string; // Opposing team - Full team name, e.g., "San Francisco Giants"
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
  hitterStrengths?: Record<string, number>; // For Hitter vs Pitcher Radar (e.g., { "Contact": 80, "Power": 75 ... })
  pitcherProfile?: Record<string, number>; // For Hitter vs Pitcher Radar (e.g., { "Stuff": 70, "Control": 65 ... })
  // For new Hitter Analysis Radar chart on Verdict tab
  hitterRadarMetrics?: Record<string, number>; // e.g., {"xBA": 75, "HardHitPct": 88, "AvgExitVelo": 92 } (values are percentiles 0-100)
}

export interface CorePerformanceData {
  slashLine2025: string;
  OPS2025: string;
  activeHittingStreak: {
    games: number | string; 
    details?: string;
  };
  recentPerformance: RecentPerformance;
  lastGamePerformance?: string; // e.g., "2-for-4, 1 HR, 2 RBI"
}

export interface PlayerData {
  player: string;
  team: string; // Full team name, e.g., "Los Angeles Dodgers"
  position: string;
  imageUrl?: string; // Optional URL for player's image
  corePerformance: CorePerformanceData;
  statcastValidation: StatcastMetric[]; // Keep for potential use or if AI includes it and we want to parse it from verdict
  matchup: MatchupData;
  synthesis: SynthesisData;
  finalVerdict: {
    compositeHitProbability: number; 
  };
  // This string will now hold a comprehensive, Markdown-formatted multi-section analysis.
  playerSpecificVerdict?: string; 
}

export interface HonorableMention {
  player: string;
  team: string; // Full team name
  description: string;
  compositeHitProbability?: number; 
}

export interface IneligiblePlayer {
  player: string;
  team: string; // Full team name
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