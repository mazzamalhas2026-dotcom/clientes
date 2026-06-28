import { ColetaRepository } from '../repositories/coletaRepository';
import { PedidoRepository } from '../../pedidos/repositories/pedidoRepository';
import { ParticipanteSchema, ParticipanteInput, Participante, ResumoPedido, TamanhosValidos, Tamanho } from '../types';

export class ColetaService {
  private repository = new ColetaRepository();
  private pedidoRepository = new PedidoRepository();

  /**
   * Verifica se o pedido está bloqueado para edições (finalizado)
   */
  private async checkOrderLock(pedidoId: string): Promise<void> {
    const pedido = await this.pedidoRepository.findById(pedidoId);
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status === 'FINALIZADO') {
      throw new Error('Este pedido já foi finalizado. Não é permitido fazer alterações.');
    }
  }

  async getParticipantsByPedidoId(pedidoId: string): Promise<Participante[]> {
    if (!pedidoId) throw new Error('ID do pedido é obrigatório');
    return this.repository.findByPedidoId(pedidoId);
  }

  async addParticipant(data: ParticipanteInput & { ipCriacao?: string }, bypassLock = false): Promise<Participante> {
    const validatedData = ParticipanteSchema.parse(data);
    if (!bypassLock) {
      await this.checkOrderLock(validatedData.pedidoId);
    }

    // Validar número duplicado
    if (validatedData.numero) {
      const isDuplicate = await this.repository.findDuplicateNumber(
        validatedData.pedidoId,
        validatedData.numero
      );
      if (isDuplicate) {
        throw new Error(`O número "${validatedData.numero}" já está cadastrado neste pedido.`);
      }
    }

    // Se o pedido estava "AGUARDANDO_PREENCHIMENTO", atualizar para "EM_PREENCHIMENTO"
    const pedido = await this.pedidoRepository.findById(validatedData.pedidoId);
    if (pedido && pedido.status === 'AGUARDANDO_PREENCHIMENTO') {
      await this.pedidoRepository.updateStatus(validatedData.pedidoId, 'EM_PREENCHIMENTO');
    }

    return this.repository.create(validatedData);
  }

  async updateParticipant(id: string, data: Partial<ParticipanteInput>, bypassLock = false): Promise<Participante> {
    if (!id) throw new Error('ID do participante é obrigatório');
    const validatedData = ParticipanteSchema.partial().parse(data);

    // Buscar participante existente para pegar o pedidoId
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error('Participante não encontrado');
    
    if (!bypassLock) {
      await this.checkOrderLock(existing.pedidoId);
    }

    // Validar número duplicado (excluindo ele mesmo)
    if (validatedData.numero) {
      const isDuplicate = await this.repository.findDuplicateNumber(
        existing.pedidoId,
        validatedData.numero,
        id
      );
      if (isDuplicate) {
        throw new Error(`O número "${validatedData.numero}" já está cadastrado neste pedido.`);
      }
    }

    return this.repository.update(id, validatedData);
  }

  async deleteParticipant(id: string, bypassLock = false): Promise<Participante> {
    if (!id) throw new Error('ID do participante é obrigatório');

    const existing = await this.repository.findById(id);
    if (!existing) throw new Error('Participante não encontrado');

    if (!bypassLock) {
      await this.checkOrderLock(existing.pedidoId);
    }

    return this.repository.delete(id);
  }

  /**
   * Gera o resumo consolidado de tamanhos e participantes para o pedido
   */
  async getOrderSummary(pedidoId: string): Promise<ResumoPedido> {
    const participants = await this.repository.findByPedidoId(pedidoId);
    
    // Inicializar mapa de contagem para todos os tamanhos válidos (Camisas)
    const counts = TamanhosValidos.reduce((acc, tamanho) => {
      acc[tamanho] = 0;
      return acc;
    }, {} as Record<Tamanho, number>);

    // Inicializar mapa de contagem para todos os tamanhos válidos (Shorts)
    const shortCounts = TamanhosValidos.reduce((acc, tamanho) => {
      acc[tamanho] = 0;
      return acc;
    }, {} as Record<Tamanho, number>);

    // Contar ocorrencias
    for (const p of participants) {
      if (TamanhosValidos.includes(p.tamanho as Tamanho)) {
        counts[p.tamanho as Tamanho]++;
      }
      if (p.tamanhoShort && TamanhosValidos.includes(p.tamanhoShort as Tamanho)) {
        shortCounts[p.tamanhoShort as Tamanho]++;
      }
    }

    // Converter para array ordenado conforme TamanhosValidos
    const totalPorTamanho = TamanhosValidos.map((tamanho) => ({
      tamanho,
      quantidade: counts[tamanho],
    }));

    const totalPorTamanhoShort = TamanhosValidos.map((tamanho) => ({
      tamanho,
      quantidade: shortCounts[tamanho],
    }));

    return {
      totalParticipantes: participants.length,
      totalPorTamanho,
      totalPorTamanhoShort,
    };
  }

  /**
   * Finaliza o envio do pedido pelo cliente. Bloqueia futuras edições e grava IP de auditoria.
   */
  async finalizeOrder(pedidoId: string, ip: string): Promise<void> {
    if (!pedidoId) throw new Error('ID do pedido é obrigatório');
    
    const pedido = await this.pedidoRepository.findById(pedidoId);
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status === 'FINALIZADO') {
      throw new Error('Este pedido já está finalizado.');
    }

    // Travar os participantes (salva data e IP de auditoria)
    await this.repository.finalizeOrderParticipants(pedidoId, ip);

    // Mudar o status do pedido para FINALIZADO
    await this.pedidoRepository.updateStatus(pedidoId, 'FINALIZADO');
  }
}
