import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Ruler, 
  Target, 
  Dumbbell, 
  Calendar, 
  Sparkles, 
  Check, 
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  Contact,
  Smartphone,
  Info,
  Loader2,
  ExternalLink,
  Weight,
  FileText,
  Plus,
  Pencil,
  Tag
} from 'lucide-react';
import { Aluno, AlunoStatus } from '../../types';
import { formatWhatsAppNumber } from '../../lib/whatsappUtils';
import { isContactPickerSupported, isRunningInIframe, pickContactFromDevice } from '../../lib/contactPickerUtils';
import { supabase } from '../../lib/supabaseClient';

interface AlunoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  alunoToEdit?: Aluno | null;
  onSave: (alunoData: Omit<Aluno, 'id'> | Aluno) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

const DEFAULT_OBJETIVOS_PRESETS = [
  'Hipertrofia & Ganho de Força',
  'Emagrecimento & Definição',
  'Condicionamento Geral',
  'Saúde & Longevidade',
  'Reabilitação Lombar / Postura',
  'Mobilidade & Flexibilidade',
  'Performance Esportiva',
];

const PLANOS_PRESETS = [
  'Presencial VIP 3x/semana',
  'Presencial 2x/semana',
  'Consultoria Híbrida 4x/semana',
  'Consultoria Online'
];

