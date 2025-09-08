// app/api/session/list/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
      // Remove expiresAt filter to show ALL sessions (for testing)
      // where: {
      //   expiresAt: {
      //     gte: new Date(),
      //   },
      // },
    });

    // ✅ Always return array — even if empty
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('[SESSION_LIST_ERROR]', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar sesi' },
      { status: 500 }
    );
  }
}