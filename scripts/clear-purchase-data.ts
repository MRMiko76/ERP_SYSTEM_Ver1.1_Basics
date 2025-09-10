import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPurchaseData() {
  try {
    console.log('🗑️ بدء عملية حذف بيانات المشتريات...');
    
    // حذف عناصر أوامر الشراء أولاً (بسبب العلاقات)
    console.log('⏳ حذف عناصر أوامر الشراء...');
    const deletedOrderItems = await prisma.purchaseOrderItem.deleteMany({});
    console.log(`✅ تم حذف ${deletedOrderItems.count} عنصر من أوامر الشراء`);
    
    // حذف حركات المخزون
    console.log('⏳ حذف حركات المخزون...');
    const deletedStockMovements = await prisma.stockMovement.deleteMany({});
    console.log(`✅ تم حذف ${deletedStockMovements.count} حركة مخزون`);
    
    // حذف معاملات الموردين
    console.log('⏳ حذف معاملات الموردين...');
    const deletedSupplierTransactions = await prisma.supplierTransaction.deleteMany({});
    console.log(`✅ تم حذف ${deletedSupplierTransactions.count} معاملة مورد`);
    
    // حذف أوامر الشراء
    console.log('⏳ حذف أوامر الشراء...');
    const deletedPurchaseOrders = await prisma.purchaseOrder.deleteMany({});
    console.log(`✅ تم حذف ${deletedPurchaseOrders.count} أمر شراء`);
    
    // حذف الخامات
    console.log('⏳ حذف الخامات...');
    const deletedRawMaterials = await prisma.rawMaterial.deleteMany({});
    console.log(`✅ تم حذف ${deletedRawMaterials.count} خام`);
    
    // حذف الموردين
    console.log('⏳ حذف الموردين...');
    const deletedSuppliers = await prisma.supplier.deleteMany({});
    console.log(`✅ تم حذف ${deletedSuppliers.count} مورد`);
    
    console.log('🎉 تم حذف جميع بيانات المشتريات بنجاح!');
    console.log('📊 ملخص العملية:');
    console.log(`   - عناصر أوامر الشراء: ${deletedOrderItems.count}`);
    console.log(`   - حركات المخزون: ${deletedStockMovements.count}`);
    console.log(`   - معاملات الموردين: ${deletedSupplierTransactions.count}`);
    console.log(`   - أوامر الشراء: ${deletedPurchaseOrders.count}`);
    console.log(`   - الخامات: ${deletedRawMaterials.count}`);
    console.log(`   - الموردين: ${deletedSuppliers.count}`);
    
  } catch (error) {
    console.error('❌ خطأ في حذف البيانات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
clearPurchaseData()
  .then(() => {
    console.log('✨ انتهت عملية حذف البيانات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشلت عملية حذف البيانات:', error);
    process.exit(1);
  });