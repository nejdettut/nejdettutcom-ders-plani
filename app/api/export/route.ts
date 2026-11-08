import "server-only";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { z } from "zod";
import { LessonPlanSchema } from "@/lib/plan-schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const ExportSchema = z.object({
  plan: LessonPlanSchema,
  meta: z.object({
    subject: z.string(),
    topic: z.string(),
    gradeLabel: z.string(),
    duration: z.string(),
    methodLabel: z.string(),
  }),
});

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

function para(text: string, opts: { bold?: boolean; italics?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text })],
  });
}

function labeled(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

export async function POST(req: Request) {
  let body: z.infer<typeof ExportSchema>;
  try {
    body = ExportSchema.parse(await req.json());
  } catch {
    return new Response("Geçersiz istek gövdesi.", { status: 400 });
  }

  const { plan, meta } = body;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: plan.title, bold: true })],
    }),
  );

  children.push(para(plan.summary, { italics: true }));

  children.push(heading("Ders Bilgileri"));
  children.push(labeled("Ders", meta.subject));
  children.push(labeled("Konu", meta.topic));
  children.push(labeled("Sınıf", meta.gradeLabel));
  children.push(labeled("Süre", `${meta.duration} dakika`));
  children.push(labeled("Yöntem", meta.methodLabel));

  children.push(heading("Öğrenme Kazanımları (Hedefler)"));
  plan.objectives.forEach((o) => children.push(bullet(o)));

  children.push(heading("Anahtar Kavramlar"));
  plan.keyConcepts.forEach((c) => children.push(bullet(c)));

  children.push(heading("Materyaller"));
  plan.materials.forEach((m) => children.push(bullet(m)));

  children.push(
    heading(`Giriş (${plan.introduction.durationMinutes} dakika)`),
  );
  plan.introduction.activities.forEach((a) => children.push(bullet(a)));

  children.push(heading(`Gelişme (${plan.development.durationMinutes} dakika)`));
  plan.development.steps.forEach((step, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: `${i + 1}. ${step.stepTitle} (${step.durationMinutes} dk)`,
            bold: true,
          }),
        ],
      }),
    );
    children.push(para(step.description));
  });

  children.push(heading(`Değerlendirme (${plan.assessment.durationMinutes} dakika)`));
  plan.assessment.activities.forEach((a) => children.push(bullet(a)));
  children.push(para("Örnek sorular:", { bold: true }));
  plan.assessment.sampleQuestions.forEach((q, i) =>
    children.push(bullet(`${i + 1}. ${q}`)),
  );

  children.push(heading("Ödev / Ev Çalışması"));
  children.push(para(plan.homework));

  children.push(heading("Farklılaştırma"));
  plan.differentiation.forEach((d) => children.push(bullet(d)));

  children.push(heading("Müfredat Hizalaması"));
  children.push(para(plan.curriculumAlignment));

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const bytes = new Uint8Array(buffer);
  const asciiTopic = meta.topic
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .toLowerCase() || "ders-plani";

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${asciiTopic}.docx"`,
    },
  });
}
