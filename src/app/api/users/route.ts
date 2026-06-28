import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/features/auth/utils/verifySession';
import { z } from 'zod';

const UserCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim(),
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const users = await prisma.usuario.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Erro na API de listagem de usuários:', error);
    return NextResponse.json({ message: 'Erro ao listar usuários' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = UserCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { nome, email, senha } = result.data;

    // Verificar se e-mail já existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este e-mail já está sendo utilizado' },
        { status: 400 }
      );
    }

    // Criar hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Salvar novo usuário
    const newUser = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro na API de criação de usuário:', error);
    return NextResponse.json({ message: 'Erro ao criar usuário' }, { status: 500 });
  }
}
