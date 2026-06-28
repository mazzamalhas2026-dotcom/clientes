import { NextResponse } from 'next/server';
import { verifySession } from '@/features/auth/utils/verifySession';
import { ClienteService } from '@/features/clientes/services/clienteService';

const service = new ClienteService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const cliente = await service.getClientById(id);
    return NextResponse.json(cliente, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Cliente não encontrado' },
      { status: 404 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const cliente = await service.updateClient(id, body);
    return NextResponse.json(cliente, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao atualizar cliente' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await service.deleteClient(id);
    return NextResponse.json({ success: true, message: 'Cliente removido com sucesso' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao remover cliente' },
      { status: 400 }
    );
  }
}
