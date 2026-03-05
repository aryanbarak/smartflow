import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { runTutorRequest, isTutorApiConfigured } from "@/lib/tutor/runner";

type WisoTab = "wissensbasis" | "trainingsfragen" | "pruefungssimulation";

const WISSENSBASIS_FALLBACK = [
  "AR-A Rechtsquellen / Hierarchie / Guenstigkeitsprinzip",
  "AR-B Arbeitsvertrag / Formfreiheit / Nachweisgesetz",
  "AR-C Rechte und Pflichten (AN/AG)",
  "AR-D Probezeit",
  "AR-E Befristung",
  "AR-F Arbeitszeitgesetz",
  "AR-G Urlaub",
  "AR-H Krankheit",
  "AR-I Kuendigung",
  "AR-J Kuendigungsschutz (KSchG)",
  "AR-K Abmahnung",
  "AR-L Sonderkuendigungsschutz",
  "AR-M Betriebsrat Basics",
  "AR-N Datenschutz im Arbeitsverhaeltnis",
];

const TRAININGS_FALLBACK = [
  "Fallfrage: Welche Aussage zur Ruhezeit ist richtig?",
  "Fallfrage: Welche Form ist fuer eine ordentliche Kuendigung erforderlich?",
  "Fallfrage: Wann greift Entgeltfortzahlung bei Krankheit?",
];

const PRUEFUNG_FALLBACK = {
  name: "WISO Pruefungssimulation",
  stats: "Fragen: 10 | Punkte: 10 | Zeit: 60 Minuten",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function TutorWisoPage() {
  const [tab, setTab] = useState<WisoTab>("wissensbasis");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<string>("Wissensbasis, Trainingsfragen und Pruefungssimulation fuer WISO AP2.");
  const [overview, setOverview] = useState<string[]>(WISSENSBASIS_FALLBACK);
  const [traps, setTraps] = useState<string[]>([]);

  const configured = isTutorApiConfigured();

  const loadBundle = async () => {
    if (!configured) {
      setError("Tutor API not configured. Set VITE_TUTOR_API_URL.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const execution = await runTutorRequest({
        topic: "wiso",
        mode: "trace",
        lang: "de",
        params: { section: "bundle", topic: "arbeitsrecht" },
      });

      const result = execution.result;
      if (!isRecord(result)) return;

      if (typeof result.summary === "string" && result.summary.trim()) {
        setSummary(result.summary.trim());
      }

      const blocks = Array.isArray(result.blocks) ? result.blocks : [];
      const overviewBlock = blocks.find((b) => isRecord(b) && b.kind === "overview");
      const trapsBlock = blocks.find((b) => isRecord(b) && b.kind === "typische_pruefungsfallen");

      if (isRecord(overviewBlock) && typeof overviewBlock.text === "string") {
        const lines = overviewBlock.text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !line.toLowerCase().startsWith("arbeitsrecht"));
        if (lines.length > 0) setOverview(lines);
      }

      if (isRecord(trapsBlock) && typeof trapsBlock.text === "string") {
        const lines = trapsBlock.text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "));
        setTraps(lines);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const content = useMemo(() => {
    if (tab === "wissensbasis") {
      return (
        <div className="space-y-2 rounded-md border p-4">
          <h3 className="text-2xl font-semibold">arbeitsrecht</h3>
          {overview.map((item) => (
            <div key={item} className="text-lg text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      );
    }
    if (tab === "trainingsfragen") {
      return (
        <div className="space-y-3 rounded-md border p-4">
          {TRAININGS_FALLBACK.map((q) => (
            <div key={q} className="text-lg">
              • {q}
            </div>
          ))}
          {traps.length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <div className="font-medium mb-2">Typische Pruefungsfallen</div>
              {traps.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="space-y-4 rounded-md border p-4">
        <div className="text-3xl font-semibold">Pruefungssimulation</div>
        <div className="text-xl">Name: {PRUEFUNG_FALLBACK.name}</div>
        <div className="text-xl">{PRUEFUNG_FALLBACK.stats}</div>
      </div>
    );
  }, [tab, overview, traps]);

  return (
    <div className="p-4 lg:p-6 max-w-[1500px] mx-auto space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-950/60 px-3 py-2">
        <Link to="/tutor/app" className="rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm font-medium hover:bg-slate-800">
          Tutor
        </Link>
        <Link to="/tutor" className="rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm font-medium hover:bg-slate-800">
          Exam Bank (AP2)
        </Link>
        <Link to="/tutor/wiso" className="rounded border border-slate-400 bg-slate-900 px-3 py-1.5 text-sm font-medium">
          WISO
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-semibold text-emerald-300">WISO AP2 - Bundle</h1>
        <Button variant="outline" onClick={() => void loadBundle()} disabled={loading}>
          {loading ? "Loading..." : "Reload"}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "wissensbasis" ? "secondary" : "outline"} onClick={() => setTab("wissensbasis")}>
          Wissensbasis
        </Button>
        <Button variant={tab === "trainingsfragen" ? "secondary" : "outline"} onClick={() => setTab("trainingsfragen")}>
          Trainingsfragen
        </Button>
        <Button variant={tab === "pruefungssimulation" ? "secondary" : "outline"} onClick={() => setTab("pruefungssimulation")}>
          Pruefungssimulation
        </Button>
      </div>

      <div className="rounded-md border p-3 text-lg text-muted-foreground">{summary}</div>

      {error && <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

      {content}
    </div>
  );
}
