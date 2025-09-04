# قائمة مرجعية سريعة لرفع المشروع إلى GitHub

## ✅ قبل البدء
- [ ] تأكد من أن المشروع يعمل محلياً (`npm run dev`)
- [ ] تأكد من نجاح البناء (`npm run build`)
- [ ] إنشاء ملف `.env.example`
- [ ] مراجعة ملف `.gitignore`

## ✅ إنشاء Repository على GitHub
- [ ] اذهب إلى GitHub.com
- [ ] اضغط زر **"New"** الأخضر
- [ ] اسم Repository: `ERP-SYS-VER1.1-BASICS`
- [ ] اختر Public/Private
- [ ] **لا تضع علامة** على أي خيارات إضافية
- [ ] اضغط **"Create repository"**
- [ ] انسخ رابط Repository

## ✅ ربط المشروع بـ GitHub
```bash
# في Terminal
cd "C:\Users\Engmi\OneDrive\Documents\Apps\Trae_Projects\ERP-SYS-VER1.1-BAISCS"
git init
git add .
git commit -m "Initial commit: ERP System v1.1"
git branch -M main
git remote add origin [ضع الرابط هنا]
git push -u origin main
```

## ✅ إعداد GitHub Pages (اختياري)
- [ ] اذهب إلى **Settings** في Repository
- [ ] اضغط **"Pages"** في القائمة الجانبية
- [ ] اختر **"GitHub Actions"** في Source
- [ ] احفظ الإعدادات

## ✅ للمطورين الجدد
```bash
git clone [رابط Repository]
cd ERP-SYS-VER1.1-BASICS
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

## ✅ للتحديثات المستقبلية
```bash
git add .
git commit -m "وصف التحديث"
git push origin main
```

## 🚨 تذكيرات مهمة
- **لا ترفع ملف .env** أبداً
- **اختبر محلياً** قبل الرفع
- **استخدم commit messages واضحة**
- **راجع Actions** للتأكد من نجاح النشر

## 📞 في حالة المشاكل
1. تحقق من `npm run build` محلياً
2. راجع تبويب **Actions** في GitHub
3. تأكد من إعدادات GitHub Pages
4. انتظر 5-10 دقائق بعد النشر