import { PedidoRepository } from '../repositories/pedidoRepository';
import { ClienteRepository } from '../../clientes/repositories/clienteRepository';
import { PedidoSchema, PedidoInput, Pedido } from '../types';

export class PedidoService {
  private repository = new PedidoRepository();
  private clienteRepository = new ClienteRepository();

  /**
   * Gera um token único alfanumérico aleatório de 11 caracteres (ex: XK82DJQ91AB)
   */
  private generateUniqueToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    // Usando valores aleatórios seguros
    const randomBytes = new Uint32Array(11);
    // Em Node environment podemos usar globalThis.crypto ou o nativo
    const cryptoModule = require('crypto');
    const bytes = cryptoModule.randomBytes(11);
    for (let i = 0; i < 11; i++) {
      token += chars[bytes[i] % chars.length];
    }
    return token;
  }

  /**
   * Gera o número do pedido no formato PED-ANO-SEQUENCIAL (ex: PED-2026-0005)
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.repository.countOrdersThisYear();
    const sequence = String(count + 1).padStart(4, '0');
    return `PED-${year}-${sequence}`;
  }

  async getAllOrders(): Promise<Pedido[]> {
    return this.repository.findAll();
  }

  async getOrderById(id: string): Promise<Pedido> {
    if (!id) throw new Error('ID do pedido é obrigatório');
    const pedido = await this.repository.findById(id);
    if (!pedido) throw new Error('Pedido não encontrado');
    return pedido;
  }

  async getOrderByToken(token: string): Promise<Pedido> {
    if (!token) throw new Error('Token do pedido é obrigatório');
    const pedido = await this.repository.findByToken(token);
    if (!pedido) throw new Error('Link de pedido inválido ou expirado');
    return pedido;
  }

  async createOrder(data: PedidoInput): Promise<Pedido> {
    // Validar dados via Zod
    const validatedData = PedidoSchema.parse(data);

    // Verificar se o cliente correspondente existe
    const clientExists = await this.clienteRepository.findById(validatedData.clienteId);
    if (!clientExists) throw new Error('Cliente selecionado não existe');

    // Gerar número de pedido sequencial e token único
    const numeroPedido = await this.generateOrderNumber();
    const token = this.generateUniqueToken();

    return this.repository.create({
      ...validatedData,
      numeroPedido,
      token,
    });
  }

  async updateOrder(id: string, data: Partial<PedidoInput>): Promise<Pedido> {
    if (!id) throw new Error('ID do pedido é obrigatório para atualização');
    const validatedData = PedidoSchema.partial().parse(data);

    const exists = await this.repository.findById(id);
    if (!exists) throw new Error('Pedido não encontrado');

    return this.repository.update(id, validatedData);
  }

  async updateOrderStatus(id: string, status: string): Promise<Pedido> {
    if (!id) throw new Error('ID do pedido é obrigatório');
    
    const exists = await this.repository.findById(id);
    if (!exists) throw new Error('Pedido não encontrado');

    return this.repository.updateStatus(id, status);
  }

  async deleteOrder(id: string): Promise<Pedido> {
    if (!id) throw new Error('ID do pedido é obrigatório para exclusão');
    
    const exists = await this.repository.findById(id);
    if (!exists) throw new Error('Pedido não encontrado');

    return this.repository.delete(id);
  }
}
