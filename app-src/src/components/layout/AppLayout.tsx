"use client";

import { useSimulatorStore } from "@/store/useSimulatorStore";
import { cn } from "@/lib/utils";
import {
  User,
  Calendar,
  TrendingUp,
  PieChart,
  Settings,
  Home,
} from "lucide-react";

const tabs = [
  { id: "profile", label: "基本設定", icon: User },
  { id: "events", label: "イベント", icon: Calendar },
  { id: "simulation", label: "資産推移", icon: TrendingUp },
  { id: "housing", label: "住宅", icon: Home },
  { id: "budget", label: "予算", icon: PieChart },
  { id: "settings", label: "設定", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useSimulatorStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">FPAP</h1>
              <p className="text-xs text-gray-400 leading-none mt-0.5">財務シミュレーター</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-medium">
            データは端末内のみ
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
