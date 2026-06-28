import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { decrypt } from '@/features/auth/utils/session';
import AdminLayoutClient from './layout-client';

export const metadata = {
  title: 'Painel Administrativo - Malharia',
  description: 'Sistema de gestão de clientes e coleta de pedidos.',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Se for a rota de login, renderiza apenas o conteúdo do login (sem sidebar e sem redirect)
  if (pathname.includes('/admin/login')) {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // Garantia extra caso o proxy falhe por algum motivo
  if (!session) {
    redirect('/admin/login');
  }

  const user = {
    nome: session.nome || 'Usuário Malharia',
    email: session.email || '',
  };

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
