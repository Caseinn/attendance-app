// app/api/student/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      select: {
        nim: true,
        name: true,
      },
      orderBy: {
        nim: 'asc',
      },
    });

    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('[STUDENT_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data mahasiswa' },
      { status: 500 }
    );
  }
}