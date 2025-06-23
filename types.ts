
export interface KeyTableSynopsisData {
  player: string;
  team: string;
  pos: string;
  compositeProb: string;
  modelXProb: string;
  streak: string;
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
  value: string; // e.g., "45.2%"
  percentile: number; // e.g., 75
}

export interface MatchupData {
  pitcher: string;
  team: string; // Opposing team
  ERA: string;
  WHIP: string;
  battingAverageAgainst: string;
}

export interface PredictiveModel {
  modelName: string;
  probability: string; // e.g., "70%"
}

export interface ParkFactor {
    venue: string;
    historicalTendency: string;
}

export interface WeatherCondition {
    forecast: string;
}

export interface SynthesisData {
  predictiveModels: PredictiveModel[];
  BvPHistory?: string;
  parkFactors?: ParkFactor;
  weatherConditions?: WeatherCondition;
}

export interface CorePerformanceData {
  slashLine2025: string;
  OPS2025: string;
  activeHittingStreak: {
    games: number | string; // Can be number or "N/A"
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
    compositeHitProbability: number; // e.g., 85.5
  };
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
  date: string; // Human-readable date
  executiveSummary: ExecutiveSummaryData;
  recommendations: PlayerData[];
  watchListCautionaryNotes: WatchListCautionaryNotesData;
}

// Data format for Recharts charts
export interface ChartDataPoint {
  name: string;
  value: number;
}
