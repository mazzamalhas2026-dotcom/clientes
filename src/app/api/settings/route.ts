import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/features/auth/utils/verifySession';
import { z } from 'zod';

const SettingsSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim(),
  senhaAtual: z.string().optional().or(z.literal('')),
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
});

export async function PUT(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = SettingsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { nome, senhaAtual, novaSenha } = result.data;

    // Buscar usuário atual no banco
    const user = await prisma.usuario.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: { nome: string; senha?: string } = { nome };

    // Se informou nova senha, deve validar a senha atual
    if (novaSenha && senhaAtual) {
      const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Senha atual incorreta' },
          { status: 400 }
        );
      }
      updateData.senha = await bcrypt.hash(novaSenha, 10);
    } else if (novaSenha && !senhaAtual) {
      return NextResponse.json(
        { message: 'Você deve informar a senha atual para alterá-la' },
        { status: 400 }
      );
    }

    // Salvar atualizações
    const updatedUser = await prisma.usuario.update({
      where: { id: session.userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso!',
      user: {
        id: updatedUser.id,
        nome: updatedUser.nome,
        email: updatedUser.email,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erro na API de Configurações:', error);
    return NextResponse.json(
      { message: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
