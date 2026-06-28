import { prisma } from '@/lib/prisma';
import { Cliente, ClienteInput } from '../types';

export class ClienteRepository {
  /**
   * Retorna todos os clientes ativos (não deletados suavemente)
   */
  async findAll(): Promise<Cliente[]> {
    return prisma.cliente.findMany({
      where: { deletedAt: null },
      orderBy: { nome: 'asc' },
    }) as unknown as Cliente[];
  }

  /**
   * Busca um cliente pelo ID
   */
  async findById(id: string): Promise<Cliente | null> {
    const cliente = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
    });
    return cliente as unknown as Cliente | null;
  }

  /**
   * Cria um novo cliente
   */
  async create(data: ClienteInput): Promise<Cliente> {
    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        responsavel: data.responsavel,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        observacoes: data.observacoes,
      },
    });
    return cliente as unknown as Cliente;
  }

  /**
   * Atualiza os dados de um cliente
   */
  async update(id: string, data: Partial<ClienteInput>): Promise<Cliente> {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: data.nome,
        responsavel: data.responsavel,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        observacoes: data.observacoes,
      },
    });
    return cliente as unknown as Cliente;
  }

  /**
   * Realiza o soft delete do cliente (marca deletedAt)
   */
  async delete(id: string): Promise<Cliente> {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return cliente as unknown as Cliente;
  }

  /**
   * Pesquisa clientes por nome, responsável ou email
   */
  async search(query: string): Promise<Cliente[]> {
    return prisma.cliente.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { responsavel: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { nome: 'asc' },
    }) as unknown as Cliente[];
  }
}
