import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { title, latitude, longitude } = await req.json();

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 jam

    const session = await prisma.session.create({
      data: {
        title,
        latitude,
        longitude,
        expiresAt,
      },
    });

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}