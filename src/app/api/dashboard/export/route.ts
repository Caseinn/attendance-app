// app/api/dashboard/export/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Get all students WITH their ObjectId
    const students = await prisma.student.findMany({
      select: {
        id: true,   // 👈 ObjectId
        nim: true,
        name: true,
      },
      orderBy: {
        nim: 'asc',
      },
    });

    // 2. Get all sessions
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 3. Get all attendance records
    const attendances = await prisma.attendance.findMany({
      select: {
        studentId: true, // ObjectId
        sessionId: true,
      },
    });

    // 4. Create attendance map: "studentId-sessionId" → true
    const attendanceMap = new Set<string>();
    attendances.forEach(att => {
      attendanceMap.add(`${att.studentId}-${att.sessionId}`);
    });

    // 5. Generate CSV content
    let csv = `"NIM","Nama",${sessions.map(s => `"${s.title}"`).join(',')}\n`;

    for (const student of students) {
      const row = [student.nim, student.name || ''];
      
      for (const session of sessions) {
        // ✅ USE STUDENT OBJECTID, NOT NIM
        const key = `${student.id}-${session.id}`;
        row.push(attendanceMap.has(key) ? 'Hadir' : 'Tidak Hadir');
      }
      
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    }

    // ✅ Add UTF-8 BOM for Excel
    const bom = '\uFEFF';
    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="absensi-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[EXPORT_ATTENDANCE_ERROR]', error);
    return NextResponse.json(
      { error: 'Gagal mengekspor data absensi' },
      { status: 500 }
    );
  }
}