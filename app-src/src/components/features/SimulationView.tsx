"use client";

import { useMemo, useState } from "react";
import { useSimulatorStore } from "@/store/useSimulatorStore";
import { runSimulation, getFinancialDiagnosis } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

function formatYen(v: number) {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}億円`;
  return `${v.toFixed(0)}万円`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-xs text-gray-500 mb-1">{label}歳</p>
        <p className={`text-sm font-bold ${value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {formatYen(value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SimulationView() {
  const { profile, events, setProfile } = useSimulatorStore();
  const [savingsBoost, setSavingsBoost] = useState(0); // 月次貯蓄の追加額

  const adjustedProfile = {
    ...profile,
    monthlyVariableExpense: Math.max(0, profile.monthlyVariableExpense - savingsBoost),
  };

  const results = useMemo(
    () => runSimulation(adjustedProfile, events),
    [adjustedProfile, events]
  );

  const diagnosis = useMemo(() => getFinancialDiagnosis(results), [results]);

  // グラフ用: 5年刻み
  const chartData = results.filter((r) => r.age % 5 === 0 || r.age === profile.currentAge);

  return (
    <div className="space-y-4">
      {/* 診断バナー */}
      <Card className={diagnosis.shortfall ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}>
        <CardContent className="py-4 px-4">
          <div className="flex items-start gap-3">
            {diagnosis.shortfall ? (
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              {diagnosis.shortfall ? (
                <>
                  <p className="text-sm font-semibold text-red-700">
                    {diagnosis.shortfallAge}歳頃に資産が底をつく見込みです
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">
                    不足額：約{formatYen(diagnosis.shortfall)}。毎月の支出を見直すか、運用利回りを上げましょう。
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-emerald-700">
                    現在の計画では資産が維持できる見込みです
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {diagnosis.peakAge}歳時点で最大 {formatYen(diagnosis.peakNetWorth)} に達する見込みです。
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 資産推移グラフ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            資産推移グラフ
            <Badge variant="secondary" className="text-xs font-normal">
              {profile.currentAge}〜100歳
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netWorthNegGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="age"
                tickFormatter={(v) => `${v}歳`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 10000) return `${v / 10000}億`;
                  return `${v}万`;
                }}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#netWorthGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* パラメータ調整 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">「もし〇〇したら？」で試す</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">毎月の支出を減らす</span>
              <span className="font-medium text-emerald-600">−{savingsBoost} 万円</span>
            </div>
            <Slider
              value={[savingsBoost]}
              onValueChange={(vals) => setSavingsBoost(Array.isArray(vals) ? vals[0] : vals)}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-gray-300">
              <span>現状維持</span>
              <span>−10万円</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">運用利回り</span>
              <span className="font-medium text-emerald-600">{profile.investmentReturnRate}%</span>
            </div>
            <Slider
              value={[profile.investmentReturnRate]}
              onValueChange={(vals) => setProfile({ investmentReturnRate: Array.isArray(vals) ? vals[0] : vals })}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-gray-300">
              <span>0%（タンス預金）</span>
              <span>10%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">退職年齢</span>
              <span className="font-medium text-emerald-600">{profile.retirementAge}歳</span>
            </div>
            <Slider
              value={[profile.retirementAge]}
              onValueChange={(vals) => setProfile({ retirementAge: Array.isArray(vals) ? vals[0] : vals })}
              min={50}
              max={80}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-300">
              <span>50歳</span>
              <span>80歳</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500">最大資産</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatYen(diagnosis.peakNetWorth)}</p>
            <p className="text-xs text-gray-400">{diagnosis.peakAge}歳時点</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">退職時資産</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatYen(
                results.find((r) => r.age === profile.retirementAge)?.netWorth ?? 0
              )}
            </p>
            <p className="text-xs text-gray-400">{profile.retirementAge}歳時点</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
