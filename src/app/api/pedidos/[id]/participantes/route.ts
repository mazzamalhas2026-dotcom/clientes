import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { ColetaService } from '@/features/coleta/services/coletaService';

const coletaService = new ColetaService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id: pedidoId } = await params;
    const participantes = await coletaService.getParticipantsByPedidoId(pedidoId);
    return NextResponse.json(participantes, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao buscar participantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id: pedidoId } = await params;
    const body = await request.json();

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Adiciona o participante, passando bypassLock = true para permitir edições de admin
    const participante = await coletaService.addParticipant(
      {
        ...body,
        pedidoId,
        ipCriacao: ip,
      },
      true // bypassLock = true
    );

    return NextResponse.json(participante, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao criar participante' },
      { status: 400 }
    );
  }
}
