import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Phone, 
  Target, 
  Flame, 
  DollarSign, 
  FileText, 
  Compass, 
  CheckCircle2,
  Sparkles,
  Contact,
  Smartphone,
  Info
} from 'lucide-react';
import { Lead, LeadOrigem, LeadTemperatura } from '../../types';
import { formatWhatsAppNumber } from '../../lib/whatsappUtils';
import { isContactPickerSupported, isRunningInIframe, pickContactFromDevice } from '../../lib/contactPickerUtils';

interface NovoLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (leadData: Partial<Lead>) => void;
  leadToEdit?: Lead | null;
}

export const NovoLeadModal: React.FC<NovoLeadModalProps> = ({
  isOpen,
  onClose,
  onSaveLead,
  leadToEdit,
}) => {
  if (!isOpen) return null;

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [origem, setOrigem] = useState<LeadOrigem>('instagram');
  const [objetivo, setObjetivo] = useState('Emagrecimento & Definição');
  const [temperatura, setTemperatura] = useState<LeadTemperatura>('quente');
  const [valorEstimado, setValorEstimado] = useState('380');
  const [notas, setNotas] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isContactSupported, setIsContactSupported] = useState(false);
  const [isImportingContact, setIsImportingContact] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsContactSupported(isContactPickerSupported());
    setInIframe(isRunningInIframe());
  }, []);

  const handleImportContact = async () => {
    setContactFeedback(null);

    if (isRunningInIframe()) {
      setContactFeedback('A API de contatos é restrita no preview. Abra o app em uma aba separada no celular.');
      return;
    }

    if (!isContactPickerSupported()) {
      setContactFeedback('Acesso aos contatos disponível no Chrome em smartphones.');
      return;
    }

    setIsImportingContact(true);
    try {
      const contact = await pickContactFromDevice();
      if (contact) {
        if (contact.name) setNome(contact.name);
        if (contact.formattedTelefone) {
          setTelefone(contact.formattedTelefone);
        } else if (contact.telefone) {
          setTelefone(contact.telefone);
        }
        setContactFeedback(`Contato "${contact.name || 'selecionado'}" importado com sucesso!`);
        setTimeout(() => setContactFeedback(null), 4000);
      }
    } catch (err: any) {
      console.log('Seleção cancelada pelo usuário ou não suportada:', err);
      const msg = err?.message || '';
      if (msg.includes('top frame')) {
        setContactFeedback('A agenda só pode ser acessada na janela principal fora do preview.');
      }
    } finally {
      setIsImportingContact(false);
    }
  };

  useEffect(() => {
    if (leadToEdit) {
      setNome(leadToEdit.nome);
      setTelefone(leadToEdit.telefone);
      setEmail(leadToEdit.email || '');
      setOrigem(leadToEdit.origem || 'instagram');
      setObjetivo(leadToEdit.objetivo_interesse || 'Emagrecimento & Definição');
      setTemperatura(leadToEdit.temperatura || 'quente');
      setValorEstimado(leadToEdit.valor_estimado_plano ? String(leadToEdit.valor_estimado_plano) : '380');
      setNotas(leadToEdit.notas || '');
      setAvatarUrl(leadToEdit.avatar_url || '');
    } else {
      setNome('');
      setTelefone('');
      setEmail('');
      setOrigem('instagram');
      setObjetivo('Emagrecimento & Definição');
      setTemperatura('quente');
      setValorEstimado('380');
      setNotas('');
      setAvatarUrl('');
    }
  }, [leadToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) return;

    const formattedPhone = formatWhatsAppNumber(telefone);

    onSaveLead({
      nome: nome.trim(),
      telefone: formattedPhone,
      email: email.trim() || undefined,
      origem,
      objetivo_interesse: objetivo.trim(),
      temperatura,
      valor_estimado_plano: parseFloat(valorEstimado) || 350,
      notas: notas.trim() || undefined,
      avatar_url: avatarUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-emerald-500/25 bg-[#031d17] p-6 shadow-2xl shadow-emerald-950/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {leadToEdit ? 'Editar Lead / Possível Cliente' : 'Cadastrar Novo Lead (Prospecto)'}
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe o funil e envie desafios de degustação pelo WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Botão de Importação dos Contatos */}
        <div className="mb-4 p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-300">
                Preencher dados direto da agenda
              </span>
            </div>
            <button
              type="button"
              onClick={handleImportContact}
              disabled={isImportingContact}
              className="px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Contact className="h-3.5 w-3.5" />
              <span>{isImportingContact ? 'Lendo...' : 'Importar dos Contatos 📱'}</span>
            </button>
          </div>
          {contactFeedback && (
            <p className="mt-2 text-[11px] text-cyan-300 bg-cyan-950/60 p-2 rounded-lg border border-cyan-500/25 animate-in fade-in">
              {contactFeedback}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Nome do Possível Cliente <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mariana Vasconcelos"
              className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Telefone & Temperatura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-200">
                  WhatsApp / Celular <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  🇧🇷 +55
                </span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="tel"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-emerald-300/80 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                DDI +55 inserido automaticamente no envio
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Temperatura do Lead
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemperatura('quente')}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all border ${
                    temperatura === 'quente'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                      : 'bg-[#02140f] border-emerald-500/15 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  <span>Quente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemperatura('morno')}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all border ${
                    temperatura === 'morno'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-[#02140f] border-emerald-500/15 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Morno</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemperatura('frio')}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all border ${
                    temperatura === 'frio'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                      : 'bg-[#02140f] border-emerald-500/15 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>❄️ Frio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Origem & Valor Estimado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Origem do Contato
              </label>
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value as LeadOrigem)}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="instagram">📸 Instagram (Direct/Post/Reels)</option>
                <option value="indicacao">🤝 Indicação de Aluno</option>
                <option value="whatsapp">💬 WhatsApp Direto</option>
                <option value="presencial_academia">🏋️ Presencial na Academia</option>
                <option value="trafego_pago">🚀 Anúncio / Tráfego Pago</option>
                <option value="outro">🌐 Outro Canal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Valor Estimado do Plano (R$/mês)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="number"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value)}
                  placeholder="380"
                  className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Objetivo / Dor Principal */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Objetivo / Queixa Principal do Lead
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
              <input
                type="text"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ex: Emagrecimento, dor na lombar, voltar aos treinos..."
                className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Notas & Anotações de Follow-up
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex: Quer treinar 3x na semana pela manhã, mencionou que o cartão vira dia 25..."
              className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] p-3 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{leadToEdit ? 'Salvar Alterações' : 'Criar Lead no Funil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
