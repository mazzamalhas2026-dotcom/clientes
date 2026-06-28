import { z } from 'zod';

export const ClienteSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim(),
  responsavel: z.string().min(2, 'Responsável deve ter pelo menos 2 caracteres').trim(),
  telefone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido').nullable().optional().or(z.literal('')),
  observacoes: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().nullable().optional(),
});

export type ClienteInput = z.infer<typeof ClienteSchema>;

export interface Cliente extends ClienteInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
