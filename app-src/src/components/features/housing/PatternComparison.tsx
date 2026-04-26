"use client";

import { useMemo } from "react";
import { useHousingStore } from "@/store/useHousingStore";
import { useSimulatorStore } from "@/store/useSimulatorStore";
import { runHousingComparison } from "@/lib/housingSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingDown, Home, DollarSign, Scale } from "lucide-react";

function fmt(v: number) {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}億円`;
  return `${Math.round(v)}万円`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-600 mb-2">{label}歳</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="font-bold ml-auto" style={{ color: p.color }}>
            {fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function PatternComparison() {
  const { scenarios } = useHousingStore();
  const { profile } = useSimulatorStore();

  const results = useMemo(
    () => runHousingComparison(profile, scenarios),
    [profile, scenarios]
  );

  const activeResults = results.filter((r) => r.scenario.enabled);

  // グラフデータ（5歳刻み）
  const chartData = useMemo(() => {
    if (activeResults.length === 0) return [];
    const ages = activeResults[0].yearResults
      .filter((yr) => yr.age % 5 === 0 || yr.age === profile.currentAge)
      .map((yr) => yr.age);

    return ages.map((age) => {
      const row: Record<string, number | string> = { age };
      activeResults.forEach((r) => {
        const yr = r.yearResults.find((y) => y.age === age);
        if (yr) row[r.scenario.name] = yr.netWorthWithHousing;
      });
      return row;
    });
  }, [activeResults, profile.currentAge]);

  // 累計コストグラフ（5歳刻み）
  const costChartData = useMemo(() => {
    if (activeResults.length === 0) return [];
    const ages = activeResults[0].yearResults
      .filter((yr) => yr.age % 5 === 0 || yr.age === profile.currentAge)
      .map((yr) => yr.age);

    return ages.map((age) => {
      const row: Record<string, number | string> = { age };
      activeResults.forEach((r) => {
        const yr = r.yearResults.find((y) => y.age === age);
        if (yr) row[r.scenario.name] = yr.cumulativeCost;
      });
      return row;
    });
  }, [activeResults, profile.currentAge]);

  if (activeResults.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        シナリオを有効にしてください
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* サマリーカード */}
      <div className="grid gap-3">
        {activeResults.map((r) => {
          const age65 = r.yearResults.find((yr) => yr.age === 65);
          const age80 = r.yearResults.find((yr) => yr.age === 80);
          return (
            <Card key={r.scenario.id} className="border-l-4" style={{ borderLeftColor: r.scenario.color }}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.scenario.color }} />
                  <span className="font-semibold text-sm text-gray-800">{r.scenario.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {r.scenario.type === "rent" ? "賃貸" : "購入"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-0.5">
                      <DollarSign className="w-3 h-3" /> 生涯コスト
                    </p>
                    <p className="text-sm font-bold text-gray-800">{fmt(r.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> 65歳資産
                    </p>
                    <p className={`text-sm font-bold ${(age65?.netWorthWithHousing ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {fmt(age65?.netWorthWithHousing ?? 0)}
                    </p>
                  </div>
                  <div>
                    {r.scenario.type === "buy" ? (
                      <>
                        <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-0.5">
                          <Home className="w-3 h-3" /> 住宅資産
                        </p>
                        <p className="text-sm font-bold text-blue-600">{fmt(r.finalEquity)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-0.5">
                          <TrendingDown className="w-3 h-3" /> 80歳資産
                        </p>
                        <p className={`text-sm font-bold ${(age80?.netWorthWithHousing ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {fmt(age80?.netWorthWithHousing ?? 0)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {r.breakEvenAge && (
                  <div className="mt-2 bg-amber-50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      賃貸との<span className="font-semibold">損益分岐点：{r.breakEvenAge}歳</span>
                      （それ以降は購入が有利）
                    </p>
                  </div>
                )}
                {r.scenario.type === "buy" && !r.breakEvenAge && (
                  <div className="mt-2 bg-red-50 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-red-600">シミュレーション期間内に賃貸を上回りませんでした</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 純資産推移グラフ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">純資産推移（住宅資産含む）</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="age" tickFormatter={(v) => `${v}歳`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 10000) return `${v / 10000}億`;
                  return `${v}万`;
                }}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              {activeResults.map((r) => (
                <Line
                  key={r.scenario.id}
                  type="monotone"
                  dataKey={r.scenario.name}
                  stroke={r.scenario.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 累計コストグラフ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">住宅累計支出</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="age" tickFormatter={(v) => `${v}歳`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${v}万`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              {activeResults.map((r) => (
                <Line
                  key={r.scenario.id}
                  type="monotone"
                  dataKey={r.scenario.name}
                  stroke={r.scenario.color}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray={r.scenario.type === "rent" ? "5 5" : undefined}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">※購入シナリオは頭金・諸費用・ローン返済・維持費の累計</p>
        </CardContent>
      </Card>

      {/* 年齢別詳細テーブル */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">年齢別コスト比較</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-400 font-normal w-14">年齢</th>
                {activeResults.map((r) => (
                  <th key={r.scenario.id} className="text-right py-2 font-medium" style={{ color: r.scenario.color }}>
                    {r.scenario.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[35, 40, 45, 50, 55, 60, 65, 70, 75, 80].filter(age => age >= profile.currentAge).map((age) => (
                <tr key={age} className="border-b border-gray-50">
                  <td className="py-2 text-gray-500 font-medium">{age}歳</td>
                  {activeResults.map((r) => {
                    const yr = r.yearResults.find((y) => y.age === age);
                    if (!yr) return <td key={r.scenario.id} className="text-right py-2 text-gray-300">—</td>;
                    return (
                      <td key={r.scenario.id} className="text-right py-2">
                        <div className={`font-semibold ${yr.netWorthWithHousing >= 0 ? "text-gray-800" : "text-red-500"}`}>
                          {fmt(yr.netWorthWithHousing)}
                        </div>
                        <div className="text-gray-400">{yr.monthlyHousingCost.toFixed(1)}万/月</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 注意書き */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
        <p className="font-medium text-gray-500 mb-1">シミュレーションの前提</p>
        <ul className="space-y-0.5">
          <li>• 金利・物価・税制の変動は考慮していません</li>
          <li>• 購入後の物件価値変動は入力値に基づく単純計算です</li>
          <li>• 修繕積立金の値上がり・大規模修繕は含まれていません</li>
          <li>• 純資産は現金資産 + 住宅純資産（物件価値 − ローン残高）</li>
          <li>• 投資機会費用（賃貸の余剰資金を運用した場合）は含まれていません</li>
        </ul>
      </div>
    </div>
  );
}
