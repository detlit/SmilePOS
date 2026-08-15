
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fixing StockTransaction sequence...');

        // Calculate the correct next ID based on the current max ID
        const result: any[] = await prisma.$queryRaw`SELECT MAX(id) as max_id FROM "StockTransaction"`;
        const maxId = result[0]?.max_id || 0;
        const nextId = Number(maxId) + 1;

        console.log(`Current max ID: ${maxId}, setting sequence to start from: ${nextId}`);

        // Update the sequence
        // This SQL command is standard for PostgreSQL to update the sequence associated with a SERIAL/IDENTITY column
        await prisma.$queryRaw`SELECT setval(pg_get_serial_sequence('"StockTransaction"', 'id'), ${nextId}, false)`;

        console.log('Sequence updated successfully.');
    } catch (error) {
        console.error('Error updating sequence:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
