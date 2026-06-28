import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirecionar por padrão para o painel administrativo
  redirect('/admin/dashboard');
}
