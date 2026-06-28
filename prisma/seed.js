const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Carregar .env se não estiver carregado
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando semeadura do banco de dados (seeding)...');

  // Limpar tabelas existentes em ordem reversa
  await prisma.participante.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Criar usuário administrador
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador Malharia',
      email: 'admin@malharia.com',
      senha: senhaHash,
    },
  });
  console.log(`Usuário admin criado: ${admin.email}`);

  // 2. Criar Clientes
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Escola Maple Bear',
      responsavel: 'Carla Souza',
      telefone: '(11) 4002-8922',
      whatsapp: '(11) 99999-9999',
      email: 'carla@maple.com.br',
      observacoes: 'Cliente recorrente de uniformes escolares de inverno e verão.',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Time Fênix Futebol Club',
      responsavel: 'Thiago Silva',
      telefone: '(21) 3322-1100',
      whatsapp: '(21) 98888-8888',
      email: 'thiago@fenixfc.com',
      observacoes: 'Time amador local. Pedidos de kits completos (camisa, calção, meião).',
    },
  });
  console.log('Clientes criados.');

  // 3. Criar Pedidos
  const pedido1 = await prisma.pedido.create({
    data: {
      clienteId: cliente1.id,
      numeroPedido: 'PED-2026-0001',
      token: 'MAPLE2026',
      descricao: 'Uniforme Escolar Completo 2026',
      quantidadePrevista: 50,
      status: 'EM_PREENCHIMENTO',
      tipoColeta: 'NOMINAL',
      tipoProduto: 'CONJUNTO',
      observacoes: 'Entregar antes do início do ano letivo.',
    },
  });

  const pedido2 = await prisma.pedido.create({
    data: {
      clienteId: cliente2.id,
      numeroPedido: 'PED-2026-0002',
      token: 'FENIXFC26',
      descricao: 'Kits Oficiais de Jogo Fênix (Camisa + Calção)',
      quantidadePrevista: 15,
      status: 'EM_PREENCHIMENTO',
      tipoColeta: 'GRADE',
      tipoProduto: 'CONJUNTO',
      observacoes: 'Estampa sublimada com escudo em silk screen.',
    },
  });
  console.log('Pedidos criados.');

  // 4. Criar Participantes para o Pedido 1 (Nominal + Conjunto)
  await prisma.participante.createMany({
    data: [
      {
        pedidoId: pedido1.id,
        nomeCompleto: 'Gabriel Barbos Filho',
        nomeCamisa: 'GABI',
        numero: '9',
        tamanho: 'M',
        tamanhoShort: 'G',
        observacoes: 'Manga curta normal',
      },
      {
        pedidoId: pedido1.id,
        nomeCompleto: 'Giorgian De Arrascaeta',
        nomeCamisa: 'ARRASCAETA',
        numero: '10',
        tamanho: 'P',
        tamanhoShort: 'P',
        observacoes: 'Gola careca',
      },
    ],
  });

  // 5. Criar Participantes para o Pedido 2 (Grade + Conjunto)
  await prisma.participante.createMany({
    data: [
      // 3 Camisas M com short M
      { pedidoId: pedido2.id, nomeCompleto: '', nomeCamisa: '', tamanho: 'M', tamanhoShort: 'M' },
      { pedidoId: pedido2.id, nomeCompleto: '', nomeCamisa: '', tamanho: 'M', tamanhoShort: 'M' },
      { pedidoId: pedido2.id, nomeCompleto: '', nomeCamisa: '', tamanho: 'M', tamanhoShort: 'M' },
      // 2 Camisas G com short M
      { pedidoId: pedido2.id, nomeCompleto: '', nomeCamisa: '', tamanho: 'G', tamanhoShort: 'M' },
      { pedidoId: pedido2.id, nomeCompleto: '', nomeCamisa: '', tamanho: 'G', tamanhoShort: 'M' },
      // 1 Camisa GG com short G
      { pedidoId: pedido2.id, nomeCompleto: '', nomeCamisa: '', tamanho: 'GG', tamanhoShort: 'G' },
    ],
  });
  console.log('Participantes iniciais adicionados ao Pedido 2.');

  console.log('Banco de dados semeado com sucesso! 🎉');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
