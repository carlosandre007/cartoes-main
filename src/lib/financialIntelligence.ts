import { FinancialIntelligenceSummary, generateLocalFinancialAnalysis } from '../utils/financialIntelligence';

export interface FinancialAnalysisRecord {
  id: string;
  createdAt: string;
  score: number | null;
  analysis: string;
  summary: FinancialIntelligenceSummary;
}

const storageKey = (userId: string) => `aureum_financial_analyses_${userId}`;
const readLocal = (userId: string): FinancialAnalysisRecord[] => {
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]'); } catch { return []; }
};
const writeLocal = (userId: string, records: FinancialAnalysisRecord[]) =>
  localStorage.setItem(storageKey(userId), JSON.stringify(records.slice(0, 30)));

const extractScore = (analysis: string) => {
  const match = analysis.match(/(?:nota financeira|nota)\D{0,20}(\d{1,3})/i);
  return match ? Math.min(100, Number(match[1])) : null;
};

export const requestFinancialAnalysis = async (summary: FinancialIntelligenceSummary): Promise<string> =>
  generateLocalFinancialAnalysis(summary).analysis;

export const saveFinancialAnalysis = async (userId: string, summary: FinancialIntelligenceSummary, analysis: string) => {
  const record: FinancialAnalysisRecord = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
    createdAt: new Date().toISOString(), score: extractScore(analysis), analysis, summary,
  };
  const today = record.createdAt.slice(0, 10);
  const local = [record, ...readLocal(userId).filter((item) => item.createdAt.slice(0, 10) !== today)];
  writeLocal(userId, local);
  return record;
};

export const loadFinancialAnalyses = async (userId: string): Promise<FinancialAnalysisRecord[]> => readLocal(userId);
