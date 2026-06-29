import { prisma } from '@/lib/prisma';
import { Participante, ParticipanteInput } from '../types';

export class ColetaRepository {
  /**
   * Retorna os participantes de um pedido específico
   */
  async findByPedidoId(pedidoId: string): Promise<Participante[]> {
    return prisma.participante.findMany({
      where: { pedidoId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    }) as unknown as Participante[];
  }

  /**
   * Busca um participante pelo ID
   */
  async findById(id: string): Promise<Participante | null> {
    const part = await prisma.participante.findFirst({
      where: { id, deletedAt: null },
    });
    return part as unknown as Participante | null;
  }

  /**
   * Cria um novo participante
   */
  async create(data: ParticipanteInput & { ipCriacao?: string }): Promise<Participante> {
    const part = await prisma.participante.create({
      data: {
        pedidoId: data.pedidoId,
        nomeCompleto: data.nomeCompleto,
        nomeCamisa: data.nomeCamisa,
        numero: data.numero,
        tamanho: data.tamanho,
        tamanhoShort: data.tamanhoShort,
        quantidadeCamisa: data.quantidadeCamisa ?? 1,
        quantidadeShort: data.quantidadeShort ?? 1,
        observacoes: data.observacoes,
        ipCriacao: data.ipCriacao,
      },
    });
    return part as unknown as Participante;
  }

  /**
   * Atualiza dados de um participante
   */
  async update(id: string, data: Partial<ParticipanteInput>): Promise<Participante> {
    const part = await prisma.participante.update({
      where: { id },
      data: {
        nomeCompleto: data.nomeCompleto,
        nomeCamisa: data.nomeCamisa,
        numero: data.numero,
        tamanho: data.tamanho,
        tamanhoShort: data.tamanhoShort,
        quantidadeCamisa: data.quantidadeCamisa,
        quantidadeShort: data.quantidadeShort,
        observacoes: data.observacoes,
      },
    });
    return part as unknown as Participante;
  }

  /**
   * Realiza o soft delete do participante (marca deletedAt)
   */
  async delete(id: string): Promise<Participante> {
    const part = await prisma.participante.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return part as unknown as Participante;
  }

  /**
   * Busca por número duplicado em um mesmo pedido (excluindo o próprio ID se fornecido)
   */
  async findDuplicateNumber(pedidoId: string, numero: string, excludeId?: string): Promise<boolean> {
    if (!numero || numero.trim() === '') return false;
    
    const duplicate = await prisma.participante.findFirst({
      where: {
        pedidoId,
        numero: numero.trim(),
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
    
    return duplicate !== null;
  }

  /**
   * Finaliza todos os participantes do pedido (trava edição, grava IP e data/hora)
   */
  async finalizeOrderParticipants(pedidoId: string, ip: string): Promise<void> {
    const now = new Date();
    await prisma.participante.updateMany({
      where: { pedidoId, deletedAt: null },
      data: {
        ipCriacao: ip,
        finalizadoEm: now,
      },
    });
  }
}
