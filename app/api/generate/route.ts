import "server-only";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { rateLimit } from "@/lib/rate-limit";
import {
  GRADE_LABELS,
  LessonPlanRequestSchema,
  LessonPlanSchema,
  METHOD_LABELS,
} from "@/lib/plan-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const limited = await rateLimit({
    action: "ders-plani",
    windowMs: 60 * 60 * 1000,
    max: 15,
  });
  if (!limited.ok) {
    return json(
      { error: "Saatte en fazla 15 plan üretebilirsin. Lütfen biraz sonra tekrar dene." },
      429,
    );
  }

  let body;
  try {
    body = LessonPlanRequestSchema.parse(await req.json());
  } catch {
    return json({ error: "Geçersiz istek gövdesi." }, 400);
  }

  const totalMinutes = Number.parseInt(body.duration, 10);
  const system = [
    "Sen Türk Milli Eğitim Bakanlığı müfredatına hakim, deneyimli bir öğretmen ve ders tasarımcısısın.",
    "MEB kazanımlarını ve öğretim yöntemlerini bilirsin; 5E, yapılandırmacı yaklaşım ve etkinlik temelli öğrenmeyi uygularsın.",
    "Verilen konu, sınıf seviyesi, süre ve yöntem için sınıfta hemen uygulanabilir, net bir ders planı hazırla.",
    "Hedefler (öğrenme kazanımları) somut davranışsal fiillerle (açıklar, karşılaştırır, çözer, değerlendirir) yazılsın.",
    "Materyaller gerçekçi olsun (tahta, kart, akıllı tahta, Scratch, Python, laboratuvar malzemesi, video...).",
    "Süre dağılımı giriş + gelişme + değerlendirme toplamı yaklaşık ders süresini (±5 dk) yansıtsın.",
    "Değerlendirme sorularında farklı Bloom seviyeleri olsun (hatırla + anla + uygula + çözümle).",
    "Farklılaştırma bölümünde en az bir yüksek yetenek + en az bir destek öneri ver.",
    "Müfredat hizalaması cümlesi hangi öğrenme alanı/kazanım numarasıyla (varsayıma dayalı) eşleştiğini kısaca açıkla.",
    "Tüm metin sade, resmi Türkçe. Tam cümleler, madde madde değil zorunlu olmadıkça.",
    `Sınıf seviyesi: ${GRADE_LABELS[body.grade]}.`,
    `Toplam ders süresi: ${totalMinutes} dakika.`,
    `Öğretim yöntemi: ${METHOD_LABELS[body.method]}.`,
    body.notes ? `Öğretmenin ek notları: ${body.notes}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const prompt = `Ders: ${body.subject}\nKonu: ${body.topic}\n\nJSON şemasına uygun tam ders planı hazırla.`;

  try {
    const { object } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: LessonPlanSchema,
      system,
      prompt,
      temperature: 0.4,
    });
    return json({
      plan: object,
      meta: {
        subject: body.subject,
        topic: body.topic,
        grade: body.grade,
        gradeLabel: GRADE_LABELS[body.grade],
        duration: body.duration,
        method: body.method,
        methodLabel: METHOD_LABELS[body.method],
      },
    });
  } catch (err) {
    console.error("[ders-plani] failed:", err);
    return json(
      { error: "Plan üretilemedi. Lütfen biraz sonra tekrar dene." },
      502,
    );
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
