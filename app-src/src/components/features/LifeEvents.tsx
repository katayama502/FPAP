"use client";

import { useState } from "react";
import { useSimulatorStore } from "@/store/useSimulatorStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LifeEvent, LifeEventType } from "@/types";
import {
  Plus,
  Trash2,
  ArrowRight,
  Home,
  Heart,
  Baby,
  Car,
  GraduationCap,
  Plane,
  Briefcase,
  Sunset,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const EVENT_TEMPLATES: {
  type: LifeEventType;
  label: string;
  icon: React.ElementType;
  defaultCost: number;
  color: string;
  isLoan?: boolean;
}[] = [
  { type: "marriage", label: "結婚", icon: Heart, defaultCost: 300, color: "bg-pink-100 text-pink-600" },
  { type: "house", label: "住宅購入", icon: Home, defaultCost: 3000, color: "bg-blue-100 text-blue-600", isLoan: true },
  { type: "car", label: "車の購入", icon: Car, defaultCost: 300, color: "bg-orange-100 text-orange-600" },
  { type: "child", label: "子どもの誕生", icon: Baby, defaultCost: 100, color: "bg-yellow-100 text-yellow-600" },
  { type: "education", label: "教育費", icon: GraduationCap, defaultCost: 500, color: "bg-purple-100 text-purple-600" },
  { type: "travel", label: "旅行・留学", icon: Plane, defaultCost: 50, color: "bg-cyan-100 text-cyan-600" },
  { type: "job_change", label: "転職・起業", icon: Briefcase, defaultCost: 50, color: "bg-green-100 text-green-600" },
  { type: "retirement", label: "早期退職", icon: Sunset, defaultCost: 0, color: "bg-amber-100 text-amber-600" },
  { type: "custom", label: "カスタム", icon: Sparkles, defaultCost: 100, color: "bg-gray-100 text-gray-600" },
];

function EventIcon({ type, className }: { type: LifeEventType; className?: string }) {
  const template = EVENT_TEMPLATES.find((t) => t.type === type);
  if (!template) return null;
  const Icon = template.icon;
  return <Icon className={className} />;
}

function eventColor(type: LifeEventType) {
  return EVENT_TEMPLATES.find((t) => t.type === type)?.color ?? "bg-gray-100 text-gray-600";
}

function AddEventDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addEvent, profile } = useSimulatorStore();
  const currentYear = new Date().getFullYear();

  const [step, setStep] = useState<"pick" | "detail">("pick");
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof EVENT_TEMPLATES)[0] | null>(null);
  const [form, setForm] = useState({
    label: "",
    year: currentYear + 1,
    cost: 0,
    isLoan: false,
    loanYears: 35,
    loanRate: 1.0,
  });

  const handlePickTemplate = (t: (typeof EVENT_TEMPLATES)[0]) => {
    setSelectedTemplate(t);
    setForm({
      label: t.label,
      year: currentYear + 1,
      cost: t.defaultCost,
      isLoan: t.isLoan ?? false,
      loanYears: 35,
      loanRate: 1.0,
    });
    setStep("detail");
  };

  const handleAdd = () => {
    if (!selectedTemplate) return;
    addEvent({
      type: selectedTemplate.type,
      label: form.label,
      year: form.year,
      cost: form.cost,
      isLoan: form.isLoan,
      loanYears: form.isLoan ? form.loanYears : undefined,
      loanRate: form.isLoan ? form.loanRate : undefined,
      enabled: true,
    });
    setStep("pick");
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setStep("pick"); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "pick" ? "イベントを追加" : selectedTemplate?.label}
          </DialogTitle>
        </DialogHeader>

        {step === "pick" && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            {EVENT_TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.type}
                  onClick={() => handlePickTemplate(t)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-center text-gray-700 leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === "detail" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">イベント名</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">発生年（西暦）</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  min={currentYear}
                  max={currentYear + 70}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">費用（万円）</Label>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>

            {selectedTemplate?.isLoan && (
              <div className="space-y-3 border rounded-lg p-3 bg-blue-50">
                <Label className="text-sm font-medium text-blue-700">ローン設定</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">返済期間（年）</Label>
                    <Input
                      type="number"
                      value={form.loanYears}
                      onChange={(e) => setForm({ ...form, loanYears: Number(e.target.value) })}
                      min={1}
                      max={50}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">年利（%）</Label>
                    <Input
                      type="number"
                      value={form.loanRate}
                      onChange={(e) => setForm({ ...form, loanRate: Number(e.target.value) })}
                      min={0}
                      max={10}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep("pick")}>
                戻る
              </Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleAdd}>
                追加する
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LifeEvents() {
  const { events, removeEvent, toggleEvent, setActiveTab } = useSimulatorStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">ライフイベント</h2>
          <p className="text-xs text-gray-400 mt-0.5">将来の大きな出来事を追加してください</p>
        </div>
        <Button
          size="sm"
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          追加
        </Button>
      </div>

      {sortedEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">まだイベントがありません</p>
              <p className="text-xs text-gray-400 mt-1">結婚・住宅購入・子どもの誕生など<br />ライフイベントを追加しましょう</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              最初のイベントを追加
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedEvents.map((event) => (
            <Card key={event.id} className={event.enabled ? "" : "opacity-50"}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${eventColor(event.type)}`}>
                    <EventIcon type={event.type} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{event.label}</span>
                      {event.isLoan && (
                        <Badge variant="secondary" className="text-xs shrink-0">ローン</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{event.year}年</span>
                      <span>•</span>
                      <span className="font-medium text-gray-600">{event.cost.toLocaleString()}万円</span>
                      {event.isLoan && event.loanYears && (
                        <>
                          <span>•</span>
                          <span>返済{event.loanYears}年</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleEvent(event.id)}
                      className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      {event.enabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
        onClick={() => setActiveTab("simulation")}
      >
        シミュレーションを見る
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>

      <AddEventDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
