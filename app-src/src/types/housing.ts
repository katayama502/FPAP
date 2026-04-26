export type PropertyType = "new_mansion" | "used_mansion" | "new_house" | "used_house";
export type ScenarioType = "rent" | "buy";

export interface RentSettings {
  monthlyRent: number;        // 万円/月
  deposit: number;            // 敷金（万円）
  keyMoney: number;           // 礼金（万円）
  annualRentIncreaseRate: number; // 年間賃料上昇率 %
  renewalFee: number;         // 更新料（万円/2年）
}

export interface BuySettings {
  propertyType: PropertyType;
  propertyPrice: number;       // 物件価格（万円）
  downPayment: number;         // 頭金（万円）
  loanRate: number;            // 金利（%/年）
  loanYears: number;           // 返済期間（年）
  isFixedRate: boolean;        // 固定金利か変動金利か

  // 初期費用（自動計算も可）
  useAutoInitialCost: boolean;
  manualInitialCost: number;   // 手動入力の諸費用（万円）

  // 維持費
  monthlyManagementFee: number;   // 管理費（万円）※マンションのみ
  monthlyRepairFund: number;      // 修繕積立金（万円）※マンションのみ
  annualPropertyTax: number;      // 固定資産税（万円/年）
  annualMaintenanceCost: number;  // 維持・修繕費（万円/年）※戸建て

  // 保険
  annualFireInsurance: number;     // 火災保険（万円/年）
  annualEarthquakeInsurance: number; // 地震保険（万円/年）
  hasGroupCreditLife: boolean;     // 団体信用生命保険（団信）

  // 資産価値
  propertyValueChangeRate: number; // 資産価値変動率（%/年）
  sellAtAge: number | null;        // 売却年齢（nullなら保持）
  sellCostRate: number;            // 売却時諸費用率（%）
}

export interface HousingScenario {
  id: string;
  name: string;
  color: string;
  type: ScenarioType;
  rent?: RentSettings;
  buy?: BuySettings;
  enabled: boolean;
}

export interface HousingYearResult {
  age: number;
  year: number;
  // 住宅コスト
  annualHousingCost: number;   // その年の住宅関連総コスト（万円）
  monthlyHousingCost: number;  // 月換算
  loanBalance: number;         // ローン残高（万円）
  propertyValue: number;       // 物件価値（万円）0 if rent
  equity: number;              // 純資産への上乗せ（物件価値 - ローン残高）
  // 累計
  cumulativeCost: number;      // 累計支出（万円）
  netWorthWithHousing: number; // 住宅込みの純資産
}

export interface HousingComparisonResult {
  scenario: HousingScenario;
  yearResults: HousingYearResult[];
  totalCost: number;           // 生涯住宅コスト（万円）
  finalEquity: number;         // 最終的な住宅資産（万円）
  breakEvenAge: number | null; // 賃貸と比較した損益分岐年齢
}
