const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupRawMaterials() {
  try {
    console.log('🗑️ Deleting existing raw materials...');
    
    // Delete all existing raw materials
    await prisma.rawMaterial.deleteMany({});
    console.log('✅ All existing raw materials deleted');
    
    console.log('📦 Creating new raw material: معجون طماطم...');
    
    // Create new raw material
    const newMaterial = await prisma.rawMaterial.create({
      data: {
        name: 'معجون طماطم',
        availableQuantity: 100,
        unitCost: 15.50,
        unit: 'kg',
        materialType: 'PRODUCTION_MATERIAL',
        minimumStock: 20,
        maximumStock: 500,
        reorderPoint: 30
      }
    });
    
    console.log('✅ Raw material created successfully:', newMaterial);
    
    // Create initial stock movement
    await prisma.stockMovement.create({
      data: {
        materialId: newMaterial.id,
        movementType: 'IN',
        quantity: 100,
        unitCost: 15.50,
        totalCost: 1550.00,
        referenceType: 'INITIAL_STOCK',
        notes: 'رصيد ابتدائي - معجون طماطم',
        createdBy: 'system'
      }
    });
    
    console.log('✅ Initial stock movement created');
    console.log('🎉 Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupRawMaterials();