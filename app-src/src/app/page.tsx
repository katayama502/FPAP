"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileForm } from "@/components/features/ProfileForm";
import { LifeEvents } from "@/components/features/LifeEvents";
import { SimulationView } from "@/components/features/SimulationView";
import { BudgetPlanner } from "@/components/features/BudgetPlanner";
import { SettingsView } from "@/components/features/SettingsView";
import { HousingView } from "@/components/features/housing/HousingView";
import { useSimulatorStore } from "@/store/useSimulatorStore";

export default function Home() {
  const { activeTab } = useSimulatorStore();

  const renderContent = () => {
    switch (activeTab) {
      case "profile":   return <ProfileForm />;
      case "events":    return <LifeEvents />;
      case "simulation": return <SimulationView />;
      case "housing":   return <HousingView />;
      case "budget":    return <BudgetPlanner />;
      case "settings":  return <SettingsView />;
      default:          return <ProfileForm />;
    }
  };

  return <AppLayout>{renderContent()}</AppLayout>;
}
