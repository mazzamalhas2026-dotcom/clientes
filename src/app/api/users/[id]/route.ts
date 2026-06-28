import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/features/auth/utils/verifySession';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Evitar que o usuário se autodelete
    if (session.userId === id) {
      return NextResponse.json(
        { message: 'Você não pode excluir a sua própria conta' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.usuario.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Realizar Soft Delete
    await prisma.usuario.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro na API de deleção de usuário:', error);
    return NextResponse.json({ message: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
