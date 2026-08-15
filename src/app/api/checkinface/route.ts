import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, faceDescriptor } = body;
        const employeeIdNumber = Number(employeeId);

        if (!Number.isInteger(employeeIdNumber) || employeeIdNumber <= 0) {
            return NextResponse.json(
                { code: 'INVALID_EMPLOYEE_ID', error: 'employeeId is invalid' },
                { status: 400 }
            );
        }

        if (typeof faceDescriptor !== 'string' || faceDescriptor.trim() === '') {
            return NextResponse.json(
                { code: 'INVALID_FACE_DESCRIPTOR', error: 'faceDescriptor is required' },
                { status: 400 }
            );
        }

        let descriptor: unknown;
        try {
            descriptor = JSON.parse(faceDescriptor);
        } catch {
            return NextResponse.json(
                { code: 'INVALID_FACE_DESCRIPTOR', error: 'faceDescriptor must be a JSON array' },
                { status: 400 }
            );
        }

        if (!Array.isArray(descriptor) || descriptor.length < 16 || descriptor.some(value => typeof value !== 'number')) {
            return NextResponse.json(
                { code: 'INVALID_FACE_DESCRIPTOR', error: 'faceDescriptor is incomplete' },
                { status: 400 }
            );
        }

        const employee = await prisma.settingEmployee.findUnique({
            where: { id: employeeIdNumber },
            select: { id: true },
        });

        if (!employee) {
            return NextResponse.json(
                { code: 'EMPLOYEE_NOT_FOUND', error: 'Employee not found' },
                { status: 404 }
            );
        }

        const result = await prisma.checkinFace.upsert({
            where: { employeeId: employeeIdNumber },
            update: {
                faceDescriptor: faceDescriptor,
            },
            create: {
                employeeId: employeeIdNumber,
                faceDescriptor: faceDescriptor,
            },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Error saving face registration:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
