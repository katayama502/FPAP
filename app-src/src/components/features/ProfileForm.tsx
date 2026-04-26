"use client";

import { useSimulatorStore } from "@/store/useSimulatorStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

function FieldRow({
  label,
  hint,
  unit,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  hint?: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {hint && (
            <span className="ml-1 text-xs text-gray-400 font-normal">{hint}</span>
          )}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 h-8 text-right text-sm"
            min={min}
            max={max}
            step={step}
          />
          <span className="text-xs text-gray-500 w-8">{unit}</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(Array.isArray(vals) ? vals[0] : vals)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-300">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function ProfileForm() {
  const { profile, setProfile, setActiveTab } = useSimulatorStore();

  const monthlySavings =
    profile.monthlyIncome -
    profile.monthlyFixedExpense -
    profile.monthlyVariableExpense;

  return (
    <div className="space-y-4">
      {/* 基本情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本情報</CardTitle>
          <CardDescription className="text-xs">現在の状況を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldRow
            label="現在の年齢"
            unit="歳"
            value={profile.currentAge}
            onChange={(v) => setProfile({ currentAge: v })}
            min={18}
            max={80}
          />
          <FieldRow
            label="退職予定年齢"
            unit="歳"
            value={profile.retirementAge}
            onChange={(v) => setProfile({ retirementAge: v })}
            min={50}
            max={80}
          />
          <FieldRow
            label="現在の貯蓄額"
            unit="万円"
            value={profile.currentSavings}
            onChange={(v) => setProfile({ currentSavings: v })}
            min={0}
            max={5000}
            step={10}
          />
        </CardContent>
      </Card>

      {/* 収入・支出 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">月次収支</CardTitle>
          <CardDescription className="text-xs">手取り月収と月々の支出を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldRow
            label="手取り月収"
            unit="万円"
            value={profile.monthlyIncome}
            onChange={(v) => setProfile({ monthlyIncome: v })}
            min={10}
            max={200}
            step={1}
          />
          <FieldRow
            label="固定費"
            hint="(家賃・光熱費・保険など)"
            unit="万円"
            value={profile.monthlyFixedExpense}
            onChange={(v) => setProfile({ monthlyFixedExpense: v })}
            min={0}
            max={50}
            step={0.5}
          />
          <FieldRow
            label="変動費"
            hint="(食費・娯楽・交通など)"
            unit="万円"
            value={profile.monthlyVariableExpense}
            onChange={(v) => setProfile({ monthlyVariableExpense: v })}
            min={0}
            max={50}
            step={0.5}
          />

          {/* 月次貯蓄サマリー */}
          <div className={`rounded-lg p-3 flex items-center justify-between ${
            monthlySavings >= 0 ? "bg-emerald-50" : "bg-red-50"
          }`}>
            <div className="flex items-center gap-1.5 text-sm">
              <Info className={`w-4 h-4 ${monthlySavings >= 0 ? "text-emerald-600" : "text-red-500"}`} />
              <span className={monthlySavings >= 0 ? "text-emerald-700" : "text-red-600"}>
                月間収支（推定）
              </span>
            </div>
            <span className={`font-bold text-base ${monthlySavings >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {monthlySavings >= 0 ? "+" : ""}{monthlySavings.toFixed(1)} 万円
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 運用設定 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">将来設定</CardTitle>
          <CardDescription className="text-xs">想定利回りと昇給率を設定してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldRow
            label="年収上昇率"
            hint="(昇給・昇進の見込み)"
            unit="%"
            value={profile.annualRaiseRate}
            onChange={(v) => setProfile({ annualRaiseRate: v })}
            min={0}
            max={10}
            step={0.5}
          />
          <FieldRow
            label="運用利回り"
            hint="(貯蓄・投資の想定)"
            unit="%"
            value={profile.investmentReturnRate}
            onChange={(v) => setProfile({ investmentReturnRate: v })}
            min={0}
            max={10}
            step={0.5}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
        onClick={() => setActiveTab("events")}
      >
        ライフイベントを設定する
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}
