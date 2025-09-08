import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Await params first
    const { id: sessionId } = await params;

    // Fetch attendance for this session
    const attendances = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    });

    // Map to your desired response format
    const result = attendances.map(att => ({
      nim: att.studentId,
      name: att.student?.name || 'Unknown',
      createdAt: att.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SESSION_ATTENDANCE_ERROR]', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data absensi' },
      { status: 500 }
    );
  }
}