"use client";

import { useState } from "react";
import { useHousingStore } from "@/store/useHousingStore";
import { estimateInitialCost, estimateInsurance, calcMonthlyPayment } from "@/lib/housingSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HousingScenario, PropertyType } from "@/types/housing";
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Trash2, Info } from "lucide-react";

function NumField({
  label,
  hint,
  unit,
  value,
  onChange,
  min = 0,
  step = 1,
  small = false,
}: {
  label: string;
  hint?: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  small?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${small ? "" : "py-0.5"}`}>
      <Label className={`text-gray-600 leading-tight ${small ? "text-xs" : "text-sm"}`}>
        {label}
        {hint && <span className="block text-xs text-gray-400 font-normal">{hint}</span>}
      </Label>
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`text-right ${small ? "w-20 h-7 text-xs" : "w-24 h-8 text-sm"}`}
          min={min}
          step={step}
        />
        <span className={`text-gray-500 ${small ? "text-xs w-6" : "text-xs w-8"}`}>{unit}</span>
      </div>
    </div>
  );
}

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  new_mansion: "新築マンション",
  used_mansion: "中古マンション",
  new_house: "新築戸建て",
  used_house: "中古戸建て",
};

function RentForm({ scenario }: { scenario: HousingScenario }) {
  const { updateRentSettings } = useHousingStore();
  const r = scenario.rent!;
  const upd = (updates: Parameters<typeof updateRentSettings>[1]) =>
    updateRentSettings(scenario.id, updates);

  return (
    <div className="space-y-3">
      <NumField label="月額家賃" unit="万円" value={r.monthlyRent} onChange={(v) => upd({ monthlyRent: v })} step={0.5} />
      <NumField label="敷金" hint="退去時に精算" unit="万円" value={r.deposit} onChange={(v) => upd({ deposit: v })} />
      <NumField label="礼金" unit="万円" value={r.keyMoney} onChange={(v) => upd({ keyMoney: v })} />
      <NumField label="更新料" hint="2年ごと" unit="万円" value={r.renewalFee} onChange={(v) => upd({ renewalFee: v })} />
      <NumField label="賃料上昇率" hint="5年ごとに適用" unit="%" value={r.annualRentIncreaseRate} onChange={(v) => upd({ annualRentIncreaseRate: v })} step={0.1} />
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 mt-1">
        <span className="font-medium text-gray-500">月額換算：</span>
        {r.monthlyRent.toFixed(1)}万円（家賃）+
        更新 {(r.renewalFee / 24).toFixed(2)}万円/月
        = <span className="font-semibold text-gray-700">{(r.monthlyRent + r.renewalFee / 24).toFixed(1)}万円</span>
      </div>
    </div>
  );
}

function BuyForm({ scenario }: { scenario: HousingScenario }) {
  const { updateBuySettings } = useHousingStore();
  const b = scenario.buy!;
  const upd = (updates: Parameters<typeof updateBuySettings>[1]) =>
    updateBuySettings(scenario.id, updates);

  const loanAmount = b.propertyPrice - b.downPayment;
  const monthly = calcMonthlyPayment(loanAmount, b.loanRate, b.loanYears);
  const autoInitialCost = estimateInitialCost(b.propertyPrice, b.propertyType, loanAmount);
  const suggestedInsurance = estimateInsurance(b.propertyPrice, b.propertyType);
  const isMansion = b.propertyType.includes("mansion");

  const totalMonthly =
    monthly +
    b.monthlyManagementFee +
    b.monthlyRepairFund +
    b.annualPropertyTax / 12 +
    b.annualFireInsurance / 12 +
    b.annualEarthquakeInsurance / 12 +
    (isMansion ? 0 : b.annualMaintenanceCost / 12);

  return (
    <div className="space-y-4">
      {/* 物件基本情報 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">物件情報</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-600">物件種別</Label>
          <Select
            value={b.propertyType}
            onValueChange={(v) => {
              const pt = v as PropertyType;
              const ins = estimateInsurance(b.propertyPrice, pt);
              upd({
                propertyType: pt,
                annualFireInsurance: ins.fire,
                annualEarthquakeInsurance: ins.earthquake,
              });
            }}
          >
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumField label="物件価格" unit="万円" value={b.propertyPrice} onChange={(v) => {
          const ins = estimateInsurance(v, b.propertyType);
          upd({ propertyPrice: v, annualFireInsurance: ins.fire, annualEarthquakeInsurance: ins.earthquake });
        }} step={100} />
        <NumField label="頭金" hint={`借入: ${Math.max(0, loanAmount).toLocaleString()}万円`} unit="万円" value={b.downPayment} onChange={(v) => upd({ downPayment: v })} step={50} />
      </div>

      {/* ローン */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">住宅ローン</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-600">金利タイプ</Label>
          <div className="flex gap-2">
            {[
              { value: false, label: "変動" },
              { value: true, label: "固定" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => upd({ isFixedRate: opt.value })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  b.isFixedRate === opt.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {opt.label}金利
              </button>
            ))}
          </div>
        </div>
        <NumField label="金利" hint={b.isFixedRate ? "35年固定の場合 1.8%前後" : "変動の場合 0.3〜0.6%前後"} unit="%" value={b.loanRate} onChange={(v) => upd({ loanRate: v })} step={0.05} />
        <NumField label="返済期間" unit="年" value={b.loanYears} onChange={(v) => upd({ loanYears: v })} min={1} />
        <div className="bg-blue-50 rounded-lg p-2.5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-blue-600">月々のローン返済</span>
            <span className="font-bold text-blue-700">{monthly.toFixed(2)} 万円</span>
          </div>
          <div className="flex justify-between text-xs text-blue-400">
            <span>総返済額</span>
            <span>{(monthly * b.loanYears * 12).toFixed(0)} 万円（利息込み）</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-600">
            団体信用生命保険（団信）
            <span className="block text-xs text-gray-400 font-normal">死亡時にローン残高がゼロに</span>
          </Label>
          <button
            onClick={() => upd({ hasGroupCreditLife: !b.hasGroupCreditLife })}
            className={b.hasGroupCreditLife ? "text-emerald-500" : "text-gray-300"}
          >
            {b.hasGroupCreditLife
              ? <ToggleRight className="w-7 h-7" />
              : <ToggleLeft className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* 諸費用 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">初期費用・諸費用</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-600">自動計算</Label>
          <button
            onClick={() => upd({ useAutoInitialCost: !b.useAutoInitialCost })}
            className={b.useAutoInitialCost ? "text-emerald-500" : "text-gray-300"}
          >
            {b.useAutoInitialCost
              ? <ToggleRight className="w-7 h-7" />
              : <ToggleLeft className="w-7 h-7" />}
          </button>
        </div>
        {b.useAutoInitialCost ? (
          <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>推定諸費用（仲介・登記・ローン手数料等）</span>
              <span className="font-semibold text-gray-700">約 {autoInitialCost.toFixed(0)} 万円</span>
            </div>
          </div>
        ) : (
          <NumField label="諸費用（手動）" unit="万円" value={b.manualInitialCost} onChange={(v) => upd({ manualInitialCost: v })} />
        )}
      </div>

      {/* 維持費 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">月次維持費</p>
        {isMansion ? (
          <>
            <NumField label="管理費" unit="万円/月" value={b.monthlyManagementFee} onChange={(v) => upd({ monthlyManagementFee: v })} step={0.1} small />
            <NumField label="修繕積立金" hint="年々増額が多い" unit="万円/月" value={b.monthlyRepairFund} onChange={(v) => upd({ monthlyRepairFund: v })} step={0.1} small />
          </>
        ) : (
          <NumField label="維持・修繕費" hint="外壁・設備など" unit="万円/年" value={b.annualMaintenanceCost} onChange={(v) => upd({ annualMaintenanceCost: v })} step={1} small />
        )}
        <NumField label="固定資産税" hint="年額" unit="万円/年" value={b.annualPropertyTax} onChange={(v) => upd({ annualPropertyTax: v })} step={0.5} small />
      </div>

      {/* 保険 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          保険料
          <span className="text-gray-400 font-normal normal-case text-xs">（参考値: 火災 {suggestedInsurance.fire}万 / 地震 {suggestedInsurance.earthquake}万）</span>
        </p>
        <NumField label="火災保険" hint="建物評価額・構造に依存" unit="万円/年" value={b.annualFireInsurance} onChange={(v) => upd({ annualFireInsurance: v })} step={0.1} small />
        <NumField label="地震保険" hint="火災保険の30〜50%が目安" unit="万円/年" value={b.annualEarthquakeInsurance} onChange={(v) => upd({ annualEarthquakeInsurance: v })} step={0.1} small />
      </div>

      {/* 資産価値 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">資産価値の変動</p>
        <NumField label="年間価値変動率" hint="下落: マイナス・上昇: プラス" unit="%/年" value={b.propertyValueChangeRate} onChange={(v) => upd({ propertyValueChangeRate: v })} step={0.1} small />
        <NumField
          label="売却予定年齢"
          hint="0 = 売却しない"
          unit="歳"
          value={b.sellAtAge ?? 0}
          onChange={(v) => upd({ sellAtAge: v === 0 ? null : v })}
          small
        />
        {b.sellAtAge && (
          <NumField label="売却時諸費用" hint="仲介手数料等" unit="%" value={b.sellCostRate} onChange={(v) => upd({ sellCostRate: v })} step={0.5} small />
        )}
      </div>

      {/* 月額サマリー */}
      <div className="bg-emerald-50 rounded-lg p-3 space-y-1">
        <p className="text-xs font-semibold text-emerald-700">月額住宅コスト（概算）</p>
        {[
          { label: "ローン返済", v: monthly },
          { label: "管理費・修繕積立", v: b.monthlyManagementFee + b.monthlyRepairFund },
          { label: "固定資産税（月割）", v: b.annualPropertyTax / 12 },
          { label: "保険料（月割）", v: (b.annualFireInsurance + b.annualEarthquakeInsurance) / 12 },
          { label: "維持・修繕（月割）", v: b.annualMaintenanceCost / 12 },
        ].map((row) => row.v > 0 && (
          <div key={row.label} className="flex justify-between text-xs text-emerald-600">
            <span>{row.label}</span>
            <span>{row.v.toFixed(2)} 万円</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold text-emerald-800 border-t border-emerald-200 pt-1 mt-1">
          <span>合計</span>
          <span>{totalMonthly.toFixed(2)} 万円/月</span>
        </div>
      </div>
    </div>
  );
}

export function ScenarioCard({ scenario }: { scenario: HousingScenario }) {
  const { updateScenario, removeScenario, toggleScenario, scenarios } = useHousingStore();
  const [expanded, setExpanded] = useState(true);

  const canDelete = scenarios.length > 1;

  return (
    <Card className={`border-l-4 transition-opacity ${scenario.enabled ? "opacity-100" : "opacity-60"}`}
      style={{ borderLeftColor: scenario.color }}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: scenario.color }} />
          <Input
            value={scenario.name}
            onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
            className="h-7 text-sm font-semibold border-none shadow-none p-0 focus-visible:ring-0 bg-transparent"
          />
          <div className="flex items-center gap-1 ml-auto">
            <Badge variant={scenario.type === "rent" ? "secondary" : "outline"} className="text-xs">
              {scenario.type === "rent" ? "賃貸" : "購入"}
            </Badge>
            <button onClick={() => toggleScenario(scenario.id)} className="p-1 text-gray-400 hover:text-emerald-500">
              {scenario.enabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
            {canDelete && (
              <button onClick={() => removeScenario(scenario.id)} className="p-1 text-gray-300 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4">
          {scenario.type === "rent" && scenario.rent && <RentForm scenario={scenario} />}
          {scenario.type === "buy" && scenario.buy && <BuyForm scenario={scenario} />}
        </CardContent>
      )}
    </Card>
  );
}
