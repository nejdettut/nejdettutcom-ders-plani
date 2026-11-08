# AI Ders Planı Üretici — nejdettut.com

Öğretmenler için ders planı üretim asistanı.

- **Girdi:** ders adı + konu + sınıf (1-12) + süre (40/80/120 dk) + öğretim
  yöntemi (6 seçenek) + opsiyonel öğretmen notları
- **Çıktı:** Başlık, özet, 3-8 kazanım, 3-10 anahtar kavram, 2-10 materyal,
  giriş + gelişme + değerlendirme (süre dağılımlı), ödev, farklılaştırma,
  müfredat hizalaması
- **Dışa aktarma:** Word (.docx) + tarayıcıda yazdır/PDF
- **Model:** Groq `openai/gpt-oss-120b` (tek `generateObject` çağrısı)
- **Güvenlik:** `GROQ_API_KEY` sadece sunucu tarafında; saatte 15 plan/IP

Bu uygulama [nejdettut.com](https://www.nejdettut.com) yapay zekâ projeleri
koleksiyonunun bir parçasıdır. Üretilen plan bir başlangıç taslağıdır;
öğretmen kendi sınıfına uyarlamalıdır.

## Geliştirme

```bash
npm install
cp .env.example .env.local   # GROQ_API_KEY ekleyin
npm run dev
```
