// app/api/student/history/[nim]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ nim: string }> }) {
  try {
    // ✅ AWAIT params first
    const { nim } = await params;

    const student = await prisma.student.findUnique({
      where: { nim },
      include: {
        attendances: {
          include: {
            session: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'NIM tidak ditemukan' }, { status: 404 });
    }

    const history = student.attendances.map((att) => ({
      sessionId: att.sessionId,
      title: att.session.title,
      createdAt: att.createdAt.toISOString(),
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error('[STUDENT_HISTORY_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}