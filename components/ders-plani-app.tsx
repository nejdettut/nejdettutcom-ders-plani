"use client";

import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GRADES = [
  { value: "ilkokul-1", label: "1. Sınıf (İlkokul)" },
  { value: "ilkokul-2", label: "2. Sınıf (İlkokul)" },
  { value: "ilkokul-3", label: "3. Sınıf (İlkokul)" },
  { value: "ilkokul-4", label: "4. Sınıf (İlkokul)" },
  { value: "ortaokul-5", label: "5. Sınıf (Ortaokul)" },
  { value: "ortaokul-6", label: "6. Sınıf (Ortaokul)" },
  { value: "ortaokul-7", label: "7. Sınıf (Ortaokul)" },
  { value: "ortaokul-8", label: "8. Sınıf (Ortaokul)" },
  { value: "lise-9", label: "9. Sınıf (Lise)" },
  { value: "lise-10", label: "10. Sınıf (Lise)" },
  { value: "lise-11", label: "11. Sınıf (Lise)" },
  { value: "lise-12", label: "12. Sınıf (Lise)" },
] as const;

const METHODS = [
  { value: "duz-anlatim", label: "Düz anlatım" },
  { value: "etkinlik-temelli", label: "Etkinlik temelli öğrenme" },
  { value: "proje-temelli", label: "Proje tabanlı öğrenme" },
  { value: "sunus-yoluyla", label: "Sunuş yoluyla öğretim" },
  { value: "bulus-yoluyla", label: "Buluş yoluyla öğretim" },
  { value: "harmanlanmis", label: "Harmanlanmış (karma)" },
] as const;

const DURATIONS = [
  { value: "40", label: "40 dakika (1 ders)" },
  { value: "80", label: "80 dakika (2 ders)" },
  { value: "120", label: "120 dakika (3 ders)" },
] as const;

type Grade = (typeof GRADES)[number]["value"];
type Method = (typeof METHODS)[number]["value"];
type Duration = (typeof DURATIONS)[number]["value"];

type Plan = {
  title: string;
  summary: string;
  objectives: string[];
  keyConcepts: string[];
  materials: string[];
  introduction: { durationMinutes: number; activities: string[] };
  development: {
    durationMinutes: number;
    steps: { stepTitle: string; description: string; durationMinutes: number }[];
  };
  assessment: {
    durationMinutes: number;
    activities: string[];
    sampleQuestions: string[];
  };
  homework: string;
  differentiation: string[];
  curriculumAlignment: string;
};

type PlanResult = {
  plan: Plan;
  meta: {
    subject: string;
    topic: string;
    grade: Grade;
    gradeLabel: string;
    duration: Duration;
    method: Method;
    methodLabel: string;
  };
};

const EXAMPLES: { subject: string; topic: string; grade: Grade; method: Method }[] = [
  { subject: "Matematik", topic: "Kesirlerle toplama ve çıkarma", grade: "ortaokul-5", method: "etkinlik-temelli" },
  { subject: "Fen Bilimleri", topic: "Elektrik devre elemanları", grade: "ortaokul-6", method: "bulus-yoluyla" },
  { subject: "Türkçe", topic: "Özne-yüklem uyumu", grade: "ortaokul-7", method: "duz-anlatim" },
  { subject: "Bilişim Teknolojileri", topic: "Scratch ile ilk oyun", grade: "ortaokul-5", method: "proje-temelli" },
];

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-indigo dark:text-white";

const BTN_OUTLINE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900";

const CARD =
  "rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60";

const MUTED_TEXT = "text-slate-500 dark:text-slate-400";

