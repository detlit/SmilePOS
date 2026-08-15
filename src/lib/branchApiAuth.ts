import { prisma } from "@/lib/prisma";

type BranchApiUser = {
    id: number;
    company: string | null;
    email: string | null;
    tunnelUrl?: string | null;
};

type BranchApiAuthResult = {
    user: BranchApiUser;
    matchedBy: "user" | "connection";
};

export async function verifyBranchApiToken(companyId: number | string, apiToken: string): Promise<BranchApiAuthResult | null> {
    const parsedCompanyId = Number(companyId);
    const token = (apiToken || "").trim();

    if (!Number.isInteger(parsedCompanyId) || parsedCompanyId <= 0 || !token) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: parsedCompanyId },
        select: {
            id: true,
            company: true,
            email: true,
            tunnelUrl: true,
            apiToken: true,
        }
    });

    if (!user) {
        return null;
    }

    const authUser = {
        id: user.id,
        company: user.company,
        email: user.email,
        tunnelUrl: user.tunnelUrl,
    };

    if (user.apiToken && user.apiToken === token) {
        return { user: authUser, matchedBy: "user" };
    }

    const connection = await prisma.branchConnection.findFirst({
        where: {
            fromUserId: parsedCompanyId,
            apiToken: token,
            status: "accepted",
        },
        select: { id: true }
    });

    if (!connection) {
        return null;
    }

    return { user: authUser, matchedBy: "connection" };
}