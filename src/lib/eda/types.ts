export type EdaDataType =
  | "number"
  | "integer"
  | "decimal"
  | "date"
  | "datetime"
  | "boolean"
  | "category"
  | "text";

export interface NumericSummaryStats {
  count: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  bins: Array<{
    binStart: number;
    binEnd: number;
    count: number;
    percentage: number;
  }>;
}

export interface CategoryFrequency {
  label: string;
  count: number;
  percentage: number;
}

export interface TemporalSummaryStats {
  minDate: string;
  maxDate: string;
  timePoints: Array<{
    period: string; // e.g. "2026-08-28" or "Aug 2026"
    count: number;
    numericSum?: number;
    numericAvg?: number;
  }>;
  dayOfWeekDistribution: Array<{
    day: string; // "Mon", "Tue", ...
    count: number;
    percentage: number;
  }>;
}

export interface ColumnProfile {
  name: string;
  letter: string;
  index: number;
  type: EdaDataType;
  totalCount: number;
  filledCount: number;
  missingCount: number;
  completeness: number; // 0 to 100%
  uniqueCount: number;
  isHighCardinality: boolean;
  numericStats?: NumericSummaryStats;
  frequencies?: CategoryFrequency[];
  temporalStats?: TemporalSummaryStats;
  sampleValues: Array<string | number>;
}

export interface CorrelationCell {
  colA: string;
  colB: string;
  coefficient: number; // -1 to 1
}

export interface CorrelationMatrixData {
  columns: string[];
  matrix: CorrelationCell[][];
}

export interface DatasetProfile {
  totalRows: number;
  totalColumns: number;
  totalCells: number;
  filledCells: number;
  missingCells: number;
  overallCompleteness: number; // 0 to 100%
  duplicateRowCount: number;
  columns: ColumnProfile[];
  typeDistribution: Record<EdaDataType, number>;
  numericColumns: ColumnProfile[];
  categoricalColumns: ColumnProfile[];
  temporalColumns: ColumnProfile[];
  textColumns: ColumnProfile[];
  correlationMatrix?: CorrelationMatrixData;
}
