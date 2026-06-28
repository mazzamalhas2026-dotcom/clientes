-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "numero_pedido" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade_prevista" INTEGER NOT NULL,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_PREENCHIMENTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes" (
    "id" UUID NOT NULL,
    "pedido_id" UUID NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "nome_camisa" TEXT NOT NULL,
    "numero" TEXT,
    "tamanho" TEXT NOT NULL,
    "observacoes" TEXT,
    "ip_criacao" TEXT,
    "finalizado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_pedido_key" ON "pedidos"("numero_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_token_key" ON "pedidos"("token");

-- CreateIndex
CREATE INDEX "pedidos_token_idx" ON "pedidos"("token");

-- CreateIndex
CREATE INDEX "pedidos_numero_pedido_idx" ON "pedidos"("numero_pedido");

-- CreateIndex
CREATE INDEX "participantes_pedido_id_idx" ON "participantes"("pedido_id");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
