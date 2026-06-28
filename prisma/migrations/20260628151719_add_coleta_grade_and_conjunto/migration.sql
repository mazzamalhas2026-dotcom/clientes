-- AlterTable
ALTER TABLE "participantes" ADD COLUMN     "tamanho_short" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "tipo_coleta" TEXT NOT NULL DEFAULT 'NOMINAL',
ADD COLUMN     "tipo_produto" TEXT NOT NULL DEFAULT 'APENAS_CAMISA';
