"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BasicProfile, LifeEvent } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface SimulatorState {
  profile: BasicProfile;
  events: LifeEvent[];
  activeTab: string;
  setProfile: (profile: Partial<BasicProfile>) => void;
  addEvent: (event: Omit<LifeEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<LifeEvent>) => void;
  removeEvent: (id: string) => void;
  toggleEvent: (id: string) => void;
  setActiveTab: (tab: string) => void;
  resetAll: () => void;
  exportData: () => string;
}

const defaultProfile: BasicProfile = {
  currentAge: 30,
  retirementAge: 65,
  monthlyIncome: 30,
  monthlyFixedExpense: 10,
  monthlyVariableExpense: 8,
  currentSavings: 100,
  monthlySavings: 5,
  annualRaiseRate: 1,
  investmentReturnRate: 3,
};

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      events: [],
      activeTab: "profile",

      setProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, { ...event, id: uuidv4() }],
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      toggleEvent: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, enabled: !e.enabled } : e
          ),
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      resetAll: () =>
        set({ profile: defaultProfile, events: [], activeTab: "profile" }),

      exportData: () => {
        const { profile, events } = get();
        return JSON.stringify({ profile, events }, null, 2);
      },
    }),
    {
      name: "fpap-simulator-data",
    }
  )
);
