'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Settings,
  ShieldCheck,
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Trash2,
  Calendar,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Schema do perfil
const settingsFormSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').trim(),
  senhaAtual: z.string().optional().or(z.literal('')),
  novaSenha: z.string().optional().or(z.literal('')),
  confirmarSenha: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.novaSenha && !data.senhaAtual) {
    return false;
  }
  return true;
}, {
  message: 'Senha atual é obrigatória para cadastrar nova senha',
  path: ['senhaAtual'],
}).refine((data) => {
  if (data.novaSenha !== data.confirmarSenha) {
    return false;
  }
  return true;
}, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface UserProfile {
  nome: string;
  email: string;
}

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
}

export default function ConfigsPage() {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'users'>('profile');
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Estados do gerenciamento de usuários
  const [usersList, setUsersList] = React.useState<AdminUser[]>([]);
  const [isUserListLoading, setIsUserListLoading] = React.useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = React.useState(false);
  const [deletingUser, setDeletingUser] = React.useState<AdminUser | null>(null);

  // Campos do formulário de novo usuário
  const [newUserNome, setNewUserNome] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserSenha, setNewUserSenha] = React.useState('');
  const [createUserError, setCreateUserError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      nome: '',
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  // Carregar perfil
  const loadProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Não autenticado');
      const data = await response.json();
      setProfile(data.user);
      setValue('nome', data.user.nome);
    } catch (err: any) {
      setError('Erro ao carregar dados do usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar lista de usuários administradores
  const loadUsersList = async () => {
    setIsUserListLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUsersList(data);
    } catch (err) {
      setError('Erro ao carregar lista de administradores.');
    } finally {
      setIsUserListLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfile();
  }, [setValue]);

  React.useEffect(() => {
    if (activeTab === 'users') {
      loadUsersList();
    }
  }, [activeTab]);

  // Salvar perfil/senha
  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: data.nome,
          senhaAtual: data.senhaAtual || undefined,
          novaSenha: data.novaSenha || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao atualizar configurações');
      }

      setSuccessMsg(result.message || 'Configurações atualizadas com sucesso!');
      
      if (profile) {
        setProfile({ ...profile, nome: data.nome });
      }

      reset({
        nome: data.nome,
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: '',
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Cadastrar novo usuário administrativo
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setIsSubmitLoading(true);

    if (!newUserNome.trim() || !newUserEmail.trim() || !newUserSenha.trim()) {
      setCreateUserError('Todos os campos são obrigatórios');
      setIsSubmitLoading(false);
      return;
    }

    if (newUserSenha.length < 6) {
      setCreateUserError('A senha deve ter no mínimo 6 caracteres');
      setIsSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newUserNome,
          email: newUserEmail,
          senha: newUserSenha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar usuário');
      }

      // Sucesso
      setIsCreateUserOpen(false);
      setNewUserNome('');
      setNewUserEmail('');
      setNewUserSenha('');
      loadUsersList();
    } catch (err: any) {
      setCreateUserError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Confirmar exclusão de usuário
  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return;
    setIsSubmitLoading(true);
    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir usuário');
      }

      setDeletingUser(null);
      loadUsersList();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
        <p className="text-sm text-slate-450">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Abas Superiores de Configuração */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => {
            setActiveTab('profile');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" />
          Minha Conta
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Gerenciar Usuários
        </button>
      </div>

      {activeTab === 'profile' ? (
        /* Painel 1: Perfil do Administrador */
        <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              Configurações da Conta
            </CardTitle>
            <CardDescription className="text-slate-450">
              Atualize suas informações cadastrais e senha de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Mensagem de Erro */}
              {error && (
                <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mensagem de Sucesso */}
              {successMsg && (
                <div className="p-3 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-200/30 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* E-mail */}
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">E-mail de Acesso (Não alterável)</Label>
                <Input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="rounded-lg border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-900/50 text-slate-400 select-none"
                />
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-slate-700 dark:text-slate-300">Nome de Exibição *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="nome"
                    placeholder="Nome do Administrador"
                    className="pl-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 bg-white dark:bg-slate-900"
                    {...register('nome')}
                    disabled={isSubmitLoading}
                  />
                </div>
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-900/50 my-6 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-250">Alterar Senha de Acesso</h3>
                <p className="text-xs text-slate-400">Preencha os campos abaixo apenas se desejar redefinir sua senha.</p>
                
                {/* Senha Atual */}
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual" className="text-slate-700 dark:text-slate-300">Senha Atual</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="senhaAtual"
                      type="password"
                      placeholder="Sua senha atual"
                      className="pl-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 bg-white dark:bg-slate-900"
                      {...register('senhaAtual')}
                      disabled={isSubmitLoading}
                    />
                  </div>
                  {errors.senhaAtual && <p className="text-xs text-destructive">{errors.senhaAtual.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="novaSenha" className="text-slate-700 dark:text-slate-300">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 bg-white dark:bg-slate-900"
                      {...register('novaSenha')}
                      disabled={isSubmitLoading}
                    />
                    {errors.novaSenha && <p className="text-xs text-destructive">{errors.novaSenha.message}</p>}
                  </div>

                  {/* Confirmar Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha" className="text-slate-700 dark:text-slate-300">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="Repita a nova senha"
                      className="rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 bg-white dark:bg-slate-900"
                      {...register('confirmarSenha')}
                      disabled={isSubmitLoading}
                    />
                    {errors.confirmarSenha && <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full mt-6 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white font-medium cursor-pointer"
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando configurações...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Painel 2: Gerenciamento de Usuários */
        <div className="space-y-6">
          
          {/* Cabeçalho do Gerenciamento */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-550" />
                Usuários Administrativos
              </h2>
              <p className="text-xs text-slate-450">
                Pessoas com permissão para gerenciar clientes, pedidos e listas.
              </p>
            </div>
            <Button
              onClick={() => {
                setCreateUserError(null);
                setIsCreateUserOpen(true);
              }}
              className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Novo Administrador
            </Button>
          </div>

          {error && (
            <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tabela de Usuários */}
          <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-md rounded-2xl overflow-hidden transition-colors duration-300">
            <CardContent className="p-0">
              {isUserListLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                  <p className="text-sm text-slate-450">Carregando administradores...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-center py-16 text-slate-450">
                  Nenhum usuário administrativo cadastrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Nome</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-350">E-mail</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-350">Cadastro</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersList.map((user) => (
                        <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <TableCell className="font-bold text-slate-800 dark:text-slate-100">
                            {user.nome}
                          </TableCell>
                          <TableCell className="text-slate-650 dark:text-slate-300 font-semibold">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-slate-450 dark:text-slate-455 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingUser(user)}
                              disabled={profile?.email === user.email} // Bloquear exclusão de si mesmo
                              className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                              title={profile?.email === user.email ? "Você não pode excluir a sua própria conta" : "Excluir Usuário"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Criar Novo Usuário */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-855 dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              Novo Administrador
            </DialogTitle>
            <DialogDescription className="text-slate-550">
              Cadastre um novo login de acesso para gerenciar o sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            {createUserError && (
              <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createUserError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newNome" className="text-slate-700 dark:text-slate-300">Nome Completo *</Label>
              <Input
                id="newNome"
                placeholder="Ex: Carlos Oliveira"
                value={newUserNome}
                onChange={(e) => setNewUserNome(e.target.value)}
                disabled={isSubmitLoading}
                className="rounded-lg border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail" className="text-slate-700 dark:text-slate-300">E-mail de Login *</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Ex: carlos@malharia.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={isSubmitLoading}
                className="rounded-lg border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newSenha" className="text-slate-700 dark:text-slate-300">Senha Provisória *</Label>
              <Input
                id="newSenha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUserSenha}
                onChange={(e) => setNewUserSenha(e.target.value)}
                disabled={isSubmitLoading}
                className="rounded-lg border-slate-200 dark:border-slate-800"
              />
            </div>

            <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateUserOpen(false)}
                className="rounded-lg cursor-pointer"
                disabled={isSubmitLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-medium cursor-pointer"
                disabled={isSubmitLoading}
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Usuário'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Deleção de Usuário */}
      <Dialog open={deletingUser !== null} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              Excluir Administrador
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400">
              Tem certeza que deseja excluir o acesso de <strong>{deletingUser?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
            Este usuário perderá o acesso ao painel da malharia imediatamente.
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingUser(null)}
              className="rounded-lg cursor-pointer"
              disabled={isSubmitLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteUserConfirm}
              className="rounded-lg bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
              disabled={isSubmitLoading}
            >
              {isSubmitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
