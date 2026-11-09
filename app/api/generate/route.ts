import "server-only";
import { generateText } from "ai";
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

  // generateObject + Groq gpt-oss-120b karmaşık şemada başarısız oluyordu;
  // generateText + örnek JSON şablonu + 2 retry pattern'ına geçildi
  // (cv-kocu ve ana sitedeki slayt fix'inin aynısı).
  const prompt = `Ders: ${body.subject}\nKonu: ${body.topic}\n\nAşağıdaki JSON örneğiyle BİREBİR aynı alan adlarını kullanan tek bir JSON döndür. Başka hiçbir şey ekleme (açıklama, markdown, kod bloğu yok). Değerleri gerçek ders planıyla doldur.\n\nÖrnek şablon:\n${PLAN_EXAMPLE}\n\nSadece JSON döndür.`;

  async function attempt() {
    try {
      const { text } = await generateText({
        model: groq("openai/gpt-oss-120b"),
        system,
        prompt,
        temperature: 0.35,
        maxOutputTokens: 4000,
      });
      const jsonText = extractJson(text);
      if (!jsonText) return null;
      return JSON.parse(jsonText);
    } catch (err) {
      console.error("[ders-plani] attempt failed:", err);
      return null;
    }
  }

  for (let i = 0; i < 2; i++) {
    const parsed = await attempt();
    if (!parsed) continue;
    const result = LessonPlanSchema.safeParse(parsed);
    if (result.success) {
      return json({
        plan: result.data,
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
    }
    console.error("[ders-plani] schema mismatch attempt", i + 1, result.error.issues.slice(0, 3));
  }
  return json(
    { error: "Plan üretilemedi. Lütfen biraz sonra tekrar dene." },
    502,
  );
}

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

const PLAN_EXAMPLE = `{
  "title": "Toplama İşlemi Ders Planı",
  "summary": "İlkokul 3. sınıf öğrencilerine iki basamaklı sayılarda toplama işlemini etkinlik temelli yöntemle öğretmek.",
  "objectives": [
    "İki basamaklı doğal sayıları onluk ve birlik olarak ayırt eder",
    "İki basamaklı sayıları eldesiz olarak toplar",
    "Toplama işlemini günlük yaşam problemlerinde kullanır"
  ],
  "keyConcepts": ["toplama", "onluk", "birlik", "elde"],
  "materials": ["tahta", "renkli tebeşir/kalem", "sayma pulları", "çalışma kağıdı", "görsel kartlar"],
  "introduction": {
    "minutes": 8,
    "steps": [
      "Önceki dersin kısa tekrarı: tek basamaklı toplama örnekleri",
      "Günlük yaşamdan bir toplama problemi sorulur (ör. 'Markette 23 elma vardı, 14 elma daha geldi. Kaç elma oldu?')"
    ]
  },
  "development": {
    "minutes": 24,
    "steps": [
      "Onluk ve birlik kavramı tahtada görselle açıklanır",
      "Sayma pullarıyla 23 + 14 somut olarak yapılır",
      "Birkaç örnek birlikte tahtada çözülür",
      "Öğrenciler eşli çalışmada 3 soru çözer, öğretmen gezer"
    ]
  },
  "assessment": {
    "minutes": 8,
    "steps": [
      "Çalışma kağıdından 5 soru bireysel olarak çözülür",
      "Kısa sözel soru-cevap ile pekiştirme"
    ],
    "sampleQuestions": [
      { "question": "34 + 25 işleminin sonucu kaçtır?", "bloom": "uygula" },
      { "question": "Toplama işleminde 'elde' nedir, açıklar mısın?", "bloom": "anla" }
    ]
  },
  "homework": "5 adet eldesiz iki basamaklı toplama sorusu ve bir günlük yaşam problemi.",
  "differentiation": {
    "support": "Daha yavaş öğrenen öğrenciler için sayma pulu kullanmaya devam edilir; soru sayısı 3'e indirilir.",
    "extension": "Hızlı bitirenler için eldeli toplama soruları ve küçük problem çözme görevi verilir."
  },
  "curriculumAlignment": "MEB İlkokul 3. Sınıf Matematik Dersi Öğretim Programı, Sayılar ve İşlemler alanı, M.3.1.2.1 kazanımı."
}`;
