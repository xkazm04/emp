export interface SurveyMetadata {
  quarter: string;
  surveyTitle: string;
  generatedDate: string;
  totalResponses: number;
  responseRatePercent: number | null;
  previousQuarter: string;
  previousTotalResponses: number;
  previousResponseRate: number | null;
}

export interface TopStat {
  label: string;
  values: number[];
  unit?: string;
}

export interface KeyStrengthOrImprovement {
  description: string;
  context: string;
  priority?: string;
  impact?: string;
  values: number[];
}

export interface KeyMetrics {
  topStats: TopStat[];
  esatScore: number | null;
  esatScoreOutOf: number | null;
  keyStrengths: KeyStrengthOrImprovement[];
  improvementAreas: KeyStrengthOrImprovement[];
}

export interface PerformanceMetric {
  metricKey: string;
  metricName: string;
  overall: {
    values: number[];
  };
  topPerformers: {
    values: number[];
  };
  generalPopulation: {
    values: number[];
  };
}

export interface ExecutiveSummary {
  llm_generated: boolean;
  overview: string;
  keyFindings: string[];
  strategicImplication: string;
}

export interface LeaderKeyStats {
  leadershipConfidence: {
    unit: string;
    values: number[];
    topPerformerValues: number[];
  };
  tools: {
    unit: string;
    values: number[];
    topPerformerValues: number[];
  };
  empowerment: {
    unit: string;
    values: number[];
    topPerformerValues: number[];
  };
  retention: {
    unit: string;
    values: number[];
    topPerformerValues: number[];
  };
}

export interface LeaderMetric {
  metricKey: string;
  metricName: string;
  values: number[];
}

export interface LeaderNarrative {
  llm_generated: boolean;
  summary: string;
  focusAreas: string[];
}

export interface Leader {
  id: string;
  name: string;
  teamType: string;
  keyStats: LeaderKeyStats;
  metrics: LeaderMetric[];
  narrative: LeaderNarrative;
}

export interface QualitativeInsight {
  insightType: string;
  category: string;
  rank: number;
  content: string;
  timeseries: {
    [key: string]: {
      frequency: number;
    };
  };
  sampleResponses: string[];
  questionReference: string;
}

export interface ComparisonDeltas {
  total_survey_responses_pp: number;
  see_themselves_here_next_year_pp: number;
  understand_mission_and_role_pp: number;
}

export interface Comparison {
  index: string[];
  deltas: ComparisonDeltas;
}

export interface SurveyData {
  metadata: SurveyMetadata;
  timeseriesIndex: string[];
  executiveSummary: ExecutiveSummary;
  keyMetrics: KeyMetrics;
  performanceMetrics: PerformanceMetric[];
  qualitativeInsights: QualitativeInsight[];
  leaders: Leader[];
  comparison: Comparison;
}

export interface TabContentProps {
  data: SurveyData;
} 