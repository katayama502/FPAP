"use client";

import { useState } from "react";
import { useSimulatorStore } from "@/store/useSimulatorStore";
import { getBudgetAllocation } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type ModelId = "50-30-20" | "60-20-20" | "custom";

const MODELS: { id: ModelId; label: string; desc: string }[] = [
  { id: "50-30-20", label: "50/30/20 ルール", desc: "必要支出50% / 欲しいもの30% / 貯蓄20%" },
  { id: "60-20-20", label: "60/20/20 ルール", desc: "必要支出60% / 欲しいもの20% / 貯蓄20%" },
  { id: "custom", label: "カスタム", desc: "自分で配分を決める" },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

export function BudgetPlanner() {
  const { profile } = useSimulatorStore();
  const [selectedModel, setSelectedModel] = useState<ModelId>("50-30-20");
  const [customRatios, setCustomRatios] = useState({ needs: 50, wants: 30, savings: 20 });

  const allocation = getBudgetAllocation(
    profile.monthlyIncome,
    selectedModel,
    customRatios
  );

  const currentNeeds = profile.monthlyFixedExpense + profile.monthlyVariableExpense;
  const currentSavings = profile.monthlyIncome - currentNeeds;

  const chartData = [
    { name: "固定・生活費", value: allocation.needs },
    { name: "自由支出", value: allocation.wants },
    { name: "貯蓄・投資", value: allocation.savings },
  ];

  const currentChartData = [
    { name: "固定費", value: profile.monthlyFixedExpense },
    { name: "変動費", value: profile.monthlyVariableExpense },
    { name: "貯蓄", value: Math.max(0, currentSavings) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">予算プランナー</h2>
        <p className="text-xs text-gray-400 mt-0.5">収入に対する理想的な支出配分を確認しましょう</p>
      </div>

      {/* モデル選択 */}
      <div className="grid gap-2">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              selectedModel === m.id
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${selectedModel === m.id ? "text-emerald-700" : "text-gray-700"}`}>
                {m.label}
              </span>
              {selectedModel === m.id && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* カスタム設定 */}
      {selectedModel === "custom" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">配分をカスタマイズ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "needs" as const, label: "固定・生活費", color: "text-emerald-600" },
              { key: "wants" as const, label: "自由支出", color: "text-blue-600" },
              { key: "savings" as const, label: "貯蓄・投資", color: "text-amber-600" },
            ].map(({ key, label, color }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className={`font-medium ${color}`}>{customRatios[key]}%</span>
                </div>
                <Slider
                  value={[customRatios[key]]}
                  onValueChange={(vals) => {
                    const v = Array.isArray(vals) ? vals[0] : vals;
                    const total = Object.entries(customRatios)
                      .filter(([k]) => k !== key)
                      .reduce((s, [, val]) => s + val, 0);
                    if (v + total <= 100) {
                      setCustomRatios({ ...customRatios, [key]: v });
                    }
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            ))}
            <div className={`text-xs text-center font-medium ${
              customRatios.needs + customRatios.wants + customRatios.savings === 100
                ? "text-emerald-600"
                : "text-red-500"
            }`}>
              合計: {customRatios.needs + customRatios.wants + customRatios.savings}%
              {customRatios.needs + customRatios.wants + customRatios.savings !== 100 && " （100%になるよう調整してください）"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 理想配分 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">理想の月次配分</CardTitle>
          <CardDescription className="text-xs">月収 {profile.monthlyIncome}万円 に対して</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}万円`]} />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: "固定・生活費", value: allocation.needs, color: "bg-emerald-500" },
              { label: "自由支出", value: allocation.wants, color: "bg-blue-500" },
              { label: "貯蓄・投資", value: allocation.savings, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className={`text-lg font-bold text-gray-900`}>{item.value}</div>
                <div className="text-xs text-gray-400">万円/月</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 現状との比較 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">現状との比較</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "生活費合計",
              current: currentNeeds,
              ideal: allocation.needs,
              isGoodWhenLow: true,
            },
            {
              label: "貯蓄額",
              current: Math.max(0, currentSavings),
              ideal: allocation.savings,
              isGoodWhenLow: false,
            },
          ].map((row) => {
            const diff = row.current - row.ideal;
            const isGood = row.isGoodWhenLow ? diff <= 0 : diff >= 0;
            return (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">現状 {row.current.toFixed(1)}万</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-700">推奨 {row.ideal.toFixed(1)}万</span>
                  <span className={`text-xs font-medium ${isGood ? "text-emerald-600" : "text-red-500"}`}>
                    {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}万
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