export function DersPlaniApp() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<Grade>("ortaokul-5");
  const [duration, setDuration] = useState<Duration>("40");
  const [method, setMethod] = useState<Method>("etkinlik-temelli");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);

  async function run() {
    if (subject.trim().length < 2 || topic.trim().length < 3) {
      setError("Ders adı ve konu boş bırakılamaz.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic, grade, duration, method, notes }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error ?? "Bilinmeyen hata.");
      else setResult(data as PlanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ağ hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    if (!result) return;
    setExporting(true);
    setError(null);
    try {
      const r = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!r.ok) {
        setError("Word belgesi üretilemedi.");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = result.meta.topic
        .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ _-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 40) || "ders-plani";
      a.download = `${slug}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İndirme hatası.");
    } finally {
      setExporting(false);
    }
  }

  function applyExample(ex: (typeof EXAMPLES)[number]) {
    setSubject(ex.subject);
    setTopic(ex.topic);
    setGrade(ex.grade);
    setMethod(ex.method);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Input column */}
      <div className="space-y-4 lg:col-span-2">
        <div className={CARD}>
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <BookOpen className="size-4 text-brand-indigo" />
              Ders bilgisi
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Ders
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="örn: Matematik, Fen Bilimleri, Türkçe…"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Konu
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="örn: Kesirlerle toplama ve çıkarma"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Sınıf
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Süre
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as Duration)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Öğretim yöntemi
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Ek notlar (opsiyonel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="örn: Sınıfta akıllı tahta var; 24 öğrenci; 3 destekli öğrenme ihtiyacı var"
                className="block h-20 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={run}
                disabled={loading || subject.length < 2 || topic.length < 3}
                className={BTN_PRIMARY}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Plan üretiliyor…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Planı üret
                  </>
                )}
              </button>
            </div>

            <div>
              <p className={cn("mb-2 text-[11px] uppercase tracking-wider", MUTED_TEXT)}>
                Hızlı örnekler
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyExample(ex)}
                    className="rounded-full border border-slate-300 bg-white/50 px-2.5 py-1 text-[11px] text-slate-700 transition hover:border-brand-indigo hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    {ex.subject} · {ex.topic.slice(0, 20)}…
                  </button>
                ))}
              </div>
            </div>

            <p className={cn("text-[11px]", MUTED_TEXT)}>
              Saatte 15 plan sınırı. MEB müfredatına uygun yapı; kullanmadan önce
              kendi sınıfına göre gözden geçir.
            </p>
          </div>
        </div>
      </div>

      {/* Output column */}
      <div className="space-y-4 lg:col-span-3">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!result && !loading && !error ? (
          <div
            className={cn(
              CARD,
              "flex flex-col items-center gap-3 border-dashed py-14 text-center",
            )}
          >
            <Target className="size-10 text-brand-indigo" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Ders bilgilerini doldur, planı üret
            </h3>
            <p className={cn("max-w-sm text-sm", MUTED_TEXT)}>
              Kazanımlar, materyaller, giriş-gelişme-değerlendirme adımları ve
              örnek sorular bu sütunda belirir. Hazır olduğunda Word (.docx)
              olarak indir.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div
            className={cn(
              CARD,
              "flex flex-col items-center gap-3 py-14 text-center",
            )}
          >
            <Loader2 className="size-10 animate-spin text-brand-indigo" />
            <p className={cn("text-sm", MUTED_TEXT)}>
              Ders planı hazırlanıyor… 15-30 saniye.
            </p>
          </div>
        ) : null}

        {result ? (
          <>
            <div className={cn(CARD, "px-5 py-5")}>
              <p className={cn("text-[11px] font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                {result.meta.subject} · {result.meta.gradeLabel} · {result.meta.duration} dk · {result.meta.methodLabel}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {result.plan.title}
              </h2>
              <p className={cn("mt-2 text-sm leading-relaxed", MUTED_TEXT)}>
                {result.plan.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadDocx}
                  disabled={exporting}
                  className={BTN_PRIMARY}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Word hazırlanıyor…
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      Word (.docx) olarak indir
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={BTN_OUTLINE}
                >
                  <FileText className="size-3.5" />
                  Yazdır / PDF
                </button>
              </div>
            </div>

            <Section title="Öğrenme Kazanımları">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                {result.plan.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Section>

            <Section title="Anahtar Kavramlar">
              <div className="flex flex-wrap gap-1.5">
                {result.plan.keyConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-brand-indigo/40 bg-brand-indigo/10 px-2.5 py-1 text-xs font-medium text-brand-indigo dark:text-brand-indigo"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Materyaller">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                {result.plan.materials.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Section>

            <Section
              title={`Giriş · ${result.plan.introduction.durationMinutes} dk`}
            >
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                {result.plan.introduction.activities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </Section>

            <Section
              title={`Gelişme · ${result.plan.development.durationMinutes} dk`}
            >
              <ol className="space-y-3">
                {result.plan.development.steps.map((s, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {i + 1}. {s.stepTitle}{" "}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({s.durationMinutes} dk)
                      </span>
                    </p>
                    <p className={cn("mt-1 text-xs leading-relaxed", MUTED_TEXT)}>
                      {s.description}
                    </p>
                  </li>
                ))}
              </ol>
            </Section>

            <Section
              title={`Değerlendirme · ${result.plan.assessment.durationMinutes} dk`}
            >
              <div className="space-y-3">
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                  {result.plan.assessment.activities.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-indigo">
                    Örnek sorular
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                    {result.plan.assessment.sampleQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </Section>

            <Section title="Ödev / Ev Çalışması">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {result.plan.homework}
              </p>
            </Section>

            <Section title="Farklılaştırma">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                {result.plan.differentiation.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </Section>

            <Section title="Müfredat Hizalaması">
              <p className={cn("text-sm italic", MUTED_TEXT)}>
                {result.plan.curriculumAlignment}
              </p>
            </Section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn(CARD, "px-5 py-5")}>
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {children}
    </div>
  );
}
