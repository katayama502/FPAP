import type {
  HousingScenario,
  HousingYearResult,
  HousingComparisonResult,
  BuySettings,
  RentSettings,
} from "@/types/housing";
import type { BasicProfile } from "@/types";

// ────────────────────────────────────────────
// 住宅ローン計算（元利均等返済）
// ────────────────────────────────────────────
export function calcMonthlyPayment(
  principal: number,  // 万円
  annualRate: number, // %
  years: number
): number {
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ローン残高（n ヶ月後）
export function calcLoanBalance(
  principal: number,
  annualRate: number,
  years: number,
  monthsElapsed: number
): number {
  if (annualRate === 0) {
    return Math.max(0, principal - (principal / (years * 12)) * monthsElapsed);
  }
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const balance =
    principal * Math.pow(1 + r, monthsElapsed) -
    monthly * ((Math.pow(1 + r, monthsElapsed) - 1) / r);
  return Math.max(0, balance);
}

// ────────────────────────────────────────────
// 初期費用の自動推計（日本の慣習ベース）
// ────────────────────────────────────────────
export function estimateInitialCost(
  propertyPrice: number, // 万円
  propertyType: string,
  loanAmount: number
): number {
  let rate = 0;
  if (propertyType === "new_mansion") rate = 0.05;       // 新築マンション: 5%
  else if (propertyType === "used_mansion") rate = 0.07; // 中古マンション: 7%
  else if (propertyType === "new_house") rate = 0.05;    // 新築戸建: 5%
  else rate = 0.08;                                      // 中古戸建: 8%

  const base = propertyPrice * rate;
  // ローン手数料の概算（定率型 2.2% or 定額型 11万のどちらか）
  const loanFee = Math.min(loanAmount * 0.022, 11);
  return Math.round((base + loanFee) * 10) / 10;
}

// ────────────────────────────────────────────
// 賃貸シナリオのシミュレーション
// ────────────────────────────────────────────
function simulateRent(
  profile: BasicProfile,
  settings: RentSettings,
  baseNetWorth: number
): HousingYearResult[] {
  const results: HousingYearResult[] = [];
  const currentYear = new Date().getFullYear();
  let cumulativeCost = settings.deposit + settings.keyMoney;
  let netWorth = baseNetWorth - cumulativeCost;
  let currentRent = settings.monthlyRent;

  for (let i = 0; i <= 100 - profile.currentAge; i++) {
    const age = profile.currentAge + i;
    const year = currentYear + i;
    if (age > 100) break;

    // 2年ごとに更新料
    const renewalCost = i > 0 && i % 2 === 0 ? settings.renewalFee : 0;
    // 賃料上昇（5年ごとに上昇と仮定）
    if (i > 0 && i % 5 === 0) {
      currentRent *= 1 + settings.annualRentIncreaseRate / 100 * 5;
    }

    const annualRent = currentRent * 12;
    const annualHousingCost = annualRent + renewalCost;
    cumulativeCost += annualHousingCost;

    // 純資産（住宅コスト分を差し引く）
    netWorth -= annualHousingCost;

    results.push({
      age,
      year,
      annualHousingCost: Math.round(annualHousingCost * 10) / 10,
      monthlyHousingCost: Math.round((annualHousingCost / 12) * 10) / 10,
      loanBalance: 0,
      propertyValue: 0,
      equity: 0,
      cumulativeCost: Math.round(cumulativeCost * 10) / 10,
      netWorthWithHousing: Math.round(netWorth * 10) / 10,
    });
  }
  return results;
}

// ────────────────────────────────────────────
// 購入シナリオのシミュレーション
// ────────────────────────────────────────────
function simulateBuy(
  profile: BasicProfile,
  settings: BuySettings,
  baseNetWorth: number
): HousingYearResult[] {
  const results: HousingYearResult[] = [];
  const currentYear = new Date().getFullYear();

  const loanAmount = settings.propertyPrice - settings.downPayment;
  const initialCost = settings.useAutoInitialCost
    ? estimateInitialCost(settings.propertyPrice, settings.propertyType, loanAmount)
    : settings.manualInitialCost;

  const monthlyPayment = calcMonthlyPayment(loanAmount, settings.loanRate, settings.loanYears);
  const annualLoanPayment = monthlyPayment * 12;

  let cumulativeCost = settings.downPayment + initialCost;
  let netWorth = baseNetWorth - cumulativeCost;
  let propertyValue = settings.propertyPrice;

  for (let i = 0; i <= 100 - profile.currentAge; i++) {
    const age = profile.currentAge + i;
    const year = currentYear + i;
    if (age > 100) break;

    const monthsElapsed = i * 12;
    const loanBalance = calcLoanBalance(
      loanAmount,
      settings.loanRate,
      settings.loanYears,
      monthsElapsed
    );

    // 物件価値の変動
    propertyValue =
      settings.propertyPrice * Math.pow(1 + settings.propertyValueChangeRate / 100, i);
    propertyValue = Math.max(0, propertyValue);

    // 年間住宅コスト
    const yearlyLoan = loanBalance > 0 ? annualLoanPayment : 0;
    const yearlyMgmt = (settings.monthlyManagementFee + settings.monthlyRepairFund) * 12;
    const yearlyTax = settings.annualPropertyTax;
    const yearlyInsurance =
      settings.annualFireInsurance + settings.annualEarthquakeInsurance;
    const yearlyMaintenance = settings.annualMaintenanceCost;

    const annualHousingCost =
      yearlyLoan + yearlyMgmt + yearlyTax + yearlyInsurance + yearlyMaintenance;

    cumulativeCost += annualHousingCost;

    // 売却処理
    let sellProceeds = 0;
    if (settings.sellAtAge !== null && age === settings.sellAtAge) {
      const sellCost = propertyValue * (settings.sellCostRate / 100);
      sellProceeds = propertyValue - loanBalance - sellCost;
      propertyValue = 0;
    }

    const equity = propertyValue > 0 ? propertyValue - loanBalance : 0;
    netWorth = netWorth - annualHousingCost + sellProceeds;

    results.push({
      age,
      year,
      annualHousingCost: Math.round(annualHousingCost * 10) / 10,
      monthlyHousingCost: Math.round((annualHousingCost / 12) * 10) / 10,
      loanBalance: Math.round(loanBalance * 10) / 10,
      propertyValue: Math.round(propertyValue * 10) / 10,
      equity: Math.round(equity * 10) / 10,
      cumulativeCost: Math.round(cumulativeCost * 10) / 10,
      netWorthWithHousing: Math.round((netWorth + equity) * 10) / 10,
    });
  }
  return results;
}

// ────────────────────────────────────────────
// 全シナリオ比較
// ────────────────────────────────────────────
export function runHousingComparison(
  profile: BasicProfile,
  scenarios: HousingScenario[]
): HousingComparisonResult[] {
  const activeScenarios = scenarios.filter((s) => s.enabled);
  if (activeScenarios.length === 0) return [];

  const baseNetWorth = profile.currentSavings;

  // 賃貸シナリオを基準にして損益分岐を計算
  const rentScenario = activeScenarios.find((s) => s.type === "rent");

  return activeScenarios.map((scenario) => {
    const yearResults =
      scenario.type === "rent" && scenario.rent
        ? simulateRent(profile, scenario.rent, baseNetWorth)
        : scenario.type === "buy" && scenario.buy
        ? simulateBuy(profile, scenario.buy, baseNetWorth)
        : [];

    const totalCost =
      yearResults.length > 0
        ? yearResults[yearResults.length - 1].cumulativeCost
        : 0;

    const finalEquity =
      scenario.type === "buy" && yearResults.length > 0
        ? yearResults[yearResults.length - 1].equity
        : 0;

    // 損益分岐点（購入シナリオのみ・賃貸と比較）
    let breakEvenAge: number | null = null;
    if (scenario.type === "buy" && rentScenario) {
      const rentResults =
        rentScenario.rent
          ? simulateRent(profile, rentScenario.rent, baseNetWorth)
          : [];

      for (const yr of yearResults) {
        const rentYr = rentResults.find((r) => r.age === yr.age);
        if (rentYr && yr.netWorthWithHousing >= rentYr.netWorthWithHousing) {
          breakEvenAge = yr.age;
          break;
        }
      }
    }

    return { scenario, yearResults, totalCost, finalEquity, breakEvenAge };
  });
}

// ────────────────────────────────────────────
// 保険料の目安を算出（参考値）
// ────────────────────────────────────────────
export function estimateInsurance(
  propertyPrice: number,
  propertyType: string
): { fire: number; earthquake: number } {
  const isWooden = propertyType.includes("house");
  // 火災保険: マンション 0.03%/年・木造戸建 0.07%/年 が目安
  const fireRate = isWooden ? 0.0007 : 0.0003;
  // 地震保険: 火災保険の 50% が上限・目安は 0.04%〜0.1%
  const earthquakeRate = isWooden ? 0.001 : 0.0005;

  return {
    fire: Math.round(propertyPrice * fireRate * 10) / 10,
    earthquake: Math.round(propertyPrice * earthquakeRate * 10) / 10,
  };
}
