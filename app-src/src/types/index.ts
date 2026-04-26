export type LifeEventType =
  | "marriage"
  | "house"
  | "car"
  | "child"
  | "education"
  | "travel"
  | "job_change"
  | "retirement"
  | "custom";

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  label: string;
  year: number; // 発生年（西暦）
  cost: number; // 費用（万円）
  isLoan?: boolean;
  loanYears?: number;
  loanRate?: number; // 年利 %
  enabled: boolean;
}

export interface BasicProfile {
  currentAge: number;
  retirementAge: number;
  monthlyIncome: number; // 万円
  monthlyFixedExpense: number; // 万円
  monthlyVariableExpense: number; // 万円
  currentSavings: number; // 万円
  monthlySavings: number; // 万円 (auto-derived or manual)
  annualRaiseRate: number; // 年収上昇率 %
  investmentReturnRate: number; // 運用利回り %
}

export interface BudgetModel {
  id: "50-30-20" | "60-20-20" | "custom";
  label: string;
  needs: number; // %
  wants: number; // %
  savings: number; // %
}

export interface SimulationResult {
  age: number;
  year: number;
  annualIncome: number;
  annualExpense: number;
  annualSavings: number;
  eventCost: number;
  loanPayment: number;
  netWorth: number;
}
