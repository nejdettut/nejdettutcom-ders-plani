import { DersPlaniApp } from "@/components/ders-plani-app";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-indigo">
            Yapay Zekâ Projesi
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            <span aria-hidden="true" className="text-3xl">
              📋
            </span>
            AI Ders Planı Üretici
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Konu, sınıf seviyesi, süre ve öğretim yöntemini seç — yapay zekâ
            MEB müfredatına uygun ders planını saniyeler içinde hazırlar.
            Word (.docx) olarak indir.
          </p>
        </div>
        <a
          href="https://www.nejdettut.com/projeler/ai-ders-plani"
          className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          ← nejdettut.com&apos;a dön
        </a>
      </header>

      <DersPlaniApp />

      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Bir{" "}
        <a
          href="https://www.nejdettut.com"
          className="font-medium underline-offset-2 hover:underline"
        >
          nejdettut.com
        </a>{" "}
        yapay zekâ projesi · Groq · Next.js · Eğitim amaçlıdır.
      </footer>
    </main>
  );
}
