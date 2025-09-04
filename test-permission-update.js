// اختبار تحديث الصلاحيات
const axios = require('axios');

// بيانات اختبار لتحديث دور
const testRoleUpdate = {
  name: "مشرف عام",
  description: "صلاحيات إشرافية - إدارة وعرض التقارير",
  active: true,
  permissions: [
    {
      module: "users",
      actions: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        duplicate: false,
        approve: false,
        print: false
      }
    },
    {
      module: "roles",
      actions: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        duplicate: false,
        approve: false,
        print: false
      }
    },
    {
      module: "reports",
      actions: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        duplicate: false,
        approve: false,
        print: true
      }
    },
    {
      module: "dashboard",
      actions: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        duplicate: false,
        approve: false,
        print: false
      }
    }
  ]
};

async function testPermissionUpdate() {
  try {
    console.log('🧪 بدء اختبار تحديث الصلاحيات...');
    console.log('🧪 البيانات المرسلة:', JSON.stringify(testRoleUpdate, null, 2));
    
    // استبدل بـ ID دور موجود
    const roleId = 'cmf1yrbmr0000cols44dcvnnc'; // يجب تغييره لـ ID صحيح
    
    const response = await axios.put(`http://localhost:3001/api/roles/${roleId}`, testRoleUpdate, {
      headers: {
        'Content-Type': 'application/json',
        // إضافة الكوكيز إذا لزم الأمر
      }
    });
    
    console.log('✅ نجح التحديث!');
    console.log('📤 الاستجابة:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ فشل التحديث:', error.response?.data || error.message);
  }
}

// تشغيل الاختبار
// testPermissionUpdate();

console.log('📝 ملف الاختبار جاهز. قم بتشغيل testPermissionUpdate() لاختبار التحديث.');
console.log('⚠️  تأكد من تحديث roleId بقيمة صحيحة قبل التشغيل.');