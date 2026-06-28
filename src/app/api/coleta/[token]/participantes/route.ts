import { NextResponse } from 'next/server';
import { PedidoService } from '@/features/pedidos/services/pedidoService';
import { ColetaService } from '@/features/coleta/services/coletaService';

const pedidoService = new PedidoService();
const coletaService = new ColetaService();

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const pedido = await pedidoService.getOrderByToken(token);
    
    const body = await request.json();
    
    // Garantir que o participante está sendo adicionado a este pedido específico
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const participante = await coletaService.addParticipant({
      ...body,
      pedidoId: pedido.id,
      ipCriacao: ip,
    });

    return NextResponse.json(participante, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao adicionar participante' },
      { status: 400 }
    );
  }
}
