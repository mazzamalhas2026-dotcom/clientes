import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { PedidoService } from '@/features/pedidos/services/pedidoService';

const service = new PedidoService();

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const pedidos = await service.getAllOrders();
    return NextResponse.json(pedidos, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const pedido = await service.createOrder(body);
    return NextResponse.json(pedido, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao criar pedido' },
      { status: 400 }
    );
  }
}
