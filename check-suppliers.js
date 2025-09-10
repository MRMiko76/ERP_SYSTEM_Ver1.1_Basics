const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuppliers() {
  try {
    console.log('🔍 Checking suppliers in database...');
    
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        contactPerson: true,
        phone: true,
        address: true,
        active: true,
        createdAt: true,
      },
    });
    
    console.log(`📊 Found ${suppliers.length} suppliers:`);
    
    if (suppliers.length === 0) {
      console.log('❌ No suppliers found in database');
      
      // Create a test supplier
      console.log('➕ Creating a test supplier...');
      const testSupplier = await prisma.supplier.create({
        data: {
          name: 'شركة الخليج للمواد الخام',
          contactPerson: 'أحمد محمد',
          phone: '+966501234567',
          address: 'الرياض، المملكة العربية السعودية',
          active: true,
        },
      });
      
      console.log('✅ Test supplier created:', testSupplier);
    } else {
      suppliers.forEach((supplier, index) => {
        console.log(`${index + 1}. ${supplier.name} (${supplier.active ? 'نشط' : 'غير نشط'})`);
        console.log(`   الهاتف: ${supplier.phone}`);
        console.log(`   الشخص المسؤول: ${supplier.contactPerson}`);
        console.log(`   العنوان: ${supplier.address}`);
        console.log(`   تاريخ الإنشاء: ${supplier.createdAt}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking suppliers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuppliers();