# تعليمات رفع المشروع إلى GitHub

## المشكلة الحالية
تم إعداد Git محلياً بنجاح، ولكن هناك مشكلة في الاتصال بالمستودع على GitHub.

## الحلول المقترحة

### الحل الأول: التحقق من وجود المستودع
1. تأكد من أن المستودع `ERP_SYSTEM_Ver1.1_Basics` موجود في حسابك على GitHub
2. تأكد من أن اسم المستخدم `MPM4o76` صحيح
3. تأكد من أن المستودع عام (Public) أو أن لديك صلاحيات الوصول

### الحل الثاني: إنشاء المستودع يدوياً
1. اذهب إلى GitHub.com
2. انقر على "+" في الأعلى واختر "New repository"
3. اكتب اسم المستودع: `ERP_SYSTEM_Ver1.1_Basics`
4. اتركه عام (Public)
5. لا تضع علامة على "Initialize with README"
6. انقر "Create repository"

### الحل الثالث: استخدام Personal Access Token
1. اذهب إلى GitHub Settings > Developer settings > Personal access tokens
2. انقر "Generate new token (classic)"
3. اختر الصلاحيات المطلوبة (repo)
4. انسخ الـ token
5. استخدم الأمر التالي:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/MPM4o76/ERP_SYSTEM_Ver1.1_Basics.git
git push -u origin main
```

### الحل الرابع: رفع الملفات يدوياً
1. اذهب إلى المستودع على GitHub
2. انقر "uploading an existing file"
3. اسحب جميع ملفات المشروع (عدا node_modules و .env)
4. اكتب رسالة commit: "Initial commit: ERP System v1.1"
5. انقر "Commit changes"

## الملفات المحضرة محلياً
✅ تم إعداد Git محلياً
✅ تم إضافة جميع الملفات
✅ تم إنشاء أول commit
✅ تم تعيين الفرع الرئيسي إلى main

## الخطوات التالية
1. تحقق من وجود المستودع على GitHub
2. إذا لم يكن موجوداً، أنشئه باستخدام الحل الثاني
3. جرب الدفع مرة أخرى
4. إذا فشل، استخدم Personal Access Token

## أوامر Git الجاهزة للاستخدام
```bash
# للتحقق من حالة Git
git status

# للتحقق من الـ remote
git remote -v

# لتحديث الـ remote URL
git remote set-url origin https://github.com/MPM4o76/ERP_SYSTEM_Ver1.1_Basics.git

# للدفع إلى GitHub
git push -u origin main

# إذا كنت تحتاج لإعادة المحاولة
git push --force-with-lease origin main
```

## ملاحظات مهمة
- تأكد من أن ملف `.env` غير مرفوع (محمي بواسطة .gitignore)
- تأكد من أن مجلد `node_modules` غير مرفوع
- جميع ملفات المشروع جاهزة للرفع
- تم إنشاء دليل شامل للنشر في `GITHUB_DEPLOYMENT_GUIDE.md`