import { ClienteRepository } from '../repositories/clienteRepository';
import { ClienteSchema, ClienteInput, Cliente } from '../types';

export class ClienteService {
  private repository = new ClienteRepository();

  async getAllClients(): Promise<Cliente[]> {
    return this.repository.findAll();
  }

  async getClientById(id: string): Promise<Cliente> {
    if (!id) throw new Error('ID do cliente é obrigatório');
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new Error('Cliente não encontrado');
    return cliente;
  }

  async createClient(data: ClienteInput): Promise<Cliente> {
    // Validar dados com Zod
    const validatedData = ClienteSchema.parse(data);
    return this.repository.create(validatedData);
  }

  async updateClient(id: string, data: Partial<ClienteInput>): Promise<Cliente> {
    if (!id) throw new Error('ID do cliente é obrigatório para atualização');
    
    // Validar dados parciais com Zod (fazendo o parse do esquema parcial)
    const validatedData = ClienteSchema.partial().parse(data);
    
    // Verificar se o cliente existe
    const exists = await this.repository.findById(id);
    if (!exists) throw new Error('Cliente não encontrado');

    return this.repository.update(id, validatedData);
  }

  async deleteClient(id: string): Promise<Cliente> {
    if (!id) throw new Error('ID do cliente é obrigatório para exclusão');
    
    const exists = await this.repository.findById(id);
    if (!exists) throw new Error('Cliente não encontrado');

    return this.repository.delete(id);
  }

  async searchClients(query: string): Promise<Cliente[]> {
    if (!query || query.trim() === '') {
      return this.repository.findAll();
    }
    return this.repository.search(query.trim());
  }
}
