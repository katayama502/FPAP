"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HousingScenario, RentSettings, BuySettings } from "@/types/housing";

const defaultRent: RentSettings = {
  monthlyRent: 10,
  deposit: 20,
  keyMoney: 10,
  annualRentIncreaseRate: 0.5,
  renewalFee: 10,
};

const defaultBuyNew: BuySettings = {
  propertyType: "new_mansion",
  propertyPrice: 4000,
  downPayment: 400,
  loanRate: 0.5,
  loanYears: 35,
  isFixedRate: false,
  useAutoInitialCost: true,
  manualInitialCost: 200,
  monthlyManagementFee: 1.5,
  monthlyRepairFund: 1,
  annualPropertyTax: 12,
  annualMaintenanceCost: 0,
  annualFireInsurance: 1.2,
  annualEarthquakeInsurance: 0.6,
  hasGroupCreditLife: true,
  propertyValueChangeRate: -1,
  sellAtAge: null,
  sellCostRate: 4,
};

const defaultBuyUsed: BuySettings = {
  propertyType: "used_house",
  propertyPrice: 2500,
  downPayment: 500,
  loanRate: 0.8,
  loanYears: 30,
  isFixedRate: false,
  useAutoInitialCost: true,
  manualInitialCost: 200,
  monthlyManagementFee: 0,
  monthlyRepairFund: 0,
  annualPropertyTax: 10,
  annualMaintenanceCost: 20,
  annualFireInsurance: 1.8,
  annualEarthquakeInsurance: 0.9,
  hasGroupCreditLife: true,
  propertyValueChangeRate: -1.5,
  sellAtAge: null,
  sellCostRate: 4,
};

const SCENARIO_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const defaultScenarios: HousingScenario[] = [
  {
    id: "scenario-rent",
    name: "賃貸",
    color: SCENARIO_COLORS[0],
    type: "rent",
    rent: defaultRent,
    enabled: true,
  },
  {
    id: "scenario-buy-new",
    name: "新築マンション購入",
    color: SCENARIO_COLORS[1],
    type: "buy",
    buy: defaultBuyNew,
    enabled: true,
  },
  {
    id: "scenario-buy-used",
    name: "中古戸建て購入",
    color: SCENARIO_COLORS[2],
    type: "buy",
    buy: defaultBuyUsed,
    enabled: false,
  },
];

interface HousingState {
  scenarios: HousingScenario[];
  activeScenarioId: string;
  activeSubTab: "setup" | "compare";
  addScenario: (scenario: Omit<HousingScenario, "id" | "color">) => void;
  updateScenario: (id: string, updates: Partial<HousingScenario>) => void;
  updateRentSettings: (id: string, updates: Partial<RentSettings>) => void;
  updateBuySettings: (id: string, updates: Partial<BuySettings>) => void;
  removeScenario: (id: string) => void;
  toggleScenario: (id: string) => void;
  setActiveScenario: (id: string) => void;
  setActiveSubTab: (tab: "setup" | "compare") => void;
  resetHousing: () => void;
}

export const useHousingStore = create<HousingState>()(
  persist(
    (set, get) => ({
      scenarios: defaultScenarios,
      activeScenarioId: "scenario-rent",
      activeSubTab: "setup",

      addScenario: (scenario) => {
        const { scenarios } = get();
        const id = `scenario-${Date.now()}`;
        const color = SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length];
        set({ scenarios: [...scenarios, { ...scenario, id, color }] });
      },

      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      updateRentSettings: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id && s.rent
              ? { ...s, rent: { ...s.rent, ...updates } }
              : s
          ),
        })),

      updateBuySettings: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id && s.buy
              ? { ...s, buy: { ...s.buy, ...updates } }
              : s
          ),
        })),

      removeScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
        })),

      toggleScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        })),

      setActiveScenario: (id) => set({ activeScenarioId: id }),
      setActiveSubTab: (tab) => set({ activeSubTab: tab }),
      resetHousing: () =>
        set({ scenarios: defaultScenarios, activeScenarioId: "scenario-rent" }),
    }),
    { name: "fpap-housing-data" }
  )
);
