import {
  EdaDataType,
  NumericSummaryStats,
  CategoryFrequency,
  TemporalSummaryStats,
  ColumnProfile,
  CorrelationMatrixData,
  DatasetProfile,
} from "./types";
import { indexToColumnLetter } from "@/lib/sheets/types";

/**
 * Attempts to parse cell value into a clean number, handling standard and Indonesian/European formats
 */
export function tryParseNumeric(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  const str = String(val).trim();
  if (!str) return null;

  // Indonesian Currency or Thousand Dots: e.g. "Rp 15.000", "1.500.000,50", "25.000"
  const isIdnCurrencyOrDot = /^(?:Rp\.?\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?)$/i.test(str);
  if (isIdnCurrencyOrDot) {
    const clean = str
      .replace(/^(?:Rp\.?\s*)/i, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  }

  // Standard comma thousands: e.g. "$1,500.50" or "1,500"
  const isUsCurrencyOrComma = /^(?:\$?\s*)?(\d{1,3}(?:,\d{3})+(?:\.\d+)?)$/.test(str);
  if (isUsCurrencyOrComma) {
    const clean = str.replace(/[\$,]/g, "");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  }

  // Plain numeric string
  const plainNum = Number(str);
  if (!isNaN(plainNum) && str !== "") {
    return plainNum;
  }

  return null;
}

/**
 * Checks if a string represents a valid date or datetime
 */
export function tryParseDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === "" || typeof val === "number") {
    return null;
  }

  const str = String(val).trim();
  if (str.length < 5 || /^\d+$/.test(str)) return null; // Avoid plain years or raw numbers

  // Common date formats: YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD, Month D, YYYY
  const dateRegex = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/;
  if (!dateRegex.test(str)) return null;

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;

  // Ensure year is realistic (1970 - 2100)
  const year = parsed.getFullYear();
  if (year < 1970 || year > 2100) return null;

  return parsed;
}

/**
 * Checks if value is boolean-like
 */
function isBooleanLike(val: unknown): boolean {
  if (typeof val === "boolean") return true;
  if (typeof val !== "string") return false;
  const lower = val.trim().toLowerCase();
  return ["true", "false", "yes", "no", "ya", "tidak", "1", "0"].includes(lower);
}

/**
 * Infers specific data type of a column based on cell values
 */
export function detectColumnType(
  values: unknown[]
): { type: EdaDataType; parsedNumerics: number[]; parsedDates: Date[] } {
  const nonNull = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  const total = nonNull.length;

  if (total === 0) {
    return { type: "text", parsedNumerics: [], parsedDates: [] };
  }

  const numerics: number[] = [];
  let isAllInteger = true;
  for (const v of nonNull) {
    const num = tryParseNumeric(v);
    if (num !== null) {
      numerics.push(num);
      if (!Number.isInteger(num)) {
        isAllInteger = false;
      }
    }
  }

  const dates: Date[] = [];
  for (const v of nonNull) {
    const d = tryParseDate(v);
    if (d !== null) dates.push(d);
  }

  const booleanCount = nonNull.filter(isBooleanLike).length;
  const uniqueCount = new Set(nonNull.map((v) => String(v).trim())).size;

  // 1. Check Numeric (>= 75% match)
  if (numerics.length / total >= 0.75) {
    if (isAllInteger && uniqueCount <= 2 && (uniqueCount === 1 || (numerics.every(n => n === 0 || n === 1)))) {
      return { type: "boolean", parsedNumerics: numerics, parsedDates: [] };
    }
    return {
      type: isAllInteger ? "integer" : "decimal",
      parsedNumerics: numerics,
      parsedDates: [],
    };
  }

  // 2. Check Date / DateTime (>= 70% match)
  if (dates.length / total >= 0.7) {
    const hasTime = nonNull.some((v) => String(v).includes(":") && /\d{1,2}:\d{2}/.test(String(v)));
    return {
      type: hasTime ? "datetime" : "date",
      parsedNumerics: [],
      parsedDates: dates,
    };
  }

  // 3. Check Boolean
  if (booleanCount / total >= 0.85 && uniqueCount <= 3) {
    return { type: "boolean", parsedNumerics: [], parsedDates: [] };
  }

  // 4. Categorical vs Free Text
  // Low to moderate cardinality (<= 35 unique values or <= 40% of non-null count)
  if ((uniqueCount <= 35 && total >= 2) || (total >= 10 && uniqueCount / total <= 0.4)) {
    return { type: "category", parsedNumerics: [], parsedDates: [] };
  }

  return { type: "text", parsedNumerics: [], parsedDates: [] };
}

/**
 * Computes 5-number summary, mean, stdDev, and histogram bins for numeric columns
 */
