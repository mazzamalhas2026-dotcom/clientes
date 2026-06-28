import { prisma } from '@/lib/prisma';
import { Pedido, PedidoInput } from '../types';

export class PedidoRepository {
  /**
   * Retorna todos os pedidos ativos com dados do cliente correspondente
   */
  async findAll(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
      where: { deletedAt: null },
      include: {
        cliente: {
          select: {
            nome: true,
            responsavel: true,
            whatsapp: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Pedido[];
  }

  /**
   * Busca um pedido pelo ID com dados do cliente
   */
  async findById(id: string): Promise<Pedido | null> {
    const pedido = await prisma.pedido.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: true,
        participantes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return pedido as unknown as Pedido | null;
  }

  /**
   * Busca um pedido pelo token único (para a área do cliente)
   */
  async findByToken(token: string): Promise<Pedido | null> {
    const pedido = await prisma.pedido.findFirst({
      where: { token, deletedAt: null },
      include: {
        cliente: true,
        participantes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return pedido as unknown as Pedido | null;
  }

  /**
   * Cria um novo pedido com número gerado e token único
   */
  async create(data: PedidoInput & { numeroPedido: string; token: string }): Promise<Pedido> {
    const pedido = await prisma.pedido.create({
      data: {
        clienteId: data.clienteId,
        numeroPedido: data.numeroPedido,
        token: data.token,
        descricao: data.descricao,
        quantidadePrevista: data.quantidadePrevista,
        observacoes: data.observacoes,
        status: data.status || 'AGUARDANDO_PREENCHIMENTO',
        tipoColeta: data.tipoColeta || 'NOMINAL',
        tipoProduto: data.tipoProduto || 'APENAS_CAMISA',
      },
    });
    return pedido as unknown as Pedido;
  }

  /**
   * Atualiza dados de um pedido
   */
  async update(id: string, data: Partial<PedidoInput>): Promise<Pedido> {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        descricao: data.descricao,
        quantidadePrevista: data.quantidadePrevista,
        observacoes: data.observacoes,
        status: data.status,
        tipoColeta: data.tipoColeta,
        tipoProduto: data.tipoProduto,
      },
    });
    return pedido as unknown as Pedido;
  }

  /**
   * Atualiza apenas o status do pedido
   */
  async updateStatus(id: string, status: string): Promise<Pedido> {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { status },
    });
    return pedido as unknown as Pedido;
  }

  /**
   * Realiza o soft delete do pedido (marca deletedAt)
   */
  async delete(id: string): Promise<Pedido> {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return pedido as unknown as Pedido;
  }

  /**
   * Conta pedidos ativos do ano corrente para gerar o número sequencial do pedido
   */
  async countOrdersThisYear(): Promise<number> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    
    return prisma.pedido.count({
      where: {
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });
  }
}
