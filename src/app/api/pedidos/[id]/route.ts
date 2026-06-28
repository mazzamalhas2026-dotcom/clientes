import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { PedidoService } from '@/features/pedidos/services/pedidoService';

const service = new PedidoService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const pedido = await service.getOrderById(id);
    return NextResponse.json(pedido, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Pedido não encontrado' },
      { status: 404 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const pedido = await service.updateOrder(id, body);
    return NextResponse.json(pedido, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao atualizar pedido' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await service.deleteOrder(id);
    return NextResponse.json({ success: true, message: 'Pedido removido com sucesso' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao remover pedido' },
      { status: 400 }
    );
  }
}