export const AlunoFormModal: React.FC<AlunoFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  alunoToEdit,
  onSave,
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [alturaCm, setAlturaCm] = useState<string>('175');
  const [peso, setPeso] = useState<string>('');
  const [genero, setGenero] = useState<string>('Masculino');
  const [observacoes, setObservacoes] = useState<string>('');
  
  // Multi-select & Custom Tags para Objetivos
  const [availableObjetivos, setAvailableObjetivos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('radarmove_objetivos_tags');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_OBJETIVOS_PRESETS;
  });
  const [selectedObjetivos, setSelectedObjetivos] = useState<string[]>(['Hipertrofia & Ganho de Força']);
  const [newObjetivoInput, setNewObjetivoInput] = useState('');
  const [editingObjetivoIndex, setEditingObjetivoIndex] = useState<number | null>(null);
  const [editingObjetivoText, setEditingObjetivoText] = useState('');

  const [plano, setPlano] = useState('Presencial VIP 3x/semana');
  const [frequenciaSemanal, setFrequenciaSemanal] = useState(3);
  const [status, setStatus] = useState<AlunoStatus>('ativo');
  const [dataNascimento, setDataNascimento] = useState('1995-05-15');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successContactMsg, setSuccessContactMsg] = useState<string | null>(null);
  const [isContactSupported, setIsContactSupported] = useState(false);
  const [isImportingContact, setIsImportingContact] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Detecta se a Contact Picker API nativa é suportada pelo navegador e se está em iframe
  useEffect(() => {
    setIsContactSupported(isContactPickerSupported());
    setInIframe(isRunningInIframe());
  }, []);

  const handleImportContact = async () => {
    setErrorMsg(null);
    setSuccessContactMsg(null);

    // 1. Checagem de Iframe (A W3C Contacts API exige execução estrita no top frame)
    if (isRunningInIframe()) {
      setErrorMsg('A API de Contatos só funciona na janela principal (fora do preview). Abra o aplicativo em uma nova aba do navegador no celular para selecionar contatos da sua agenda.');
      return;
    }

    // 2. Checagem de suporte nativo
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      setErrorMsg('O seu navegador atual não suporta importação direta de contatos. Por favor, acesse pelo Chrome no smartphone ou digite os dados manualmente.');
      return;
    }

    setIsImportingContact(true);

    try {
      // 3. Consulta dinâmica das propriedades suportadas pela API
      let props: string[] = ['name', 'tel'];
      if (typeof (navigator as any).contacts.getProperties === 'function') {
        try {
          const supportedProperties: string[] = await (navigator as any).contacts.getProperties();
          const filtered: string[] = [];
          if (supportedProperties.includes('name')) filtered.push('name');
          if (supportedProperties.includes('tel')) filtered.push('tel');
          if (filtered.length > 0) {
            props = filtered;
          }
        } catch (propErr) {
          console.warn('Erro ao consultar supportedProperties:', propErr);
        }
      }

      // 4. Disparo do seletor nativo
      const contacts = await (navigator as any).contacts.select(props, { multiple: false });
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name[0]) {
          setNome(contact.name[0].trim());
        }
        if (contact.tel && contact.tel[0]) {
          // Remove caracteres não numéricos e formata
          const cleanPhone = contact.tel[0].replace(/\D/g, '');
          setTelefone(cleanPhone);
        }

        const contactName = (contact.name && contact.name[0]) || 'Selecionado';
        setSuccessContactMsg(`Contato "${contactName}" importado com sucesso!`);
        setTimeout(() => setSuccessContactMsg(null), 4000);
      }
    } catch (error: any) {
      console.error('Erro ao acessar contatos:', error);
      const errMsg = error?.message || '';

      if (errMsg.includes('top frame') || error?.name === 'SecurityError') {
        setErrorMsg('Acesso restrito pelo preview: a agenda só pode ser acessada no frame principal do navegador. Abra o app em uma aba separada no smartphone.');
      } else if (error?.name !== 'AbortError') {
        setErrorMsg('Seleção cancelada ou permissão não concedida. Você pode preencher os dados manualmente.');
      }
    } finally {
      setIsImportingContact(false);
    }
  };

  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione uma imagem válida (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('A imagem de perfil deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Persistir tags de objetivos customizadas no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('radarmove_objetivos_tags', JSON.stringify(availableObjetivos));
    } catch (e) {
      // ignore
    }
  }, [availableObjetivos]);

  const handleToggleObjetivo = (item: string) => {
    setSelectedObjetivos((prev) =>
      prev.includes(item)
        ? prev.filter((o) => o !== item)
        : [...prev, item]
    );
  };

  const handleAddNewObjetivo = () => {
    const trimmed = newObjetivoInput.trim();
    if (!trimmed) return;
    if (!availableObjetivos.includes(trimmed)) {
      setAvailableObjetivos((prev) => [...prev, trimmed]);
    }
    if (!selectedObjetivos.includes(trimmed)) {
      setSelectedObjetivos((prev) => [...prev, trimmed]);
    }
    setNewObjetivoInput('');
  };

  const handleStartEditObjetivo = (index: number, val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingObjetivoIndex(index);
    setEditingObjetivoText(val);
  };

  const handleSaveEditObjetivo = (oldVal: string) => {
    const trimmed = editingObjetivoText.trim();
    if (!trimmed) {
      setEditingObjetivoIndex(null);
      return;
    }
    setAvailableObjetivos((prev) => prev.map((o) => (o === oldVal ? trimmed : o)));
    setSelectedObjetivos((prev) => prev.map((o) => (o === oldVal ? trimmed : o)));
    setEditingObjetivoIndex(null);
  };

  const handleDeleteObjetivo = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvailableObjetivos((prev) => prev.filter((o) => o !== item));
    setSelectedObjetivos((prev) => prev.filter((o) => o !== item));
  };

  // Sync state when opening in edit mode or create mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && alunoToEdit) {
        setNome(alunoToEdit.nome);
        // Normalize phone for input display
        let rawTel = (alunoToEdit.telefone || '').replace(/\D/g, '');
        if ((rawTel.length === 12 || rawTel.length === 13) && rawTel.startsWith('55')) {
          rawTel = rawTel.substring(2);
        }
        if (rawTel.length === 10) {
          setTelefone(`(${rawTel.substring(0, 2)}) ${rawTel.substring(2, 6)}-${rawTel.substring(6)}`);
        } else if (rawTel.length === 11) {
          setTelefone(`(${rawTel.substring(0, 2)}) ${rawTel.substring(2, 7)}-${rawTel.substring(7)}`);
        } else {
          setTelefone(alunoToEdit.telefone);
        }
        setAlturaCm(alunoToEdit.altura_cm ? String(alunoToEdit.altura_cm) : '175');
        setPeso(alunoToEdit.peso !== undefined && alunoToEdit.peso !== null ? String(alunoToEdit.peso) : '');
        setGenero(alunoToEdit.genero || 'Masculino');
        setObservacoes(alunoToEdit.observacoes || '');

        // Carrega objetivos múltiplos
        let initialObjs: string[] = [];
        if (alunoToEdit.objetivos && Array.isArray(alunoToEdit.objetivos) && alunoToEdit.objetivos.length > 0) {
          initialObjs = alunoToEdit.objetivos;
        } else if (alunoToEdit.objetivo) {
          initialObjs = alunoToEdit.objetivo.split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          initialObjs = ['Hipertrofia & Ganho de Força'];
        }
        setSelectedObjetivos(initialObjs);
        setAvailableObjetivos((prev) => {
          const combined = [...prev];
          initialObjs.forEach((o) => {
            if (!combined.includes(o)) combined.push(o);
          });
          return combined;
        });

        setPlano(alunoToEdit.plano || 'Presencial VIP 3x/semana');
        setFrequenciaSemanal(alunoToEdit.frequencia_semanal || 3);
        setStatus(alunoToEdit.status || 'ativo');
        setDataNascimento(alunoToEdit.data_nascimento || '1995-05-15');
        setAvatarUrl(alunoToEdit.avatar_url || (alunoToEdit as any).foto_url || '');
      } else {
        // Reset for new creation
        setNome('');
        setTelefone('');
        setAlturaCm('175');
        setPeso('');
        setGenero('Masculino');
        setObservacoes('');
        setSelectedObjetivos(['Hipertrofia & Ganho de Força']);
        setNewObjetivoInput('');
        setEditingObjetivoIndex(null);
        setPlano('Presencial VIP 3x/semana');
        setFrequenciaSemanal(3);
        setStatus('ativo');
        setDataNascimento('1996-08-20');
        setAvatarUrl(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
      }
      setErrorMsg(null);
    }
  }, [isOpen, mode, alunoToEdit]);

  if (!isOpen) return null;

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);

    if (val.length <= 2) {
      setTelefone(val ? `(${val}` : '');
    } else if (val.length <= 7) {
      setTelefone(`(${val.substring(0, 2)}) ${val.substring(2)}`);
    } else {
      setTelefone(`(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`);
    }
  };

  const handleAlturaChange = (raw: string) => {
    // If user types with comma or dot, convert e.g. 1,75 to 175
    if (raw.includes(',') || raw.includes('.')) {
      const parsed = parseFloat(raw.replace(',', '.'));
      if (parsed > 0 && parsed < 3) {
        setAlturaCm(String(Math.round(parsed * 100)));
        return;
      }
    }
    const clean = raw.replace(/[^\d]/g, '');
    setAlturaCm(clean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('Por favor, informe o nome completo do aluno.');
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Informe um telefone/WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    const alturaNum = parseInt(alturaCm, 10) || 175;
    const phoneFormatted = formatWhatsAppNumber(telefone);
    const finalObjetivos = selectedObjetivos.length > 0 ? selectedObjetivos : ['Hipertrofia & Ganho de Força'];
    const finalObjetivoStr = finalObjetivos.join(', ');

    setIsSubmitting(true);
    setErrorMsg(null);

    (async () => {
      try {
        // Obter usuário autenticado da sessão atual no Supabase
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || (supabase.auth as any).session?.()?.user?.id;

        if (mode === 'create') {
          if (!user && !currentUserId) {
            throw new Error('Usuário não autenticado. Faça login para cadastrar novos alunos.');
          }

          const profissionalId = user?.id || currentUserId;

          // Inserção no Supabase com profissional_id explícito e colunas adicionais
          const insertPayload: Record<string, any> = {
            nome: nome.trim(),
            telefone: phoneFormatted,
            altura: alturaNum ? Number(alturaNum) : null,
            objetivo: finalObjetivoStr,
            objetivos: finalObjetivos,
            status,
            plano,
            profissional_id: profissionalId,
          };
          if (dataNascimento) insertPayload.data_nascimento = dataNascimento;
          if (peso && !isNaN(Number(peso))) insertPayload.peso = Number(peso);
          if (genero) insertPayload.genero = genero;
          if (observacoes.trim()) insertPayload.observacoes = observacoes.trim();
          if (avatarUrl.trim()) {
            insertPayload.avatar_url = avatarUrl.trim();
            insertPayload.foto_url = avatarUrl.trim();
          }

          let { data: insertedData, error: insertError } = await supabase
            .from('alunos')
            .insert([insertPayload])
            .select()
            .single();

          // Se alguma coluna ainda não foi criada no Supabase (cache de schema desatualizado ou migration pendente)
          if (insertError && (insertError.message?.includes('column') || insertError.message?.includes('schema cache'))) {
            console.warn("Coluna não encontrada no cache do Supabase. Executando fallback seguro...", insertError.message);
            const safePayload: Record<string, any> = {
              nome: nome.trim(),
              telefone: phoneFormatted,
              altura: alturaNum ? Number(alturaNum) : null,
              objetivo: finalObjetivoStr,
              status: 'ativo',
              profissional_id: profissionalId,
            };
            if (!insertError.message?.includes('objetivos')) {
              safePayload.objetivos = finalObjetivos;
            }
            const retryResult = await supabase
              .from('alunos')
              .insert([safePayload])
              .select()
              .single();

            if (!retryResult.error) {
              insertedData = retryResult.data;
              insertError = null;
            } else {
              insertError = retryResult.error;
            }
          }

          if (insertError) {
            console.error('Erro ao inserir aluno no Supabase:', insertError);
            throw new Error(insertError.message || 'Falha ao salvar aluno no banco de dados');
          }

          const alunoCriado: Aluno = {
            id: insertedData?.id || `aluno-${Date.now()}`,
            profissional_id: profissionalId,
            nome: insertedData?.nome || nome.trim(),
            telefone: insertedData?.telefone || phoneFormatted,
            altura_cm: alturaNum,
            peso: peso && !isNaN(Number(peso)) ? Number(peso) : (insertedData?.peso ? Number(insertedData.peso) : undefined),
            genero: genero || insertedData?.genero || undefined,
            observacoes: observacoes.trim() || insertedData?.observacoes || undefined,
            objetivo: insertedData?.objetivo || finalObjetivoStr,
            objetivos: Array.isArray(insertedData?.objetivos) && insertedData.objetivos.length > 0 ? insertedData.objetivos : finalObjetivos,
            plano,
            frequencia_semanal: frequenciaSemanal,
            status: (insertedData?.status as AlunoStatus) || 'ativo',
            dias_sem_treino: 0,
            ultimo_checkin: new Date().toISOString().split('T')[0],
            data_nascimento: insertedData?.data_nascimento || dataNascimento,
            avatar_url: insertedData?.foto_url || insertedData?.avatar_url || avatarUrl.trim() || undefined,
          };

          onSave(alunoCriado);
          onClose();
        } else if (mode === 'edit' && alunoToEdit) {
          const updated: Aluno = {
            ...alunoToEdit,
            nome: nome.trim(),
            telefone: phoneFormatted,
            altura_cm: alturaNum,
            peso: peso && !isNaN(Number(peso)) ? Number(peso) : undefined,
            genero: genero || undefined,
            observacoes: observacoes.trim() || undefined,
            objetivo: finalObjetivoStr,
            objetivos: finalObjetivos,
            plano,
            frequencia_semanal: frequenciaSemanal,
            status,
            data_nascimento: dataNascimento,
            avatar_url: avatarUrl.trim() || undefined,
          };

          if (currentUserId) {
            const updatePayload: Record<string, any> = {
              nome: nome.trim(),
              telefone: phoneFormatted,
              altura: alturaNum ? Number(alturaNum) : null,
              objetivo: finalObjetivoStr,
              objetivos: finalObjetivos,
              status,
              plano,
              data_nascimento: dataNascimento,
            };
            if (avatarUrl.trim()) {
              updatePayload.avatar_url = avatarUrl.trim();
              updatePayload.foto_url = avatarUrl.trim();
            } else {
              updatePayload.avatar_url = null;
              updatePayload.foto_url = null;
            }
            if (peso && !isNaN(Number(peso))) updatePayload.peso = Number(peso);
            if (genero) updatePayload.genero = genero;
            if (observacoes.trim()) updatePayload.observacoes = observacoes.trim();

            let { error: updateError } = await supabase
              .from('alunos')
              .update(updatePayload)
              .eq('id', alunoToEdit.id)
              .eq('profissional_id', currentUserId);

            if (updateError && (updateError.message?.includes('column') || updateError.message?.includes('schema cache'))) {
              const safeUpdate: Record<string, any> = {
                nome: nome.trim(),
                telefone: phoneFormatted,
                altura: alturaNum ? Number(alturaNum) : null,
                objetivo: finalObjetivoStr,
                status,
                avatar_url: avatarUrl.trim() || null,
              };
              if (!updateError.message?.includes('objetivos')) {
                safeUpdate.objetivos = finalObjetivos;
              }
              const retryUpdate = await supabase
                .from('alunos')
                .update(safeUpdate)
                .eq('id', alunoToEdit.id)
                .eq('profissional_id', currentUserId);
              updateError = retryUpdate.error;
            }

            if (updateError) {
              console.error('Erro ao atualizar aluno no Supabase:', updateError);
              throw new Error(updateError.message || 'Falha ao atualizar dados do aluno');
            }
          }

          onSave(updated);
          onClose();
        }
      } catch (err: any) {
        console.error('Erro na operação com Supabase:', err);
        setErrorMsg(err.message || 'Erro inesperado ao salvar no Supabase.');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-emerald-500/30 bg-[#031d17] p-6 text-slate-100 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-emerald-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <User className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-extrabold text-white">
                {mode === 'create' ? 'Adicionar Novo Cliente' : 'Editar Dados do Aluno'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'create'
                ? 'Preenchimento rápido e simples para começar a acompanhar a evolução.'
                : 'Atualize informações cadastrais, metas e frequência semanal.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successContactMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successContactMsg}</span>
          </div>
        )}

        {/* Botão de Ação: Importar dos Contatos Nativo */}
        <div className="mt-4 p-3 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 to-emerald-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Agilidade no Cadastro</span>
                {isContactSupported && !inIframe ? (
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                    Disponível no seu aparelho
                  </span>
                ) : inIframe ? (
                  <span className="text-[10px] font-medium text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded flex items-center gap-1 border border-amber-500/30">
                    <Info className="h-3 w-3" /> Modo Preview (Iframe)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-1.5 py-0.2 rounded flex items-center gap-1">
                    <Info className="h-3 w-3" /> Mobile Chrome/Android
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {inIframe
                  ? 'No preview embutido os navegadores bloqueiam a agenda. Abra em aba direta ou preencha manualmente.'
                  : 'Puxe o Nome e o WhatsApp do aluno direto da agenda do seu smartphone com 1 toque.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {inIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir aplicativo em uma nova aba completa para permitir o uso da agenda"
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Abrir em Nova Aba</span>
              </a>
            )}

            <button
              type="button"
              id="btn-import-contacts"
              onClick={handleImportContact}
              disabled={isImportingContact}
              title={
                inIframe
                  ? 'A Contacts API requer execução no top frame (fora do iframe do preview). Clique em "Abrir em Nova Aba" ou preencha manualmente.'
                  : isContactSupported
                  ? 'Abrir agenda do celular para selecionar o contato'
                  : 'A Contact Picker API nativa funciona no Chrome em smartphones.'
              }
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
                isContactSupported && !inIframe
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-cyan-500/20'
                  : 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-400/60'
              } ${isImportingContact ? 'opacity-75 cursor-wait' : ''}`}
            >
              {isImportingContact ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-300 shrink-0" />
              ) : (
                <Contact className="h-4 w-4 shrink-0" />
              )}
              <span>{isImportingContact ? 'Abrindo agenda...' : 'Importar dos Contatos 📱'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Nome do Cliente / Aluno <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo de Oliveira"
                autoFocus
                required
                className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Telefone WhatsApp & Altura em cm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-200">
                  WhatsApp / Celular <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  🇧🇷 +55 (Brasil)
                </span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  required
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-emerald-300/80 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                Código do país (+55) incluído automaticamente para o WhatsApp
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-cyan-300">
                  Altura em cm (sem vírgula)
                </label>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                  Ex: 178 cm
                </span>
              </div>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                <input
                  type="text"
                  value={alturaCm}
                  onChange={(e) => handleAlturaChange(e.target.value)}
                  placeholder="175"
                  className="w-full rounded-xl border border-cyan-400/35 bg-[#02130e] pl-9 pr-12 py-2.5 text-sm font-bold text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-400">
                  cm
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Calcula o IMC e proporções da bioimpedância automaticamente
              </span>
            </div>
          </div>

          {/* Objetivos do Aluno (Multi-Select & Custom Tags) */}
          <div className="rounded-2xl border border-emerald-500/25 bg-[#02140f] p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <label className="text-xs font-bold text-slate-200">
                  Objetivos do Aluno
                </label>
                <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                  {selectedObjetivos.length} {selectedObjetivos.length === 1 ? 'selecionado' : 'selecionados'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Selecione múltiplos objetivos
              </span>
            </div>

            {/* Input para criar novo objetivo personalizado */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={newObjetivoInput}
                  onChange={(e) => setNewObjetivoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewObjetivo();
                    }
                  }}
                  placeholder="Criar novo objetivo personalizado..."
                  className="w-full rounded-xl border border-emerald-500/20 bg-[#010e0a] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNewObjetivo}
                disabled={!newObjetivoInput.trim()}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all shrink-0 shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>

            {/* Lista de tags interativas */}
            <div className="flex flex-wrap gap-2 pt-1">
              {availableObjetivos.map((item, idx) => {
                const isSelected = selectedObjetivos.includes(item);
                const isEditing = editingObjetivoIndex === idx;

                if (isEditing) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#022419] border border-cyan-400 shadow-sm"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingObjetivoText}
                        onChange={(e) => setEditingObjetivoText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEditObjetivo(item);
                          } else if (e.key === 'Escape') {
                            setEditingObjetivoIndex(null);
                          }
                        }}
                        className="bg-transparent text-xs font-semibold text-white outline-none w-36"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditObjetivo(item)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                        title="Salvar alteração"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingObjetivoIndex(null)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Cancelar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleObjetivo(item)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 border-2 border-cyan-400 shadow-sm shadow-cyan-500/10'
                        : 'bg-[#021813] text-slate-400 hover:text-slate-200 border border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-cyan-300 stroke-[3]" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors" />
                      )}
                      {item}
                    </span>

                    {/* Botões de Ação (Editar e Excluir Tag) */}
                    <div className="flex items-center gap-0.5 ml-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleStartEditObjetivo(idx, item, e)}
                        className="p-0.5 text-slate-400 hover:text-cyan-300 rounded"
                        title="Editar nome desta tag"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteObjetivo(item, e)}
                        className="p-0.5 text-slate-400 hover:text-rose-400 rounded"
                        title="Excluir tag"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedObjetivos.length === 0 && (
              <p className="text-[11px] text-amber-300/90 mt-2.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />
                Selecione pelo menos um objetivo para orientar o plano de treino.
              </p>
            )}
          </div>

          {/* Plano e Frequência Semanal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Plano de Atendimento
              </label>
              <div className="relative mb-2">
                <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  value={plano}
                  onChange={(e) => setPlano(e.target.value)}
                  placeholder="Ex: Presencial VIP 3x/semana"
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PLANOS_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlano(p)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      plano === p
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#021813] text-slate-400 hover:text-slate-200 border border-emerald-500/15'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Frequência / Semana
              </label>
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-[#02130e] p-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFrequenciaSemanal(num)}
                    className={`h-8 w-8 rounded-lg font-extrabold text-xs transition-all ${
                      frequenciaSemanal === num
                        ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block text-center">
                Meta de assiduidade
              </span>
            </div>
          </div>

          {/* Status (Edit mode or advance settings) & Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Status de Retenção
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('ativo')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === 'ativo'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#02130e] text-slate-400 border-emerald-500/15'
                  }`}
                >
                  🟢 Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('em_risco')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === 'em_risco'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-[#02130e] text-slate-400 border-emerald-500/15'
                  }`}
                >
                  🔴 Em Risco
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inativo')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === 'inativo'
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/50'
                      : 'bg-[#02130e] text-slate-400 border-emerald-500/15'
                  }`}
                >
                  ⚪ Inativo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Peso Atual e Gênero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-200">
                  Peso Atual (kg)
                </label>
                <span className="text-[10px] text-slate-400">Opcional</span>
              </div>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 75.5"
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-400">
                  kg
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-200">
                  Gênero
                </label>
                <span className="text-[10px] text-slate-400">Opcional</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Masculino', 'Feminino', 'Outro'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenero(g)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      genero === g
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm'
                        : 'bg-[#02130e] text-slate-400 border-emerald-500/15 hover:border-emerald-500/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Observações / Metas Clínicas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-200">
                Observações Clínicas / Restrições
              </label>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-emerald-400" />
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Histórico de lesão no ombro, prefere treinar pela manhã..."
                rows={2}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Avatar / Foto do Aluno com Upload de Arquivo */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Foto / Avatar do Perfil
            </label>

            {/* Dropzone & Preview Box */}
            <div className="rounded-2xl border border-emerald-500/25 bg-[#02140f] p-3.5 mb-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Visual Avatar Preview */}
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-cyan-400/50 bg-[#010e0a] flex-shrink-0 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar prévia" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-slate-500" />
                  )}
                  {avatarUrl && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-[9px] font-bold text-center text-cyan-300">
                      Atual
                    </div>
                  )}
                </div>

                {/* Upload Action Area */}
                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(true);
                    }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleAvatarFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className={`p-3 rounded-xl border border-dashed transition-all cursor-pointer ${
                      isDraggingAvatar
                        ? 'border-cyan-400 bg-cyan-500/15'
                        : 'border-cyan-400/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-400'
                    }`}
                  >
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Camera className="h-4 w-4 text-cyan-300" />
                      <span className="text-xs font-bold text-white">
                        Fazer upload de foto do computador ou celular
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Arraste e solte uma imagem aqui ou clique para selecionar (JPG, PNG, WebP)
                    </p>
                  </div>

                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleAvatarFile(e.target.files[0]);
                      }
                    }}
                  />

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remover foto do perfil
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Presets and URL Fallback */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Ou escolha um avatar predefinido / insira um link:
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative h-9 w-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === url
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                          : 'border-emerald-500/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 w-full">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Ou cole a URL da imagem..."
                    className="w-full rounded-xl border border-emerald-500/20 bg-[#02130e] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-[#02140f] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-aluno-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando no banco...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{mode === 'create' ? 'Cadastrar Aluno' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
