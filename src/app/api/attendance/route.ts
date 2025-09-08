// app/api/attendance/bulk-toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, nims, action } = await req.json();

    if (!sessionId || !nims || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(nims) || nims.length === 0) {
      return NextResponse.json({ error: 'Invalid NIMs array' }, { status: 400 });
    }

    if (action === 'mark') {
      const results = [];
      for (const nim of nims) {
        // Find student by NIM to get their ObjectId
        const student = await prisma.student.findUnique({
          where: { nim },
          select: { id: true },
        });

        if (!student) {
          console.warn(`Student with NIM ${nim} not found`);
          continue;
        }

        // Check if already marked
        const existing = await prisma.attendance.findFirst({
          where: { sessionId, studentId: student.id },
        });

        if (existing) continue;

        const attendance = await prisma.attendance.create({
          data: {
            session: { connect: { id: sessionId } },
            student: { connect: { id: student.id } }, // 👈 Use ObjectId, not NIM
            deviceId: 'manual-bulk',
            manualOverride: true,
          },
          include: {
            student: { select: { name: true } },
          },
        });

        results.push({
          nim: attendance.studentId, // This is ObjectId, you may want to return NIM instead
          name: attendance.student.name,
          createdAt: attendance.createdAt,
        });
      }

      return NextResponse.json({
        success: true,
        created: results.length,
        results,
      }, { status: 201 });
    }

    if (action === 'unmark') {
      // 👇 STEP 1: Find student ObjectIds by NIMs
      const students = await prisma.student.findMany({
        where: { nim: { in: nims } },
        select: { id: true },
      });

      const studentIds = students.map(s => s.id);

      if (studentIds.length === 0) {
        return NextResponse.json({ 
          success: true, 
          deleted: 0,
          message: 'No matching students found'
        }, { status: 200 });
      }

      // 👇 STEP 2: Delete attendance using ObjectId studentIds
      const deleteResult = await prisma.attendance.deleteMany({
        where: {
          sessionId,
          studentId: { in: studentIds }, // 👈 Use ObjectId, not NIM
        },
      });

      return NextResponse.json({
        success: true,
        deleted: deleteResult.count,
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[BULK_TOGGLE_ATTENDANCE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}