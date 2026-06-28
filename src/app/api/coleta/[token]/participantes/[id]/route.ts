import { NextResponse } from 'next/server';
import { PedidoService } from '@/features/pedidos/services/pedidoService';
import { ColetaService } from '@/features/coleta/services/coletaService';

const pedidoService = new PedidoService();
const coletaService = new ColetaService();

interface RouteParams {
  params: Promise<{ token: string; id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { token, id } = await params;
    const pedido = await pedidoService.getOrderByToken(token);
    const body = await request.json();

    // Validar se o participante pertence a este pedido para evitar adulteração (tampering)
    const participantes = await coletaService.getParticipantsByPedidoId(pedido.id);
    const belongs = participantes.some((p) => p.id === id);
    if (!belongs) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const participante = await coletaService.updateParticipant(id, body);
    return NextResponse.json(participante, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao atualizar participante' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { token, id } = await params;
    const pedido = await pedidoService.getOrderByToken(token);

    // Validar se o participante pertence a este pedido
    const participantes = await coletaService.getParticipantsByPedidoId(pedido.id);
    const belongs = participantes.some((p) => p.id === id);
    if (!belongs) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const participante = await coletaService.deleteParticipant(id);
    return NextResponse.json({ success: true, message: 'Participante removido com sucesso', participante }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao excluir participante' },
      { status: 400 }
    );
  }
}
