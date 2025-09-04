# دليل رفع المشروع إلى GitHub وتشغيله

## الخطوة الأولى: إعداد المشروع محلياً

### 1. التأكد من أن المشروع يعمل محلياً
```bash
# في مجلد المشروع
npm install
npm run build
npm run dev
```

### 2. إنشاء ملف .gitignore (إذا لم يكن موجوداً)
```
node_modules/
.next/
.env
.env.local
.env.production
.env.development
dist/
build/
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.swo
```

### 3. إنشاء ملف .env.example
```
DATABASE_URL="file:./prisma/db/custom.db"
JWT_SECRET="your-jwt-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## الخطوة الثانية: إنشاء Repository على GitHub

### 1. الذهاب إلى GitHub.com
- اضغط على زر **"New"** (أخضر) في الصفحة الرئيسية
- أو اضغط على **"+"** في الشريط العلوي واختر **"New repository"

### 2. إعداد Repository
- **Repository name**: `ERP-SYS-VER1.1-BASICS`
- **Description**: `نظام إدارة موارد المؤسسة - الإصدار 1.1`
- اختر **Public** أو **Private** حسب الحاجة
- **لا تضع علامة** على:
  - Add a README file
  - Add .gitignore
  - Choose a license
- اضغط **"Create repository"**

### 3. نسخ رابط Repository
- بعد إنشاء Repository، انسخ الرابط من الصفحة
- مثال: `https://github.com/username/ERP-SYS-VER1.1-BASICS.git`

## الخطوة الثالثة: ربط المشروع بـ GitHub

### 1. فتح Terminal في مجلد المشروع
```bash
# التأكد من أنك في مجلد المشروع الصحيح
cd "C:\Users\Engmi\OneDrive\Documents\Apps\Trae_Projects\ERP-SYS-VER1.1-BAISCS"
```

### 2. تهيئة Git Repository
```bash
# تهيئة git إذا لم يكن مهيأ
git init

# إضافة جميع الملفات
git add .

# إنشاء أول commit
git commit -m "Initial commit: ERP System v1.1"

# تغيير اسم الفرع الرئيسي إلى main
git branch -M main

# ربط Repository المحلي بـ GitHub
git remote add origin [ضع هنا رابط Repository الذي نسخته]

# رفع الملفات إلى GitHub
git push -u origin main
```

## الخطوة الرابعة: إعداد GitHub Actions للنشر التلقائي

### 1. إنشاء مجلد .github/workflows
```bash
mkdir .github
mkdir .github\workflows
```

### 2. إنشاء ملف deploy.yml
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Setup Prisma
      run: |
        npx prisma generate
        npx prisma db push
        
    - name: Build application
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./out
```

### 3. تعديل next.config.ts للنشر الثابت
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ERP-SYS-VER1.1-BASICS' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/ERP-SYS-VER1.1-BASICS' : '',
};

export default nextConfig;
```

## الخطوة الخامسة: إعداد GitHub Pages

### 1. الذهاب إلى إعدادات Repository
- في صفحة Repository على GitHub
- اضغط على تبويب **"Settings"**

### 2. تفعيل GitHub Pages
- في القائمة الجانبية، اضغط على **"Pages"**
- في قسم **"Source"**، اختر **"GitHub Actions"**
- احفظ الإعدادات

## الخطوة السادسة: رفع التحديثات

### 1. إضافة الملفات الجديدة
```bash
git add .
git commit -m "Add GitHub Actions and Pages configuration"
git push origin main
```

### 2. مراقبة عملية النشر
- اذهب إلى تبويب **"Actions"** في Repository
- ستجد عملية النشر قيد التشغيل
- انتظر حتى تكتمل (علامة خضراء ✅)

## الخطوة السابعة: الوصول للموقع

### 1. الحصول على رابط الموقع
- اذهب إلى **Settings** > **Pages**
- ستجد الرابط في الأعلى:
  `https://username.github.io/ERP-SYS-VER1.1-BASICS`

### 2. اختبار الموقع
- افتح الرابط في المتصفح
- تأكد من أن جميع الصفحات تعمل

## ملاحظات مهمة

### 🔴 تحذيرات
1. **لا ترفع ملف .env** - يحتوي على معلومات حساسة
2. **تأكد من .gitignore** - لتجنب رفع ملفات غير مرغوبة
3. **اختبر محلياً أولاً** - قبل الرفع إلى GitHub

### 📝 نصائح
1. **استخدم commit messages واضحة** باللغة الإنجليزية
2. **ارفع التحديثات بانتظام** لتجنب فقدان العمل
3. **راجع Actions** للتأكد من نجاح النشر

### 🔧 حل المشاكل الشائعة

#### مشكلة: Build فشل
```bash
# تحقق من الأخطاء محلياً
npm run build
# إصلح الأخطاء ثم ارفع مرة أخرى
```

#### مشكلة: الموقع لا يظهر
- تأكد من تفعيل GitHub Pages
- انتظر 5-10 دقائق بعد النشر
- تحقق من Actions للأخطاء

#### مشكلة: قاعدة البيانات
```bash
# إعادة إنشاء قاعدة البيانات
npx prisma db push --force-reset
npx prisma db seed
```

## أوامر Git المفيدة

```bash
# حالة الملفات
git status

# إضافة ملفات محددة
git add filename.txt

# إضافة جميع الملفات
git add .

# إنشاء commit
git commit -m "وصف التغيير"

# رفع إلى GitHub
git push origin main

# سحب آخر التحديثات
git pull origin main

# عرض تاريخ الـ commits
git log --oneline
```

## الخطوات النهائية للتشغيل

### 1. للمطورين الجدد
```bash
# استنساخ المشروع
git clone [رابط Repository]
cd ERP-SYS-VER1.1-BASICS

# تثبيت المكتبات
npm install

# إعداد قاعدة البيانات
cp .env.example .env
npx prisma generate
npx prisma db push
npx prisma db seed

# تشغيل المشروع
npm run dev
```

### 2. للتحديثات المستقبلية
```bash
# سحب آخر التحديثات
git pull origin main

# تحديث المكتبات إذا لزم الأمر
npm install

# تحديث قاعدة البيانات إذا لزم الأمر
npx prisma db push

# تشغيل المشروع
npm run dev
```

---

**تم إنشاء هذا الدليل في:** `[التاريخ الحالي]`
**إصدار المشروع:** `1.1`
**حالة المشروع:** `جاهز للنشر`