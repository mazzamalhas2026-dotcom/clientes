'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Lock,
  Loader2,
  AlertCircle,
  Scissors,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sheet,
  Sparkles,
  Shirt,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tamanho, TamanhosValidos, Participante, ResumoPedido } from '@/features/coleta/types';
import { Pedido } from '@/features/pedidos/types';

// Interface local para linhas da planilha (com suporte a erros locais)
interface LocalRow {
  id: string; // id temporário ou do banco
  dbId?: string; // id persistido no banco
  nomeCompleto: string;
  nomeCamisa: string;
  numero: string;
  tamanho: Tamanho;
  tamanhoShort: Tamanho | '';
  observacoes: string;
  isSaving: boolean;
  errors: {
    nomeCompleto?: string;
    nomeCamisa?: string;
    numero?: string;
    tamanho?: string;
    tamanhoShort?: string;
  };
}

export default function PlanilhaColetaPage() {
  const { token } = useParams();
  
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [rows, setRows] = React.useState<LocalRow[]>([]);
  const [resumo, setResumo] = React.useState<ResumoPedido | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  // Estados específicos para Coleta por Grade (tipoColeta === 'GRADE')
  const [gradeCamisas, setGradeCamisas] = React.useState<Record<Tamanho, number>>(() => {
    return TamanhosValidos.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {} as Record<Tamanho, number>);
  });

  const [gradeShorts, setGradeShorts] = React.useState<Record<Tamanho, number>>(() => {
    return TamanhosValidos.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {} as Record<Tamanho, number>);
  });

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  
  // Modal de Finalização
  const [isFinalizeOpen, setIsFinalizeOpen] = React.useState(false);
  const [isFinalizedSuccess, setIsFinalizedSuccess] = React.useState(false);

  // Carregar dados iniciais por token
  const loadData = async () => {
    setIsLoading(true);
    setSyncError(null);
    try {
      const response = await fetch(`/api/coleta/${token}`);
      if (!response.ok) throw new Error('Link inválido ou pedido inexistente.');
      const data = await response.json();
      
      setPedido(data.pedido);
      setResumo(data.resumo);
      
      const dbParticipants = data.pedido.participantes || [];

      if (data.pedido.tipoColeta === 'GRADE') {
        // Inicializar grades de quantidades baseados nos participantes do banco
        const initialCamisas = TamanhosValidos.reduce((acc, size) => {
          acc[size] = 0;
          return acc;
        }, {} as Record<Tamanho, number>);

        const initialShorts = TamanhosValidos.reduce((acc, size) => {
          acc[size] = 0;
          return acc;
        }, {} as Record<Tamanho, number>);

        dbParticipants.forEach((p: any) => {
          if (p.tamanho && TamanhosValidos.includes(p.tamanho as Tamanho)) {
            initialCamisas[p.tamanho as Tamanho]++;
          }
          if (p.tamanhoShort && TamanhosValidos.includes(p.tamanhoShort as Tamanho)) {
            initialShorts[p.tamanhoShort as Tamanho]++;
          }
        });

        setGradeCamisas(initialCamisas);
        setGradeShorts(initialShorts);
      } else {
        // Mapear participantes carregados para o estado local nominal
        if (dbParticipants.length > 0) {
          setRows(
            dbParticipants.map((p: any) => ({
              id: p.id,
              dbId: p.id,
              nomeCompleto: p.nomeCompleto || '',
              nomeCamisa: p.nomeCamisa || '',
              numero: p.numero || '',
              tamanho: (p.tamanho as Tamanho) || 'M',
              tamanhoShort: (p.tamanhoShort as Tamanho) || '',
              observacoes: p.observacoes || '',
              isSaving: false,
              errors: {},
            }))
          );
        } else {
          // Inicializar com uma linha vazia padrão se não houver dados e não estiver finalizado
          if (data.pedido.status !== 'FINALIZADO') {
            setRows([createEmptyRow()]);
          }
        }
      }
    } catch (err: any) {
      setSyncError(err.message || 'Erro ao carregar dados do pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (token) loadData();
  }, [token]);

  // Auxiliar para criar linha vazia
  const createEmptyRow = (): LocalRow => {
    return {
      id: crypto.randomUUID(),
      nomeCompleto: '',
      nomeCamisa: '',
      numero: '',
      tamanho: 'M',
      tamanhoShort: '',
      observacoes: '',
      isSaving: false,
      errors: {},
    };
  };

  // Adicionar nova linha
  const handleAddRow = () => {
    if (pedido?.status === 'FINALIZADO') return;
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  // Excluir linha
  const handleDeleteRow = async (rowId: string) => {
    if (pedido?.status === 'FINALIZADO') return;
    
    const row = rows.find((r) => r.id === rowId);
    
    // Remover do estado local imediatamente
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setSelectedIds((prev) => prev.filter((id) => id !== rowId));

    // Se a linha já estava persistida no banco, chamar API de exclusão
    if (row?.dbId) {
      try {
        setLastSaved('Salvando alterações...');
        const response = await fetch(`/api/coleta/${token}/participantes/${row.dbId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error();
        updateSavedTime();
        recalculateSummary();
      } catch (err) {
        setSyncError('Erro ao salvar exclusão no servidor.');
      }
    }
  };

  // Excluir selecionados
  const handleDeleteSelected = async () => {
    if (pedido?.status === 'FINALIZADO' || selectedIds.length === 0) return;
    
    const remainingRows = rows.filter((r) => !selectedIds.includes(r.id));
    const rowsToDelete = rows.filter((r) => selectedIds.includes(r.id));

    setRows(remainingRows);
    setSelectedIds([]);

    // Deletar persistidos no banco
    setLastSaved('Excluindo linhas...');
    try {
      for (const row of rowsToDelete) {
        if (row.dbId) {
          await fetch(`/api/coleta/${token}/participantes/${row.dbId}`, {
            method: 'DELETE',
          });
        }
      }
      updateSavedTime();
      recalculateSummary();
    } catch (err) {
      setSyncError('Erro ao excluir linhas no servidor.');
    }
  };

  // Duplicar linha
  const handleDuplicateRow = async (rowId: string) => {
    if (pedido?.status === 'FINALIZADO') return;
    
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    const duplicated: LocalRow = {
      id: crypto.randomUUID(),
      nomeCompleto: row.nomeCompleto ? `${row.nomeCompleto} (Cópia)` : '',
      nomeCamisa: row.nomeCamisa ? `${row.nomeCamisa} COPIA` : '',
      numero: '', // não duplicar número para evitar erros imediatos
      tamanho: row.tamanho,
      tamanhoShort: row.tamanhoShort,
      observacoes: row.observacoes,
      isSaving: false,
      errors: {},
    };

    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      const newRows = [...prev];
      newRows.splice(idx + 1, 0, duplicated);
      return newRows;
    });

    // Salvar no banco automaticamente se tiver dados válidos mínimos
    if (duplicated.nomeCompleto && duplicated.nomeCamisa) {
      await saveRowToServer(duplicated);
    }
  };

  // Selecionar/Deselecionar linha
  const toggleSelectRow = (rowId: string) => {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Selecionar tudo
  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  };

  // Atualizar célula local
  const handleCellChange = (rowId: string, field: keyof LocalRow, value: string) => {
    if (pedido?.status === 'FINALIZADO') return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const updatedRow = { ...r, [field]: value };
          // Validar na digitação
          validateLocalRow(updatedRow);
          return updatedRow;
        }
        return r;
      })
    );

    // Debounce de auto-save
    debounceSave(rowId);
  };

  // Validação local
  const validateLocalRow = (row: LocalRow) => {
    const errors: LocalRow['errors'] = {};

    if (!row.nomeCompleto.trim()) {
      errors.nomeCompleto = 'Nome completo é obrigatório';
    }
    if (!row.nomeCamisa.trim()) {
      errors.nomeCamisa = 'Nome na camisa é obrigatório';
    }

    // Verificar número duplicado no estado local
    if (row.numero.trim()) {
      const count = rows.filter((r) => r.numero.trim() === row.numero.trim() && r.id !== row.id).length;
      if (count > 0) {
        errors.numero = 'Número duplicado';
      }
    }

    row.errors = errors;
  };

  // Ref espelhando rows para acesso dentro de timeouts (evita state stale)
  const rowsRef = React.useRef<LocalRow[]>([]);
  React.useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Ref para rastrear quais linhas estão sendo salvas (evita POSTs duplicados)
  const savingRowIds = React.useRef<Set<string>>(new Set());

  // Debounce Map para auto-save
  const debounceTimeoutMap = React.useRef<Record<string, NodeJS.Timeout>>({});

  const debounceSave = (rowId: string) => {
    if (debounceTimeoutMap.current[rowId]) {
      clearTimeout(debounceTimeoutMap.current[rowId]);
    }

    debounceTimeoutMap.current[rowId] = setTimeout(() => {
      // Usa rowsRef para obter o estado mais recente sem precisar de setRows como side-effect
      const row = rowsRef.current.find((r) => r.id === rowId);
      if (!row) return;
      validateLocalRow(row);
      // Só salva se não há erros, tem conteúdo mínimo, e não está sendo salvo já
      if (
        Object.keys(row.errors).length === 0 &&
        (row.nomeCompleto || row.nomeCamisa) &&
        !savingRowIds.current.has(rowId)
      ) {
        saveRowToServer(row);
      }
    }, 800);
  };

  // Salvar linha no servidor
  const saveRowToServer = async (row: LocalRow) => {
    // Evita envios duplicados para a mesma linha
    if (savingRowIds.current.has(row.id)) return;
    savingRowIds.current.add(row.id);

    setLastSaved('Salvando...');
    setSyncError(null);
    
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, isSaving: true } : r))
    );

    try {
      const isNew = !row.dbId;
      const url = isNew 
        ? `/api/coleta/${token}/participantes` 
        : `/api/coleta/${token}/participantes/${row.dbId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        nomeCompleto: row.nomeCompleto,
        nomeCamisa: row.nomeCamisa,
        numero: row.numero || null,
        tamanho: row.tamanho,
        tamanhoShort: row.tamanhoShort || null,
        observacoes: row.observacoes || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao sincronizar linha');
      }

      // IMPORTANTE: Atualiza apenas o dbId, preserva o id local original.
      // Mudar o id local causava o bug de duplicação pois debounces pendentes
      // não encontravam mais a linha e disparavam um segundo POST.
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, dbId: data.id, isSaving: false }
            : r
        )
      );

      updateSavedTime();
    } catch (err: any) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, isSaving: false } : r))
      );
      setSyncError(err.message || 'Erro ao sincronizar com o banco.');
    } finally {
      savingRowIds.current.delete(row.id);
    }
  };

  // Sincronizar grade simplificada (debounced)
  const syncGradeToServer = async (camisas: Record<Tamanho, number>, shorts: Record<Tamanho, number>) => {
    setLastSaved('Salvando...');
    setSyncError(null);

    try {
      const response = await fetch(`/api/coleta/${token}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camisas, shorts }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar grade');
      }

      updateSavedTime();

      // Atualizar o resumo localmente
      const totalCamisas = Object.values(camisas).reduce((a, b) => a + b, 0);
      const totalShorts = Object.values(shorts).reduce((a, b) => a + b, 0);
      const totalParticipants = Math.max(totalCamisas, totalShorts);

      const totalPorTamanho = TamanhosValidos.map((tamanho) => ({
        tamanho,
        quantidade: camisas[tamanho] || 0,
      }));

      const totalPorTamanhoShort = TamanhosValidos.map((tamanho) => ({
        tamanho,
        quantidade: shorts[tamanho] || 0,
      }));

      setResumo({
        totalParticipantes: totalParticipants,
        totalPorTamanho,
        totalPorTamanhoShort,
      });

    } catch (err: any) {
      setSyncError(err.message || 'Erro ao salvar alterações da grade.');
    }
  };

  // Debounce para salvamento de grade
  const gradeDebounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleGradeQtyChange = (type: 'camisas' | 'shorts', size: Tamanho, valStr: string) => {
    if (pedido?.status === 'FINALIZADO') return;

    const val = Math.max(0, parseInt(valStr) || 0);

    let updatedCamisas = { ...gradeCamisas };
    let updatedShorts = { ...gradeShorts };

    if (type === 'camisas') {
      updatedCamisas[size] = val;
      setGradeCamisas(updatedCamisas);
    } else {
      updatedShorts[size] = val;
      setGradeShorts(updatedShorts);
    }

    if (gradeDebounceTimeout.current) {
      clearTimeout(gradeDebounceTimeout.current);
    }

    gradeDebounceTimeout.current = setTimeout(() => {
      syncGradeToServer(updatedCamisas, updatedShorts);
    }, 850);
  };

  const updateSavedTime = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSaved(`Última atualização às ${timeStr}`);
  };

  // Recalcular resumo de tamanhos local (Nominal) - mantido para compatibilidade
  const recalculateSummary = React.useCallback(() => {
    const counts = TamanhosValidos.reduce((acc, t) => {
      acc[t] = 0;
      return acc;
    }, {} as Record<Tamanho, number>);

    const shortCounts = TamanhosValidos.reduce((acc, t) => {
      acc[t] = 0;
      return acc;
    }, {} as Record<Tamanho, number>);

    rowsRef.current.forEach((r) => {
      if (TamanhosValidos.includes(r.tamanho)) {
        counts[r.tamanho]++;
      }
      if (r.tamanhoShort && TamanhosValidos.includes(r.tamanhoShort)) {
        shortCounts[r.tamanhoShort]++;
      }
    });

    setResumo({
      totalParticipantes: rowsRef.current.length,
      totalPorTamanho: TamanhosValidos.map((tamanho) => ({ tamanho, quantidade: counts[tamanho] })),
      totalPorTamanhoShort: TamanhosValidos.map((tamanho) => ({ tamanho, quantidade: shortCounts[tamanho] })),
    });
  }, []);

  // Auto-recalcular resumo SEMPRE que rows mudar (resolve o bug de não atualizar ao digitar)
  React.useEffect(() => {
    if (!pedido || pedido.tipoColeta === 'GRADE') return;
    const counts: Record<string, number> = {};
    const shortCounts: Record<string, number> = {};
    TamanhosValidos.forEach((t) => { counts[t] = 0; shortCounts[t] = 0; });
    rows.forEach((r) => {
      if (r.tamanho && counts[r.tamanho] !== undefined) counts[r.tamanho]++;
      if (r.tamanhoShort && shortCounts[r.tamanhoShort] !== undefined) shortCounts[r.tamanhoShort]++;
    });
    setResumo({
      totalParticipantes: rows.length,
      totalPorTamanho: TamanhosValidos.map((t) => ({ tamanho: t, quantidade: counts[t] || 0 })),
      totalPorTamanhoShort: TamanhosValidos.map((t) => ({ tamanho: t, quantidade: shortCounts[t] || 0 })),
    });
  }, [rows, pedido]);

  // Atalhos de teclado no input (Nominal)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (pedido?.status === 'FINALIZADO') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      // Enter vai para a linha de baixo ou cria uma nova se for a última
      if (rowIndex === rows.length - 1) {
        handleAddRow();
      } else {
        const nextInput = document.querySelector(`input[data-row="${rowIndex + 1}"][data-field="${field}"]`) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  // Processar dados colados (Copy-Paste) do Excel
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (pedido?.status === 'FINALIZADO' || pedido?.tipoColeta === 'GRADE') return;
    
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    // Verificar se os dados são tabulares (separados por tabs \t ou quebras de linha \n)
    if (!pasteData.includes('\t') && !pasteData.includes('\n')) return;
    
    e.preventDefault();

    const lines = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');
    const newRows: LocalRow[] = [];

    for (const line of lines) {
      const cells = line.split('\t');
      
      // Mapeamento básico
      const nomeCompleto = cells[0]?.trim() || '';
      const nomeCamisa = cells[1]?.trim() || '';
      const numero = cells[2]?.trim() || '';
      let tamanhoStr = cells[3]?.trim().toUpperCase() || 'M';
      
      let tamanhoShortStr: Tamanho | '' = '';
      let observacoes = '';

      if (pedido?.tipoProduto === 'CONJUNTO') {
        tamanhoShortStr = (cells[4]?.trim().toUpperCase() as Tamanho) || '';
        observacoes = cells[5]?.trim() || '';
        if (tamanhoShortStr && !TamanhosValidos.includes(tamanhoShortStr)) {
          tamanhoShortStr = '';
        }
      } else {
        observacoes = cells[4]?.trim() || '';
      }

      // Normalizar tamanho
      if (!TamanhosValidos.includes(tamanhoStr as Tamanho)) {
        tamanhoStr = 'M'; // fallback
      }

      if (nomeCompleto || nomeCamisa) {
        newRows.push({
          id: crypto.randomUUID(),
          nomeCompleto,
          nomeCamisa,
          numero,
          tamanho: tamanhoStr as Tamanho,
          tamanhoShort: tamanhoShortStr,
          observacoes,
          isSaving: false,
          errors: {},
        });
      }
    }

    if (newRows.length === 0) return;

    // Adicionar novas linhas ao final da planilha
    setRows((prev) => {
      const cleaned = prev.filter((r) => r.nomeCompleto || r.nomeCamisa);
      return [...cleaned, ...newRows];
    });

    // Salvar em lote
    setLastSaved('Salvando linhas coladas...');
    try {
      for (const row of newRows) {
        await saveRowToServer(row);
      }
      updateSavedTime();
      recalculateSummary();
    } catch (err) {
      setSyncError('Erro ao salvar linhas coladas no servidor.');
    }
  };

  // Finalizar envio
  const handleFinalize = () => {
    if (pedido?.tipoColeta === 'GRADE') {
      setIsFinalizeOpen(true);
      return;
    }

    // Validar tudo antes de finalizar (Nominal)
    const invalidRows = rows.filter((r) => {
      validateLocalRow(r);
      return Object.keys(r.errors).length > 0;
    });

    if (invalidRows.length > 0) {
      setSyncError('Não é possível finalizar. Existem erros ou dados incompletos na tabela.');
      setRows([...rows]);
      return;
    }

    // Verificar duplicidade geral de números
    const numerosList = rows.map(r => r.numero.trim()).filter(n => n !== '');
    const hasDuplicates = numerosList.some((val, i) => numerosList.indexOf(val) !== i);
    if (hasDuplicates) {
      setSyncError('Não é possível finalizar. Existem números repetidos nas camisas.');
      return;
    }

    setIsFinalizeOpen(true);
  };

  const handleFinalizeConfirm = async () => {
    setIsFinalizing(true);
    setSyncError(null);
    try {
      const response = await fetch(`/api/coleta/${token}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Falha ao finalizar pedido.');
      
      setIsFinalizedSuccess(true);
      setIsFinalizeOpen(false);
      
      loadData();
    } catch (err: any) {
      setSyncError(err.message || 'Erro ao finalizar envio.');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-650" />
        <p className="text-sm text-slate-500">Acessando link seguro da malharia...</p>
      </div>
    );
  }

  if (syncError && !pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Link Inválido ou Expirado</h2>
        <p className="text-sm text-slate-500 max-w-md">
          {syncError} Por favor, verifique a URL ou solicite um novo link à malharia.
        </p>
      </div>
    );
  }

  const isLocked = pedido?.status === 'FINALIZADO';
  const isConjunto = pedido?.tipoProduto === 'CONJUNTO';
  const isGrade = pedido?.tipoColeta === 'GRADE';

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-900/90 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Botão de Tema no Topo Direito */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner do Pedido */}
        <div className="relative bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white">
                  <Scissors className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coleta Externa de Tamanhos</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">
                Pedido {pedido?.numeroPedido}
              </h1>
              <p className="text-sm text-slate-550 dark:text-slate-350">
                Cliente: <strong className="text-indigo-600 dark:text-indigo-400">{pedido?.cliente?.nome}</strong>
              </p>
              <p className="text-xs text-slate-450 dark:text-slate-450">
                Lote: {pedido?.descricao} ({isGrade ? 'Grade de Tamanhos' : 'Lista Nominal'} • {isConjunto ? 'Conjunto Camisa + Short' : 'Apenas Camisa'})
              </p>
            </div>

            {/* Status Visual */}
            <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isLocked 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30' 
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50'
              }`}>
                {isLocked ? 'Envio Concluído' : 'Aberto para Digitação'}
              </span>
              {lastSaved && (
                <span className="text-xs text-slate-450 font-medium">
                  {lastSaved}
                </span>
              )}
            </div>
          </div>
          
          {/* Mensagem de boas vindas */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-900 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-white text-xs">Instruções:</span>{' '}
              {isGrade ? (
                <span>Insira a quantidade total de camisas {isConjunto ? 'e de shorts' : ''} desejada para cada tamanho na grade abaixo.</span>
              ) : (
                <span>Insira o nome de cada pessoa, o nome para estampar na camisa, o número (se houver), e selecione o tamanho {isConjunto ? 'da camisa e do short' : ''}.</span>
              )}
              {isLocked ? (
                <span className="block text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-xs">Este formulário foi finalizado e está travado para a produção. Novas alterações não são permitidas.</span>
              ) : (
                !isGrade && <span className="block text-slate-400 text-xs mt-1">Você também pode colar dados diretamente do Excel!</span>
              )}
            </div>
          </div>
        </div>

        {/* Resumo de Peças Atual */}
        {resumo && (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total de Peças</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">
                    {resumo.totalParticipantes}
                  </span>
                  <span className="text-xs text-slate-400">de {pedido?.quantidadePrevista} previstas</span>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider">
                    {isConjunto ? 'Camisas Consolidadas' : 'Tamanhos Consolidados'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 sm:grid-cols-7 lg:grid-cols-10 gap-2">
                  {resumo.totalPorTamanho.map((t) => (
                    <div
                      key={t.tamanho}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        t.quantidade > 0
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-extrabold scale-[1.02]'
                          : 'bg-slate-50/30 dark:bg-slate-900/20 border-slate-100 dark:border-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider mb-1 truncate w-full text-center">{t.tamanho}</span>
                      <span className="text-sm">{t.quantidade}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Consolidado Shorts se for Conjunto */}
            {isConjunto && resumo.totalPorTamanhoShort && (
              <Card className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Shorts Consolidados
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 sm:grid-cols-7 lg:grid-cols-10 gap-2">
                  {resumo.totalPorTamanhoShort.map((t) => (
                    <div
                      key={`short-${t.tamanho}`}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        t.quantidade > 0
                          ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 font-extrabold scale-[1.02]'
                          : 'bg-slate-50/30 dark:bg-slate-900/20 border-slate-100 dark:border-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider mb-1 truncate w-full text-center">{t.tamanho}</span>
                      <span className="text-sm">{t.quantidade}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* MÓDULO 1: Coleta Simplificada por Grade */}
        {isGrade ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Grade de Camisas */}
            <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-lg rounded-3xl">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-900 flex flex-row items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/55 rounded-lg text-indigo-650">
                  <Shirt className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-white">Grade de Camisas</CardTitle>
                  <CardDescription className="text-slate-450">Insira a quantidade necessária para cada tamanho.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {syncError && (
                  <div className="p-3 mb-4 rounded-lg bg-destructive/15 text-destructive border border-destructive/20 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{syncError}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TamanhosValidos.map((size) => (
                    <div key={`camisa-qty-${size}`} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <Label className="font-bold text-slate-700 dark:text-slate-350">{size}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLocked || gradeCamisas[size] <= 0}
                          onClick={() => handleGradeQtyChange('camisas', size, String(gradeCamisas[size] - 1))}
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          disabled={isLocked}
                          value={gradeCamisas[size] || 0}
                          onChange={(e) => handleGradeQtyChange('camisas', size, e.target.value)}
                          className="h-8 w-16 text-center font-bold border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm bg-transparent"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLocked}
                          onClick={() => handleGradeQtyChange('camisas', size, String((gradeCamisas[size] || 0) + 1))}
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grade de Shorts (se Conjunto) */}
            {isConjunto ? (
              <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-lg rounded-3xl">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-900 flex flex-row items-center gap-3">
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/55 rounded-lg text-sky-600">
                    <Maximize2 className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 dark:text-white">Grade de Shorts</CardTitle>
                    <CardDescription className="text-slate-450">Insira a quantidade de shorts de cada tamanho.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {TamanhosValidos.map((size) => (
                      <div key={`short-qty-${size}`} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <Label className="font-bold text-slate-700 dark:text-slate-350">{size}</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isLocked || gradeShorts[size] <= 0}
                            onClick={() => handleGradeQtyChange('shorts', size, String(gradeShorts[size] - 1))}
                            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            disabled={isLocked}
                            value={gradeShorts[size] || 0}
                            onChange={(e) => handleGradeQtyChange('shorts', size, e.target.value)}
                            className="h-8 w-16 text-center font-bold border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm bg-transparent"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isLocked}
                            onClick={() => handleGradeQtyChange('shorts', size, String((gradeShorts[size] || 0) + 1))}
                            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center p-8 bg-indigo-50/10 dark:bg-indigo-950/10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                Este lote não necessita de grade de shorts (Apenas Camisa).
              </div>
            )}

            {/* Ação de Finalização da Grade */}
            {!isLocked && (
              <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs text-slate-400 font-medium">
                  Por favor, revise as quantidades acima antes de submeter à fábrica.
                </span>
                <Button
                  onClick={handleFinalize}
                  className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 px-6 shadow-lg cursor-pointer"
                >
                  Finalizar Envio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* MÓDULO 2: Tabela de Coleta Nominal */
          <Card className="border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-xl rounded-3xl overflow-hidden transition-colors duration-300">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Sheet className="h-5 w-5 text-indigo-500" />
                  Planilha de Preenchimento
                </CardTitle>
                <CardDescription className="text-slate-450">
                  Pressione TAB ou ENTER nas células para navegar e criar linhas. Digite e o sistema salvará automaticamente.
                </CardDescription>
              </div>

              {/* Ações da Tabela se não bloqueada */}
              {!isLocked && (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {selectedIds.length > 0 && (
                    <Button
                      onClick={handleDeleteSelected}
                      variant="destructive"
                      size="sm"
                      className="rounded-lg h-9 cursor-pointer"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" /> Excluir ({selectedIds.length})
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleAddRow}
                    size="sm"
                    className="rounded-lg h-9 bg-indigo-650 hover:bg-indigo-700 text-white font-medium cursor-pointer animate-pulse"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Nova Linha
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0" onPaste={handlePaste}>
              
              {/* Erros gerais de sincronização */}
              {syncError && (
                <div className="p-4 bg-destructive/15 border-b border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                    <TableRow>
                      {!isLocked && (
                        <TableHead className="w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === rows.length && rows.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-400">#</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-xs min-w-[200px]">Nome Completo *</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-xs min-w-[150px]">Nome na Camisa *</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-xs w-24 text-center">Número</TableHead>
                      
                      {/* Tamanhos da Camisa */}
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-xs w-32 text-center">Camisa *</TableHead>
                      
                      {/* Tamanho Short - sempre visível */}
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-xs w-32 text-center">Short</TableHead>
                      
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-350 text-xs min-w-[180px]">Observações</TableHead>
                      {!isLocked && <TableHead className="w-20"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isLocked ? 7 : 9} className="py-20 text-center text-slate-400 text-sm">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          Nenhum participante adicionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row, index) => (
                        <TableRow
                          key={row.id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors border-b border-slate-100 dark:border-slate-900 ${
                            Object.keys(row.errors).length > 0 ? 'bg-destructive/5' : ''
                          }`}
                        >
                          {!isLocked && (
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(row.id)}
                                onChange={() => toggleSelectRow(row.id)}
                                className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </TableCell>
                          )}
                          
                          <TableCell className="text-center text-xs font-mono text-slate-400 select-none">
                            {index + 1}
                          </TableCell>

                          {/* Nome Completo */}
                          <TableCell className="py-2">
                            <Input
                              data-row={index}
                              data-field="nomeCompleto"
                              value={row.nomeCompleto}
                              onChange={(e) => handleCellChange(row.id, 'nomeCompleto', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'nomeCompleto')}
                              disabled={isLocked}
                              placeholder="Ex: João da Silva"
                              className={`h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm bg-transparent ${
                                row.errors.nomeCompleto ? 'border-destructive focus-visible:ring-destructive' : ''
                              }`}
                            />
                          </TableCell>

                          {/* Nome na Camisa */}
                          <TableCell className="py-2">
                            <Input
                              data-row={index}
                              data-field="nomeCamisa"
                              value={row.nomeCamisa}
                              onChange={(e) => handleCellChange(row.id, 'nomeCamisa', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'nomeCamisa')}
                              disabled={isLocked}
                              placeholder="Ex: JOÃO SILVA"
                              className={`h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm font-semibold tracking-wide bg-transparent ${
                                row.errors.nomeCamisa ? 'border-destructive focus-visible:ring-destructive' : ''
                              }`}
                            />
                          </TableCell>

                          {/* Número */}
                          <TableCell className="py-2">
                            <Input
                              data-row={index}
                              data-field="numero"
                              value={row.numero}
                              onChange={(e) => handleCellChange(row.id, 'numero', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'numero')}
                              disabled={isLocked}
                              placeholder="-"
                              className={`h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm text-center font-bold bg-transparent ${
                                row.errors.numero ? 'border-destructive focus-visible:ring-destructive' : ''
                              }`}
                            />
                          </TableCell>

                          {/* Tamanho Camisa */}
                          <TableCell className="py-2 text-center">
                            {isLocked ? (
                              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-150 text-xs font-bold rounded-md">
                                {row.tamanho}
                              </span>
                            ) : (
                              <Select
                                value={row.tamanho}
                                onValueChange={(val) => {
                                  handleCellChange(row.id, 'tamanho', val || 'M');
                                  recalculateSummary();
                                }}
                              >
                                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 focus:ring-indigo-550 bg-transparent rounded-lg text-sm font-medium">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg max-h-56 overflow-y-auto">
                                  {TamanhosValidos.map((size) => (
                                    <SelectItem key={size} value={size} className="cursor-pointer text-sm">
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>

                          {/* Tamanho Short - sempre visível */}
                          <TableCell className="py-2 text-center">
                            {isLocked ? (
                              <span className="inline-block px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-150 text-xs font-bold rounded-md">
                                {row.tamanhoShort || '-'}
                              </span>
                            ) : (
                              <Select
                                value={row.tamanhoShort || ''}
                                onValueChange={(val) => {
                                  handleCellChange(row.id, 'tamanhoShort', val || '');
                                  recalculateSummary();
                                }}
                              >
                                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 focus:ring-sky-500 bg-transparent rounded-lg text-sm font-medium">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg max-h-56 overflow-y-auto">
                                  {TamanhosValidos.map((size) => (
                                    <SelectItem key={`short-${size}`} value={size} className="cursor-pointer text-sm">
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>

                          {/* Observações */}
                          <TableCell className="py-2">
                            <Input
                              data-row={index}
                              data-field="observacoes"
                              value={row.observacoes}
                              onChange={(e) => handleCellChange(row.id, 'observacoes', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'observacoes')}
                              disabled={isLocked}
                              placeholder="Manga curta..."
                              className="h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm bg-transparent"
                            />
                          </TableCell>

                          {/* Ações Individuais */}
                          {!isLocked && (
                            <TableCell className="py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {row.isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-650" />
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDuplicateRow(row.id)}
                                      className="h-8 w-8 text-slate-400 hover:text-slate-650 rounded-lg cursor-pointer"
                                      title="Duplicar Linha"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteRow(row.id)}
                                      className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                      title="Excluir Linha"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            
            {/* Rodapé de Envio / Finalização */}
            {!isLocked && rows.length > 0 && (
              <div className="p-6 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs text-slate-450 font-medium">
                  Por favor, verifique todos os dados antes de finalizar. O preenchimento é de responsabilidade do cliente.
                </span>
                <Button
                  onClick={handleFinalize}
                  className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 px-6 shadow-lg shadow-indigo-600/10 cursor-pointer animate-bounce"
                >
                  Finalizar Envio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        )}
        
        {/* Botão de "Nova Linha" proeminente adicional no final do painel para facilitar acesso */}
        {!isLocked && !isGrade && rows.length > 0 && (
          <div className="flex justify-center mt-2">
            <Button
              onClick={handleAddRow}
              className="rounded-xl border border-dashed border-indigo-400 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800/80 dark:hover:bg-indigo-950/20 px-10 py-5 cursor-pointer font-bold shadow-sm"
            >
              <Plus className="mr-2 h-5 w-5 animate-pulse" /> Adicionar Nova Linha
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Finalização / Resumo Geral */}
      <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-850 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Resumo e Finalização do Pedido
            </DialogTitle>
            <DialogDescription className="text-slate-550">
              Confirme o consolidado de peças solicitadas antes de travar o preenchimento.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-3">
                Total Geral de Peças
              </span>
              <span className="text-3xl font-black text-slate-800 dark:text-white">{resumo?.totalParticipantes}</span>
              <span className="text-sm text-slate-450 ml-2">unidades</span>
            </div>

            {/* Resumo de Camisas */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-450 block">
                {isConjunto ? 'Camisas por Tamanho' : 'Tamanhos Solicitados'}
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {resumo?.totalPorTamanho
                  .filter((t) => t.quantidade > 0)
                  .map((t) => (
                    <div
                      key={`resumo-camisa-${t.tamanho}`}
                      className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl text-center bg-indigo-50/10"
                    >
                      <span className="text-[10px] font-bold block text-slate-400 truncate uppercase">{t.tamanho}</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-white">{t.quantidade}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Resumo de Shorts se Conjunto */}
            {isConjunto && resumo?.totalPorTamanhoShort && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 block">
                  Shorts por Tamanho
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {resumo.totalPorTamanhoShort
                    .filter((t) => t.quantidade > 0)
                    .map((t) => (
                      <div
                        key={`resumo-short-${t.tamanho}`}
                        className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl text-center bg-sky-50/10"
                      >
                        <span className="text-[10px] font-bold block text-slate-400 truncate uppercase">{t.tamanho}</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">{t.quantidade}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/40 rounded-xl text-xs text-amber-700 dark:text-amber-450 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <strong>Confirma que todos os dados estão corretos?</strong> Ao confirmar, a planilha será bloqueada e você não poderá fazer novas alterações. Os dados serão enviados direto para o setor de corte e costura da malharia.
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsFinalizeOpen(false)}
              className="rounded-lg cursor-pointer"
              disabled={isFinalizing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleFinalizeConfirm}
              className="rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
              disabled={isFinalizing}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                'Sim, Confirmar Dados'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso */}
      <Dialog open={isFinalizedSuccess} onOpenChange={setIsFinalizedSuccess}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 animate-bounce" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-850 dark:text-white text-center">
              Envio Concluído!
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500">
              Obrigado! Os dados do seu pedido foram enviados com sucesso para a malharia.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-sm text-slate-650 dark:text-slate-350">
            A planilha foi trancada. Se precisar realizar alguma retificação crítica, por favor, entre em contato direto com a malharia.
          </div>

          <DialogFooter className="justify-center sm:justify-center">
            <Button
              onClick={() => setIsFinalizedSuccess(false)}
              className="w-full sm:w-auto rounded-lg bg-emerald-550 hover:bg-emerald-600 text-white cursor-pointer"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
