import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/features/auth/utils/session';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validar campos de login
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, senha } = result.data;

    // 2. Buscar o usuário admin no banco PostgreSQL
    const user = await prisma.usuario.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // 3. Comparar a senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // 4. Criptografar sessão JWT
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 dia
    const session = await encrypt({
      userId: user.id,
      email: user.email,
      nome: user.nome,
    });

    // 5. Configurar resposta e definir cookie
    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, nome: user.nome },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'session',
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expires,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Erro na API de Login:', error);
    return NextResponse.json(
      { message: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
