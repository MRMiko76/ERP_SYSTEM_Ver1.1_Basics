# تعليمات إعداد Git وحفظ المشروع

## المتطلبات
1. تثبيت Git على النظام من: https://git-scm.com/download/win
2. حساب GitHub موجود بالفعل

## خطوات حفظ المشروع على Git

### الطريقة الأولى: استخدام سطر الأوامر (بعد تثبيت Git)

#### 1. تهيئة مستودع Git محلي
```bash
git init
git add .
git commit -m "feat: Implement hierarchical permissions system"
```

#### 2. ربط المستودع بـ GitHub الموجود
```bash
git remote add origin https://github.com/MRMiko76/ERP_SYSTEM_Ver1.1_Basics.git
git branch -M main
git push -u origin main --force
```

### الطريقة الثانية: استخدام GitHub Desktop (الأسهل)

1. **تحميل GitHub Desktop**: https://desktop.github.com/
2. **تسجيل الدخول** بحساب GitHub الخاص بك
3. **Clone المستودع الموجود**:
   - انقر على "Clone a repository from the Internet"
   - أدخل الرابط: `https://github.com/MRMiko76/ERP_SYSTEM_Ver1.1_Basics`
   - اختر مجلد مؤقت للنسخ
4. **نسخ الملفات الجديدة**:
   - انسخ جميع ملفات المشروع الحالي
   - الصقها في مجلد المستودع المنسوخ
5. **رفع التحديثات**:
   - افتح GitHub Desktop
   - ستظهر التغييرات تلقائياً
   - اكتب رسالة commit: "feat: Implement hierarchical permissions system"
   - انقر "Commit to main"
   - انقر "Push origin"

## ملاحظات مهمة
- **الطريقة الثانية (GitHub Desktop) هي الأسهل** إذا لم يكن Git مثبت
- تأكد من تثبيت Git قبل استخدام الطريقة الأولى
- المستودع موجود بالفعل على: https://github.com/MRMiko76/ERP_SYSTEM_Ver1.1_Basics
- استخدم `--force` فقط إذا كنت متأكداً من الكتابة فوق المحتوى الموجود

## في حالة وجود مشاكل
إذا واجهت مشاكل مع Git، يمكنك:
1. استخدام GitHub Desktop (الأسهل)
2. رفع الملفات يدوياً عبر واجهة GitHub الويب
3. استخدام Visual Studio Code مع Git extension

## التحسينات المضافة في هذه النسخة
✅ نظام الصلاحيات الهرمي الجديد
✅ واجهة مستخدم محسنة للأدوار
✅ مؤشرات بصرية لحالة الصلاحيات
✅ التوافق العكسي مع النظام القديم
✅ إصلاح الأخطاء البرمجية

## الملفات المحدثة
- `src/types/roles-permissions.ts` - تعريفات الأنواع الجديدة
- `src/components/erp/roles/role-form.tsx` - واجهة النموذج المحدثة