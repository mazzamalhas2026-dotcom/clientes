import { NextResponse } from 'next/server';
import { decrypt } from '@/features/auth/utils/session';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        nome: session.nome,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
