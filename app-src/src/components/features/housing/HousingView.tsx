"use client";

import { useState } from "react";
import { useHousingStore } from "@/store/useHousingStore";
import { ScenarioCard } from "./ScenarioCard";
import { PatternComparison } from "./PatternComparison";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScenarioType } from "@/types/housing";
import { Plus, Home, BarChart2, GitCompare } from "lucide-react";

function AddScenarioDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addScenario } = useHousingStore();
  const [type, setType] = useState<ScenarioType>("buy");

  const handleAdd = () => {
    if (type === "rent") {
      addScenario({
        name: "賃貸（追加）",
        type: "rent",
        rent: {
          monthlyRent: 10,
          deposit: 20,
          keyMoney: 10,
          annualRentIncreaseRate: 0.5,
          renewalFee: 10,
        },
        enabled: true,
      });
    } else {
      addScenario({
        name: "購入（追加）",
        type: "buy",
        buy: {
          propertyType: "used_mansion",
          propertyPrice: 3000,
          downPayment: 300,
          loanRate: 0.6,
          loanYears: 35,
          isFixedRate: false,
          useAutoInitialCost: true,
          manualInitialCost: 150,
          monthlyManagementFee: 1.2,
          monthlyRepairFund: 0.8,
          annualPropertyTax: 10,
          annualMaintenanceCost: 0,
          annualFireInsurance: 0.9,
          annualEarthquakeInsurance: 0.45,
          hasGroupCreditLife: true,
          propertyValueChangeRate: -1,
          sellAtAge: null,
          sellCostRate: 4,
        },
        enabled: true,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>シナリオを追加</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {[
            { value: "rent" as ScenarioType, label: "賃貸シナリオ", desc: "月額家賃・敷礼金などを設定" },
            { value: "buy" as ScenarioType, label: "購入シナリオ", desc: "物件・ローン・保険などを設定" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                type === opt.value
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className={`text-sm font-medium ${type === opt.value ? "text-emerald-700" : "text-gray-700"}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleAdd}
          >
            追加する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HousingView() {
  const { scenarios } = useHousingStore();
  const [subTab, setSubTab] = useState<"setup" | "compare">("setup");
  const [dialogOpen, setDialogOpen] = useState(false);

  const enabledCount = scenarios.filter((s) => s.enabled).length;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Home className="w-4 h-4 text-emerald-500" />
            住宅シミュレーション
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">賃貸 vs 購入、複数パターンを比較できます</p>
        </div>
        {subTab === "setup" && (
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => setDialogOpen(true)}
            disabled={scenarios.length >= 4}
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        )}
      </div>

      {/* サブタブ */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {[
          { id: "setup" as const, label: "シナリオ設定", icon: GitCompare },
          { id: "compare" as const, label: "比較シミュレーション", icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                subTab === tab.id
                  ? "bg-white shadow-sm text-emerald-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === "setup" ? "設定" : "比較"}</span>
            </button>
          );
        })}
      </div>

      {/* シナリオ設定 */}
      {subTab === "setup" && (
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => setSubTab("compare")}
            disabled={enabledCount < 1}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            {enabledCount}つのシナリオを比較する
          </Button>
        </div>
      )}

      {/* 比較 */}
      {subTab === "compare" && <PatternComparison />}

      <AddScenarioDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
