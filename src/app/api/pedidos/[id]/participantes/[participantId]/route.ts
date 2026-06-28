import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { ColetaService } from '@/features/coleta/services/coletaService';

const coletaService = new ColetaService();

interface RouteParams {
  params: Promise<{ id: string; participantId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id: pedidoId, participantId } = await params;
    const body = await request.json();

    // Validar se o participante pertence a este pedido para evitar inconsistência
    const participantes = await coletaService.getParticipantsByPedidoId(pedidoId);
    const belongs = participantes.some((p) => p.id === participantId);
    if (!belongs) {
      return NextResponse.json({ message: 'Participante não pertence a este pedido' }, { status: 400 });
    }

    const participante = await coletaService.updateParticipant(participantId, body, true); // bypassLock = true
    return NextResponse.json(participante, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao atualizar participante' },
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
    const { id: pedidoId, participantId } = await params;

    const participantes = await coletaService.getParticipantsByPedidoId(pedidoId);
    const belongs = participantes.some((p) => p.id === participantId);
    if (!belongs) {
      return NextResponse.json({ message: 'Participante não pertence a este pedido' }, { status: 400 });
    }

    const participante = await coletaService.deleteParticipant(participantId, true); // bypassLock = true
    return NextResponse.json({ success: true, message: 'Participante excluído', participante }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao excluir participante' },
      { status: 400 }
    );
  }
}
