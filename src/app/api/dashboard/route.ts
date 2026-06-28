import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    // 1. Contar clientes ativos
    const totalClientes = await prisma.cliente.count({
      where: { deletedAt: null },
    });

    // 2. Contar pedidos ativos
    const totalPedidos = await prisma.pedido.count({
      where: { deletedAt: null },
    });

    // 3. Contar participantes ativos (total de peças coletadas)
    const totalPecas = await prisma.participante.count({
      where: { deletedAt: null },
    });

    // 4. Contar pedidos por status
    const statusCounts = await prisma.pedido.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: {
        id: true,
      },
    });

    const statusBreakdown = {
      AGUARDANDO_PREENCHIMENTO: 0,
      EM_PREENCHIMENTO: 0,
      FINALIZADO: 0,
    };

    statusCounts.forEach((group) => {
      const statusKey = group.status as keyof typeof statusBreakdown;
      if (statusKey in statusBreakdown) {
        statusBreakdown[statusKey] = group._count.id;
      }
    });

    // 5. Obter os 5 pedidos recentes
    const recentPedidos = await prisma.pedido.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalClientes,
      totalPedidos,
      totalPecas,
      statusBreakdown,
      recentPedidos,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erro na API de Dashboard:', error);
    return NextResponse.json(
      { message: error.message || 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