export function computeNumericStats(numerics: number[]): NumericSummaryStats | undefined {
  if (numerics.length === 0) return undefined;

  const sorted = [...numerics].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / count;
  const min = sorted[0];
  const max = sorted[count - 1];

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Q1 & Q3
  const q1Idx = Math.floor(count * 0.25);
  const q3Idx = Math.floor(count * 0.75);
  const q1 = sorted[q1Idx];
  const q3 = sorted[q3Idx];
  const iqr = q3 - q1;

  // Standard Deviation
  const variance =
    count > 1
      ? sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  // Histogram Bins (8 to 12 bins)
  const binCount = Math.max(Math.min(Math.ceil(Math.sqrt(count)), 10), 5);
  const range = max - min;
  const binWidth = range === 0 ? 1 : range / binCount;

  const bins: Array<{ binStart: number; binEnd: number; count: number; percentage: number }> = [];
  for (let i = 0; i < binCount; i++) {
    const bStart = min + i * binWidth;
    const bEnd = i === binCount - 1 ? max : min + (i + 1) * binWidth;
    bins.push({ binStart: bStart, binEnd: bEnd, count: 0, percentage: 0 });
  }

  sorted.forEach((val) => {
    let assigned = false;
    for (let i = 0; i < bins.length; i++) {
      if (val >= bins[i].binStart && (i === bins.length - 1 ? val <= bins[i].binEnd : val < bins[i].binEnd)) {
        bins[i].count += 1;
        assigned = true;
        break;
      }
    }
    if (!assigned && bins.length > 0) {
      bins[bins.length - 1].count += 1;
    }
  });

  bins.forEach((b) => {
    b.percentage = count > 0 ? (b.count / count) * 100 : 0;
  });

  return {
    count,
    min,
    max,
    sum,
    mean,
    median,
    stdDev,
    q1,
    q3,
    iqr,
    bins,
  };
}

/**
 * Computes categorical frequency ranking
 */
export function computeCategoryFrequencies(
  values: unknown[],
  maxCategories = 15
): CategoryFrequency[] {
  const nonNull = values
    .map((v) => (v === null || v === undefined || v === "" ? null : String(v).trim()))
    .filter((v): v is string => v !== null);

  const total = nonNull.length;
  if (total === 0) return [];

  const freqMap = new Map<string, number>();
  nonNull.forEach((val) => {
    freqMap.set(val, (freqMap.get(val) || 0) + 1);
  });

  const sorted = Array.from(freqMap.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, maxCategories);
}

/**
 * Computes temporal timeline trend and day-of-week activity
 */
export function computeTemporalStats(
  dateValues: unknown[],
  numericValues?: number[]
): TemporalSummaryStats | undefined {
  const pairs: Array<{ date: Date; num?: number }> = [];

  dateValues.forEach((raw, i) => {
    const d = tryParseDate(raw);
    if (d) {
      pairs.push({
        date: d,
        num: numericValues && numericValues[i] !== undefined ? numericValues[i] : undefined,
      });
    }
  });

  if (pairs.length === 0) return undefined;

  pairs.sort((a, b) => a.date.getTime() - b.date.getTime());

  const minDate = pairs[0].date.toISOString().split("T")[0];
  const maxDate = pairs[pairs.length - 1].date.toISOString().split("T")[0];

  // Group by YYYY-MM-DD
  const periodMap = new Map<string, { count: number; sum: number }>();
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  pairs.forEach(({ date, num }) => {
    const dateStr = date.toISOString().split("T")[0];
    const curr = periodMap.get(dateStr) || { count: 0, sum: 0 };
    curr.count += 1;
    if (num !== undefined && !isNaN(num)) curr.sum += num;
    periodMap.set(dateStr, curr);

    const dayIdx = (date.getDay() + 6) % 7; // Mon = 0, Sun = 6
    dayCounts[dayIdx] += 1;
  });

  const timePoints = Array.from(periodMap.entries()).map(([period, data]) => ({
    period,
    count: data.count,
    numericSum: data.sum > 0 ? data.sum : undefined,
    numericAvg: data.count > 0 && data.sum > 0 ? data.sum / data.count : undefined,
  }));

  const totalDays = pairs.length;
  const dayOfWeekDistribution = daysOfWeek.map((day, idx) => ({
    day,
    count: dayCounts[idx],
    percentage: totalDays > 0 ? (dayCounts[idx] / totalDays) * 100 : 0,
  }));

  return {
    minDate,
    maxDate,
    timePoints,
    dayOfWeekDistribution,
  };
}

/**
 * Computes Pearson correlation coefficient between two numeric vectors
 */
export function computePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;

  const r = num / den;
  return Math.max(-1, Math.min(1, r));
}

/**
 * Computes the full pairwise correlation matrix for all numeric columns
 */
