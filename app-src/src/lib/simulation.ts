import type { BasicProfile, LifeEvent, SimulationResult } from "@/types";

export function runSimulation(
  profile: BasicProfile,
  events: LifeEvent[]
): SimulationResult[] {
  const results: SimulationResult[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = currentYear;
  const endYear = currentYear + (100 - profile.currentAge);

  let netWorth = profile.currentSavings;

  // ローン返済スケジュールを事前計算
  const loanPayments: Map<number, number> = new Map();
  events
    .filter((e) => e.enabled && e.isLoan && e.loanYears && e.loanRate !== undefined)
    .forEach((e) => {
      const principal = e.cost; // 万円
      const monthlyRate = (e.loanRate! / 100) / 12;
      const months = e.loanYears! * 12;
      // 元利均等返済
      const monthlyPayment =
        monthlyRate === 0
          ? principal / months
          : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
      const annualPayment = monthlyPayment * 12;

      for (let y = e.year; y < e.year + e.loanYears!; y++) {
        loanPayments.set(y, (loanPayments.get(y) ?? 0) + annualPayment);
      }
    });

  for (let year = startYear; year <= endYear; year++) {
    const age = profile.currentAge + (year - startYear);
    if (age > 100) break;

    // 年収（年収上昇率適用、退職後はゼロ）
    const yearsWorked = year - startYear;
    const annualIncome =
      age < profile.retirementAge
        ? profile.monthlyIncome *
          12 *
          Math.pow(1 + profile.annualRaiseRate / 100, yearsWorked)
        : 0;

    // 年間支出（固定費 + 変動費）
    const annualFixedExpense = profile.monthlyFixedExpense * 12;
    const annualVariableExpense = profile.monthlyVariableExpense * 12;
    const annualExpense = annualFixedExpense + annualVariableExpense;

    // ライフイベント費用（一括）
    const eventCost = events
      .filter(
        (e) => e.enabled && e.year === year && !e.isLoan
      )
      .reduce((sum, e) => sum + e.cost, 0);

    // ローン返済
    const loanPayment = loanPayments.get(year) ?? 0;

    // 純収支
    const annualSavings = annualIncome - annualExpense - eventCost - loanPayment;

    // 複利運用を加味した資産増加
    netWorth = netWorth * (1 + profile.investmentReturnRate / 100) + annualSavings;

    results.push({
      age,
      year,
      annualIncome: Math.round(annualIncome * 10) / 10,
      annualExpense: Math.round(annualExpense * 10) / 10,
      annualSavings: Math.round(annualSavings * 10) / 10,
      eventCost: Math.round(eventCost * 10) / 10,
      loanPayment: Math.round(loanPayment * 10) / 10,
      netWorth: Math.round(netWorth * 10) / 10,
    });
  }

  return results;
}

export function getBudgetAllocation(
  monthlyIncome: number,
  model: "50-30-20" | "60-20-20" | "custom",
  customRatios?: { needs: number; wants: number; savings: number }
) {
  const ratios =
    model === "50-30-20"
      ? { needs: 50, wants: 30, savings: 20 }
      : model === "60-20-20"
      ? { needs: 60, wants: 20, savings: 20 }
      : customRatios ?? { needs: 50, wants: 30, savings: 20 };

  return {
    needs: Math.round((monthlyIncome * ratios.needs) / 100 * 10) / 10,
    wants: Math.round((monthlyIncome * ratios.wants) / 100 * 10) / 10,
    savings: Math.round((monthlyIncome * ratios.savings) / 100 * 10) / 10,
    ratios,
  };
}

export function getFinancialDiagnosis(results: SimulationResult[]): {
  shortfall: number | null;
  shortfallAge: number | null;
  retirementNetWorth: number;
  peakNetWorth: number;
  peakAge: number;
} {
  const shortfallPoint = results.find((r) => r.netWorth < 0);
  const peak = results.reduce(
    (max, r) => (r.netWorth > max.netWorth ? r : max),
    results[0]
  );

  return {
    shortfall: shortfallPoint ? Math.abs(shortfallPoint.netWorth) : null,
    shortfallAge: shortfallPoint?.age ?? null,
    retirementNetWorth: results[results.length - 1]?.netWorth ?? 0,
    peakNetWorth: peak.netWorth,
    peakAge: peak.age,
  };
}
