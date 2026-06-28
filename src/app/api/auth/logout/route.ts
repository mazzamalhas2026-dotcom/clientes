import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Excluir o cookie definindo uma data passada
  response.cookies.set({
    name: 'session',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
