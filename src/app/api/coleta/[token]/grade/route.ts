import { NextResponse } from 'next/server';
import { PedidoService } from '@/features/pedidos/services/pedidoService';
import { prisma } from '@/lib/prisma';
import { TamanhosValidos } from '@/features/coleta/types';

const pedidoService = new PedidoService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const pedido = await pedidoService.getOrderByToken(token);

    if (pedido.status === 'FINALIZADO') {
      return NextResponse.json(
        { message: 'Este pedido já foi finalizado e está bloqueado para edições.' },
        { status: 403 }
      );
    }

    const { camisas, shorts } = await request.json();

    // Validar e sanitizar as contagens
    const validatedCamisas: Record<string, number> = {};
    const validatedShorts: Record<string, number> = {};

    for (const size of TamanhosValidos) {
      validatedCamisas[size] = Math.max(0, parseInt(camisas?.[size]) || 0);
      validatedShorts[size] = Math.max(0, parseInt(shorts?.[size]) || 0);
    }

    // Gerar lista expandida de camisas
    const jerseys: string[] = [];
    for (const size of TamanhosValidos) {
      const qty = validatedCamisas[size];
      for (let i = 0; i < qty; i++) {
        jerseys.push(size);
      }
    }

    // Gerar lista expandida de shorts
    const pants: string[] = [];
    for (const size of TamanhosValidos) {
      const qty = validatedShorts[size];
      for (let i = 0; i < qty; i++) {
        pants.push(size);
      }
    }

    // Parear camisas e shorts na mesma linha/participante
    const maxItems = Math.max(jerseys.length, pants.length);
    const newParticipants = [];

    for (let i = 0; i < maxItems; i++) {
      // Se não houver camisa correspondente para este short extra, preenche com um tamanho padrão de camisa
      const tamanho = jerseys[i] || 'M';
      const tamanhoShort = pants[i] || null;

      newParticipants.push({
        pedidoId: pedido.id,
        nomeCompleto: '',
        nomeCamisa: '',
        numero: '',
        tamanho,
        tamanhoShort,
        observacoes: '',
      });
    }

    // Substituir de forma transacional todos os participantes ativos
    await prisma.$transaction([
      prisma.participante.deleteMany({
        where: {
          pedidoId: pedido.id,
          deletedAt: null,
        },
      }),
      prisma.participante.createMany({
        data: newParticipants,
      }),
    ]);

    // Mudar status do pedido se necessário
    if (pedido.status === 'AGUARDANDO_PREENCHIMENTO' && maxItems > 0) {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { status: 'EM_PREENCHIMENTO' },
      });
    }

    return NextResponse.json({ success: true, count: maxItems }, { status: 200 });
  } catch (error: any) {
    console.error('Erro na API de sync de grade:', error);
    return NextResponse.json(
      { message: error.message || 'Erro ao sincronizar a grade de tamanhos.' },
      { status: 500 }
    );
  }
}
