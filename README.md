# Ish Nazorati

Ishchilar, davomat va avanslarni boshqarish ilovasi. Supabase orqali ma'lumotlar barcha qurilmalar o'rtasida umumiy saqlanadi.

## Joylash (deploy) — GitHub + Vercel orqali

### 1-qadam: GitHub'ga yuklash
1. github.com'da yangi (bo'sh) repository yarating, masalan `ish-nazorati`
2. Shu loyiha papkasini o'sha repository'ga yuklang (GitHub Desktop yoki veb interfeys orqali fayllarni sudrab tashlash mumkin)

### 2-qadam: Vercel'ga ulash
1. vercel.com'ga o'ting, GitHub akkauntingiz bilan kiring
2. "Add New Project" tugmasini bosing
3. `ish-nazorati` repository'ni tanlang
4. Framework sifatida **Vite** avtomatik aniqlanadi — hech narsani o'zgartirmasdan **"Deploy"** tugmasini bosing
5. Bir necha daqiqadan so'ng sizga doimiy havola beriladi: `ish-nazorati.vercel.app`

### 3-qadam: Telefonga o'rnatish
Har qanday telefon yoki noutbukdan shu havolani ochib:
- **Android/Chrome:** brauzer menyusidan "Bosh ekranga qo'shish" / "Ilovani o'rnatish"
- **iPhone/Safari:** Share tugmasi → "Add to Home Screen"

Shundan so'ng ilova telefon ekranida oddiy ilova kabi ochiladi.

## Muhim eslatma
`src/lib/supabase.js` faylidagi URL va kalit — bu ochiq (publishable) kalit, xavfsiz. Lekin ilovaning login-parol tizimi ilova ichida ishlaydi, shuning uchun havolani faqat ishonchli odamlarga bering.
