import { NextResponse } from 'next/server';
import { PedidoService } from '@/features/pedidos/services/pedidoService';
import { ColetaService } from '@/features/coleta/services/coletaService';

const pedidoService = new PedidoService();
const coletaService = new ColetaService();

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    
    // 1. Obter detalhes do pedido
    const pedido = await pedidoService.getOrderByToken(token);
    
    // 2. Obter resumo de contagem de tamanhos
    const resumo = await coletaService.getOrderSummary(pedido.id);

    return NextResponse.json({
      pedido,
      resumo,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao carregar link do pedido' },
      { status: 404 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const pedido = await pedidoService.getOrderByToken(token);

    // Pegar IP do cliente de auditoria
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Finalizar o pedido (trava edições)
    await coletaService.finalizeOrder(pedido.id, ip);

    return NextResponse.json({
      success: true,
      message: 'Pedido finalizado com sucesso!',
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao finalizar pedido' },
      { status: 400 }
    );
  }
}