export function computeCorrelationMatrix(
  numericCols: ColumnProfile[],
  rows: Array<Record<string, unknown>>
): CorrelationMatrixData | undefined {
  if (numericCols.length < 2) return undefined;

  const names = numericCols.map((c) => c.name);
  const matrix: Array<Array<{ colA: string; colB: string; coefficient: number }>> = [];

  for (let i = 0; i < names.length; i++) {
    const rowCells: Array<{ colA: string; colB: string; coefficient: number }> = [];
    const colA = names[i];

    for (let j = 0; j < names.length; j++) {
      const colB = names[j];
      if (i === j) {
        rowCells.push({ colA, colB, coefficient: 1.0 });
      } else {
        // Collect paired rows where both values are non-null numbers
        const pairedA: number[] = [];
        const pairedB: number[] = [];

        rows.forEach((row) => {
          const valA = tryParseNumeric(row[colA]);
          const valB = tryParseNumeric(row[colB]);
          if (valA !== null && valB !== null) {
            pairedA.push(valA);
            pairedB.push(valB);
          }
        });

        const coeff = pairedA.length >= 2 ? computePearsonCorrelation(pairedA, pairedB) : 0;
        rowCells.push({
          colA,
          colB,
          coefficient: parseFloat(coeff.toFixed(3)),
        });
      }
    }
    matrix.push(rowCells);
  }

  return {
    columns: names,
    matrix,
  };
}

/**
 * Main General-Purpose EDA Profiling Engine
 */
export function profileDataset(
  headers: string[],
  rows: Array<Record<string, unknown>>
): DatasetProfile {
  const totalRows = rows.length;
  const totalColumns = headers.length;
  const totalCells = totalRows * totalColumns;

  let totalFilledCells = 0;
  const typeCounts: Record<EdaDataType, number> = {
    number: 0,
    integer: 0,
    decimal: 0,
    date: 0,
    datetime: 0,
    boolean: 0,
    category: 0,
    text: 0,
  };

  // 1. Column-by-column profiling
  const columnProfiles: ColumnProfile[] = headers.map((header, colIdx) => {
    const letter = indexToColumnLetter(colIdx);
    const colValues = rows.map((r) => r[header]);
    const filledValues = colValues.filter(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );

    const filledCount = filledValues.length;
    const missingCount = totalRows - filledCount;
    totalFilledCells += filledCount;

    const completeness = totalRows > 0 ? (filledCount / totalRows) * 100 : 0;
    const uniqueValues = new Set(filledValues.map((v) => String(v).trim())).size;

    const { type, parsedNumerics, parsedDates } = detectColumnType(colValues);
    typeCounts[type] += 1;

    const isHighCardinality =
      (type === "text" || type === "category") &&
      uniqueValues > 40 &&
      (filledCount > 0 ? uniqueValues / filledCount > 0.6 : false);

    // Compute specific statistics based on type
    let numericStats: NumericSummaryStats | undefined;
    let frequencies: CategoryFrequency[] | undefined;
    let temporalStats: TemporalSummaryStats | undefined;

    if (type === "number" || type === "integer" || type === "decimal") {
      numericStats = computeNumericStats(parsedNumerics);
    } else if (type === "category" || type === "boolean" || (type === "text" && !isHighCardinality)) {
      frequencies = computeCategoryFrequencies(filledValues);
    } else if (type === "date" || type === "datetime") {
      temporalStats = computeTemporalStats(colValues);
    }

    const sampleValues = filledValues
      .slice(0, 5)
      .map((v) => (typeof v === "number" ? v : String(v).trim()));

    return {
      name: header,
      letter,
      index: colIdx,
      type,
      totalCount: totalRows,
      filledCount,
      missingCount,
      completeness: parseFloat(completeness.toFixed(1)),
      uniqueCount: uniqueValues,
      isHighCardinality,
      numericStats,
      frequencies,
      temporalStats,
      sampleValues,
    };
  });

  // 2. Count duplicate rows
  const rowSignatures = new Set<string>();
  let duplicateRowCount = 0;
  rows.forEach((row) => {
    const sig = headers.map((h) => String(row[h] ?? "")).join("||");
    if (rowSignatures.has(sig)) {
      duplicateRowCount += 1;
    } else {
      rowSignatures.add(sig);
    }
  });

  const missingCells = totalCells - totalFilledCells;
  const overallCompleteness =
    totalCells > 0 ? parseFloat(((totalFilledCells / totalCells) * 100).toFixed(1)) : 0;

  // Filter column groups
  const numericColumns = columnProfiles.filter(
    (c) => c.type === "number" || c.type === "integer" || c.type === "decimal"
  );
  const categoricalColumns = columnProfiles.filter(
    (c) => c.type === "category" || c.type === "boolean"
  );
  const temporalColumns = columnProfiles.filter(
    (c) => c.type === "date" || c.type === "datetime"
  );
  const textColumns = columnProfiles.filter((c) => c.type === "text");

  // 3. Compute correlation matrix if >= 2 numeric columns
  const correlationMatrix =
    numericColumns.length >= 2 ? computeCorrelationMatrix(numericColumns, rows) : undefined;

  return {
    totalRows,
    totalColumns,
    totalCells,
    filledCells: totalFilledCells,
    missingCells,
    overallCompleteness,
    duplicateRowCount,
    columns: columnProfiles,
    typeDistribution: typeCounts,
    numericColumns,
    categoricalColumns,
    temporalColumns,
    textColumns,
    correlationMatrix,
  };
}
