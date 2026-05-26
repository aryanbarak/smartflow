import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, BookOpen, GraduationCap, Star, Wallet, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFamily } from "@/hooks/useFamily";
import { useRewardPoints } from "@/hooks/useRewardPoints";
import { useChecklist } from "@/hooks/useChecklist";
import { ChildSelector } from "@/components/family-hub/ChildSelector";
import { DailyChecklist } from "@/components/family-hub/DailyChecklist";
import { HomeworkList } from "@/components/family-hub/HomeworkList";
import { ExamCountdown } from "@/components/family-hub/ExamCountdown";
import { PocketMoney } from "@/components/family-hub/PocketMoney";
import { RewardSystem } from "@/components/family-hub/RewardSystem";
import { WeeklyReport } from "@/components/family-hub/WeeklyReport";

// Per-child completion badge data: reads checklist state for selected child only
function ChildCompletionBridge({ childId, onUpdate }: { childId: string; onUpdate: (id: string, done: number, total: number) => void }) {
  const { completedCount, totalCount } = useChecklist(childId);
  useEffect(() => {
    onUpdate(childId, completedCount, totalCount);
  }, [childId, completedCount, totalCount, onUpdate]);
  return null;
}

export default function FamilyHubPage() {
  const { children, isLoading, updateChild } = useFamily();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completionMap, setCompletionMap] = useState<Record<string, { done: number; total: number }>>({});

  const selectedChild = useMemo(() => {
    if (!selectedId) return children[0] ?? null;
    return children.find((c) => c.id === selectedId) ?? children[0] ?? null;
  }, [children, selectedId]);

  useEffect(() => {
    if (!selectedId && children.length > 0) setSelectedId(children[0].id);
  }, [children, selectedId]);

  const updateCompletion = useMemo(
    () => (id: string, done: number, total: number) => {
      setCompletionMap((prev) => ({ ...prev, [id]: { done, total } }));
    },
    []
  );

  // Reward points hook at page level so auto-award works across tabs
  const { addPoints } = useRewardPoints(selectedChild?.id ?? null);

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-8 w-40 rounded bg-slate-800 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-64 rounded-xl bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-semibold text-slate-100 mb-1">Family Hub</h1>
          <p className="text-slate-500 text-sm mb-6">Add children in the Family page first.</p>
        </motion.div>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No children found. Go to <strong>Family</strong> to add your first child.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Family Hub</h1>
        <p className="text-slate-500 text-sm">Checklists, homework, exams and rewards</p>
      </motion.div>

      {/* Bridge components to populate completion badges (only for selected child) */}
      {selectedChild && (
        <ChildCompletionBridge childId={selectedChild.id} onUpdate={updateCompletion} />
      )}

      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        {/* Left: child selector */}
        <Card className="border-slate-700 bg-slate-900/60 h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <ChildSelector
              children={children}
              selectedId={selectedChild?.id ?? null}
              completionMap={completionMap}
              onSelect={setSelectedId}
              onRoleChange={async (id, role) => { await updateChild(id, { role }); }}
            />
          </CardContent>
        </Card>

        {/* Right: selected child dashboard */}
        {selectedChild && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: selectedChild.color?.startsWith("#") ? selectedChild.color : "#38BDF8" }}
              >
                {selectedChild.initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selectedChild.name}</h2>
                {selectedChild.age != null && <p className="text-xs text-slate-500">Age {selectedChild.age}</p>}
              </div>
            </div>

            <Tabs defaultValue="today">
              <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-800/60 p-1">
                <TabsTrigger value="today" className="flex items-center gap-1.5 text-xs">
                  <ClipboardList className="w-3.5 h-3.5" /> Today
                </TabsTrigger>
                <TabsTrigger value="homework" className="flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-3.5 h-3.5" /> Homework
                </TabsTrigger>
                <TabsTrigger value="exams" className="flex items-center gap-1.5 text-xs">
                  <GraduationCap className="w-3.5 h-3.5" /> Exams
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex items-center gap-1.5 text-xs">
                  <Star className="w-3.5 h-3.5" /> Rewards
                </TabsTrigger>
                <TabsTrigger value="money" className="flex items-center gap-1.5 text-xs">
                  <Wallet className="w-3.5 h-3.5" /> Money
                </TabsTrigger>
                <TabsTrigger value="report" className="flex items-center gap-1.5 text-xs">
                  <BarChart3 className="w-3.5 h-3.5" /> Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="mt-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Daily Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DailyChecklist childId={selectedChild.id} onAwardPoints={addPoints} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="homework" className="mt-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Homework</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HomeworkList childId={selectedChild.id} onAwardPoints={addPoints} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exams" className="mt-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Exam Countdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExamCountdown childId={selectedChild.id} onAwardPoints={addPoints} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rewards" className="mt-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RewardSystem childId={selectedChild.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="money" className="mt-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Pocket Money</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PocketMoney childId={selectedChild.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="report" className="mt-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Weekly Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WeeklyReport child={selectedChild} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
