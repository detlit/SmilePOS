import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Reset StockTransaction sequence to fix unique constraint error
export async function GET() {
    try {
        // 1. Get the current state and detect the correct sequence name
        const diagnostics: any[] = await prisma.$queryRaw`
            SELECT 
                pg_get_serial_sequence('"StockTransaction"', 'id') as seq_name,
                (SELECT MAX(id) FROM "StockTransaction") as max_id,
                COALESCE(currval(pg_get_serial_sequence('"StockTransaction"', 'id')), 0) as current_seq_val
            FROM (SELECT 1) as dummy;
        `;

        const seqName = diagnostics[0].seq_name;
        const maxId = diagnostics[0].max_id || 0;

        if (!seqName) {
            throw new Error("Could not find internal sequence for StockTransaction.id");
        }

        // 2. Reset the sequence to max id + 1
        await prisma.$executeRawUnsafe(`SELECT setval('${seqName}', ${maxId}, true)`);

        // 3. Verify the new state
        const verify: any[] = await prisma.$queryRawUnsafe(`SELECT nextval('${seqName}') as next_id, currval('${seqName}') as current_id`);

        return NextResponse.json({
            success: true,
            message: "Sequence reset successfully",
            diagnostics: diagnostics[0],
            verification: verify[0]
        });
    } catch (error: any) {
        console.error("Error resetting sequence:", error);
        return NextResponse.json(
            {
                error: error.message || "Failed to reset sequence",
                stack: error.stack,
                hint: "Ensure you are using PostgreSQL and the table exists."
            },
            { status: 500 }
        );
    }
}
