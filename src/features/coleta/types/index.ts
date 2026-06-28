import { z } from 'zod';

export const TamanhosValidos = [
  '2 anos',
  '4 anos',
  '6 anos',
  '8 anos',
  '10 anos',
  '12 anos',
  '14 anos',
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'XGG',
  'XXG',
  'XXXG',
  'Especial',
  'BABY LOOK P',
  'BABY LOOK M',
  'BABY LOOK G',
  'BABY LOOK GG',
  'BABY LOOK XG'
] as const;

export const TamanhosShortsValidos = [
  '2 anos',
  '4 anos',
  '6 anos',
  '8 anos',
  '10 anos',
  '12 anos',
  '14 anos',
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'XGG',
  'XXG',
  'XXXG',
  'Especial'
] as const;

export type Tamanho = typeof TamanhosValidos[number];
export type TamanhoShort = typeof TamanhosShortsValidos[number];

export const ParticipanteSchema = z.object({
  id: z.string().uuid().optional(),
  pedidoId: z.string().uuid('ID do pedido inválido'),
  nomeCompleto: z
    .string()
    .default('')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  nomeCamisa: z
    .string()
    .default('')
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  numero: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : null)),
  tamanho: z.enum(TamanhosValidos, {
    message: 'Selecione um tamanho válido',
  }),
  tamanhoShort: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : null)),
  observacoes: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : null)),
});

export type ParticipanteInput = z.infer<typeof ParticipanteSchema>;

export interface Participante {
  id: string;
  pedidoId: string;
  nomeCompleto: string;
  nomeCamisa: string;
  numero: string | null;
  tamanho: Tamanho;
  tamanhoShort: string | null;
  observacoes: string | null;
  ipCriacao: string | null;
  finalizadoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ResumoTamanhos {
  tamanho: Tamanho;
  quantidade: number;
}

export interface ResumoPedido {
  totalParticipantes: number;
  totalPorTamanho: ResumoTamanhos[];
  totalPorTamanhoShort?: ResumoTamanhos[]; // resumo para shorts se for conjunto
}
