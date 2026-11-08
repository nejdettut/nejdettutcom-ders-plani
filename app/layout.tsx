import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Ders Planı Üretici — nejdettut.com",
  description:
    "Konu + sınıf seviyesi + ders süresi + yöntem seçimiyle MEB müfredatına uygun ders planı üretir ve Word (.docx) olarak dışa aktarır.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
