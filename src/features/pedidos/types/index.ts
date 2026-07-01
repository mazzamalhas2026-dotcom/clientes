import { z } from 'zod';

export const PedidoStatus = {
  AGUARDANDO_PREENCHIMENTO: 'AGUARDANDO_PREENCHIMENTO',
  EM_PREENCHIMENTO: 'EM_PREENCHIMENTO',
  FINALIZADO: 'FINALIZADO',
} as const;

export type PedidoStatusType = keyof typeof PedidoStatus;

export const PedidoSchema = z.object({
  id: z.string().uuid().optional(),
  clienteId: z.string().uuid('Cliente selecionado inválido'),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres').trim(),
  quantidadePrevista: z.number().int().positive('Quantidade prevista deve ser maior que zero'),
  observacoes: z.string().nullable().optional(),
  status: z.nativeEnum(PedidoStatus).optional(),
  tipoColeta: z.enum(['NOMINAL', 'GRADE']).optional().default('NOMINAL'),
  tipoProduto: z.enum(['APENAS_CAMISA', 'CONJUNTO', 'APENAS_CALCA', 'APENAS_SHORT', 'APENAS_BERMUDA', 'APENAS_AGASALHO']).optional().default('APENAS_CAMISA'),
});

export type PedidoInput = z.infer<typeof PedidoSchema>;

export interface Pedido {
  id: string;
  clienteId: string;
  numeroPedido: string;
  token: string;
  descricao: string;
  quantidadePrevista: number;
  observacoes: string | null;
  status: PedidoStatusType;
  tipoColeta: 'NOMINAL' | 'GRADE';
  tipoProduto: 'APENAS_CAMISA' | 'CONJUNTO' | 'APENAS_CALCA' | 'APENAS_SHORT' | 'APENAS_BERMUDA' | 'APENAS_AGASALHO';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  cliente?: {
    nome: string;
    responsavel: string;
    whatsapp?: string | null;
  };
}
