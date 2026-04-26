"use client";

import { useSimulatorStore } from "@/store/useSimulatorStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Shield, Info } from "lucide-react";
import { useState } from "react";

export function SettingsView() {
  const { resetAll, exportData } = useSimulatorStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fpap-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirmReset) {
      resetAll();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">設定・データ管理</h2>
        <p className="text-xs text-gray-400 mt-0.5">データのエクスポートやリセットができます</p>
      </div>

      {/* プライバシー */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="py-4 px-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">プライバシーについて</p>
              <ul className="text-xs text-emerald-700 mt-1.5 space-y-1">
                <li>• 入力したデータは <strong>このデバイスのみ</strong> に保存されます</li>
                <li>• サーバーへの送信は一切ありません</li>
                <li>• 口座情報・個人情報の収集はしません</li>
                <li>• ブラウザのLocalStorageを使用しています</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* データエクスポート */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            データをエクスポート
          </CardTitle>
          <CardDescription className="text-xs">
            入力したプロフィールとライフイベントをJSONファイルとして保存できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            JSONでダウンロード
          </Button>
        </CardContent>
      </Card>

      {/* データリセット */}
      <Card className="border-red-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
            <Trash2 className="w-4 h-4" />
            データをリセット
          </CardTitle>
          <CardDescription className="text-xs">
            すべての入力データを削除し、初期状態に戻します。この操作は取り消せません。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {confirmReset && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <Info className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">本当にすべてのデータを削除しますか？もう一度押すと削除されます。</p>
            </div>
          )}
          <Button
            variant={confirmReset ? "destructive" : "outline"}
            className={`w-full ${!confirmReset && "text-red-600 border-red-200 hover:bg-red-50"}`}
            onClick={handleReset}
            onBlur={() => setConfirmReset(false)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {confirmReset ? "確認：すべて削除する" : "データをリセット"}
          </Button>
        </CardContent>
      </Card>

      {/* アプリ情報 */}
      <Card>
        <CardContent className="py-4 px-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-medium text-gray-500">FPAP - ファイナンシャルシミュレーター</p>
              <p>このアプリは教育・シミュレーション目的のツールです。</p>
              <p>表示される数値はあくまで試算であり、実際の投資成果や将来の収支を保証するものではありません。</p>
              <p className="mt-2">重要な財務決定については、ファイナンシャルプランナー等の専門家にご相談ください。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
