import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { ClienteService } from '@/features/clientes/services/clienteService';

const service = new ClienteService();

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const clientes = await service.searchClients(query);
    return NextResponse.json(clientes, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cliente = await service.createClient(body);
    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao criar cliente' },
      { status: 400 }
    );
  }
}
