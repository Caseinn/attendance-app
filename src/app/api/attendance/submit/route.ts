// app/api/attendance/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, nim, latitude, longitude, deviceId } = await req.json();

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ✅ Cek apakah sesi sudah kadaluarsa
    if (new Date() > session.expiresAt) {
      return NextResponse.json({ error: 'This session has expired' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { nim } });
    if (!student) {
      return NextResponse.json({ error: 'NIM tidak ditemukan' }, { status: 404 });
    }

    const distance = getDistance(
      latitude,
      longitude,
      session.latitude,
      session.longitude
    );
    if (distance > 50) {
      return NextResponse.json({ error: 'You are too far from the session location' }, { status: 400 });
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        sessionId,
      },
    });

    if (existingAttendance) {
      if (existingAttendance.deviceId !== deviceId) {
        return NextResponse.json({ error: 'Attendance already submitted from a different device' }, { status: 403 });
      }
      return NextResponse.json({ message: 'Already attended' }, { status: 200 });
    }

    await prisma.attendance.create({
      data: {
        studentId: student.id,
        sessionId,
        deviceId,
      },
    });

    return NextResponse.json({ message: 'Attendance submitted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}