import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Backfilling RCitemlist.dateRC from Receive.receive_date...');

        const receives = await prisma.receive.findMany({
            where: {
                receive_date: { not: null },
                orderfull: { not: '' },
            },
            select: { company: true, orderfull: true, receive_date: true },
        });

        console.log(`Found ${receives.length} receives with receive_date`);

        let totalUpdated = 0;
        for (const receive of receives) {
            if (!receive.company || !receive.orderfull || !receive.receive_date) continue;

            const result = await prisma.rCitemlist.updateMany({
                where: {
                    company: receive.company,
                    codenames: receive.orderfull,
                    dateRC: null,
                },
                data: { dateRC: receive.receive_date },
            });

            if (result.count > 0) {
                totalUpdated += result.count;
                console.log(`  ${receive.company} / ${receive.orderfull}: updated ${result.count} item(s) -> ${receive.receive_date.toISOString()}`);
            }
        }

        console.log(`Done. Total RCitemlist rows updated: ${totalUpdated}`);

        const remaining = await prisma.rCitemlist.count({ where: { dateRC: null } });
        console.log(`Remaining RCitemlist rows with dateRC = NULL (no matching receive): ${remaining}`);
    } catch (error) {
        console.error('Error backfilling dateRC:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
