'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, KeyRound, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';

const loginSchema = z.object({
  email: z.string().email('Insira um e-mail válido').trim(),
  senha: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao realizar login');
      }

      // Redirecionar para o dashboard ou página anterior
      const from = searchParams.get('from') || '/admin/dashboard';
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Falha ao se conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-radial from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900 overflow-hidden font-sans transition-colors duration-300">
      {/* Decorações do Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-400/20 dark:bg-cyan-600/10 blur-3xl pointer-events-none" />
      
      {/* Botão de Tema no Topo Direito */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-4 z-5">
        {/* Logo/Marca */}
        <div className="flex flex-col items-center mb-6 text-center animate-fade-in">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 dark:shadow-indigo-600/20 mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            Portal Malharia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Painel Administrativo MVP
          </p>
        </div>

        {/* Card de Login */}
        <Card className="border border-white/20 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white">
              Entrar
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Digite seu e-mail e senha para gerenciar pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2 animate-shake">
                  <ShieldCheck className="h-4 w-4 shrink-0 rotate-180" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@malharia.com"
                    className="pl-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 bg-white/50 dark:bg-slate-900/50"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="senha" className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</Label>
                  
                  {/* Recuperar Senha Dialog */}
                  <Dialog>
                    <DialogTrigger
                      render={
                        <button
                          type="button"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer focus:outline-none"
                        />
                      }
                    >
                      Esqueceu sua senha?
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-slate-800 dark:text-white">Recuperação de Senha</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                          Instruções para redefinir o seu acesso.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="mb-3">
                          Para garantir a segurança do sistema de pedidos da malharia, as redefinições de senha são gerenciadas manualmente.
                        </p>
                        <p>
                          Por favor, entre em contato direto com a equipe de TI da malharia pelo e-mail{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">suporte@malharia.com</strong> ou abra um chamado interno de suporte.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 bg-white/50 dark:bg-slate-900/50"
                    {...register('senha')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-xs text-destructive mt-1">{errors.senha.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-600/20 dark:shadow-none transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no Painel'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-900/50 bg-slate-50/50 dark:bg-slate-950/20 py-4">
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} Malharia MVP. Todos os direitos reservados.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
