import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldCheck, Zap, Server, Settings, RefreshCw, Smartphone, Key, Globe } from 'lucide-react';
import { WhatsAppGatewayConfig } from '../../types';
import { salvarConfiguracaoWhatsApp, obterStatusGateway } from '../../lib/agendamentoWhatsAppService';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [provedor, setProvedor] = useState<'automatico' | 'evolution_api' | 'zapi' | 'meta_cloud' | 'custom_webhook'>('automatico');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instancia, setInstancia] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      obterStatusGateway().then((st: any) => {
        if (st?.config) {
          setProvedor(st.config.provedor || 'automatico');
          setInstancia(st.config.instancia || '');
        }
      });
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const config: WhatsAppGatewayConfig = {
      provedor,
      apiUrl: apiUrl.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
      instancia: instancia.trim() || undefined,
      ativo: true,
    };

    const ok = await salvarConfiguracaoWhatsApp(config);
    setSaving(false);

    if (ok) {
      setStatusMsg({ type: 'success', text: 'Configuração do WhatsApp salva com sucesso no servidor!' });
      if (onSaved) onSaved();
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1400);
    } else {
      setStatusMsg({ type: 'error', text: 'Erro ao salvar configurações no servidor.' });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setTesting(false);
      setStatusMsg({
        type: 'success',
        text: `Conexão validada! Provedor ativo: ${data.provedor}. Worker em execução.`,
      });
    } catch (e: any) {
      setTesting(false);
      setStatusMsg({ type: 'error', text: 'Falha ao testar conexão com o servidor.' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#02241b] p-6 shadow-2xl text-zinc-100 z-10"
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Configurar API do WhatsApp
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Server-Side
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Envio 100% no piloto automático pelo servidor (sem WhatsApp Web)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {statusMsg && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                statusMsg.type === 'success'
                  ? 'border border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                  : 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <ShieldCheck className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Escolha de Provedor */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Motor de Envio / Provedor WhatsApp
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvedor('automatico')}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    provedor === 'automatico'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-emerald-500/20 bg-[#011a14] text-slate-400 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-0.5">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Nativo RadarMove</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Piloto automático integrado com verificação direta.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvedor('evolution_api')}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    provedor === 'evolution_api'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-emerald-500/20 bg-[#011a14] text-slate-400 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300 mb-0.5">
                    <Server className="h-3.5 w-3.5" />
                    <span>Evolution API</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Instância própria auto-hospedada (Node / Docker).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvedor('zapi')}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    provedor === 'zapi'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-emerald-500/20 bg-[#011a14] text-slate-400 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-0.5">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Z-API</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    API de WhatsApp com token e instância.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvedor('meta_cloud')}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    provedor === 'meta_cloud'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-emerald-500/20 bg-[#011a14] text-slate-400 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-0.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Meta Cloud API</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    API oficial do WhatsApp Business / Meta.
                  </span>
                </button>
              </div>
            </div>

            {/* Campos caso escolha Evolution API, Z-API ou Meta Cloud */}
            {provedor !== 'automatico' && (
              <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-[#011a14] p-3 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    URL da API do Gateway
                  </label>
                  <input
                    type="url"
                    placeholder={
                      provedor === 'evolution_api'
                        ? 'https://api.seuservidor.com'
                        : provedor === 'zapi'
                        ? 'https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN'
                        : 'https://graph.facebook.com/v19.0/SEU_PHONE_ID/messages'
                    }
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full rounded-lg border border-emerald-500/30 bg-[#02241b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Key className="h-3 w-3 text-cyan-400" />
                      Token / API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Chave secreta de autenticação"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full rounded-lg border border-emerald-500/30 bg-[#02241b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nome da Instância (se houver)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: radarmove-bot"
                      value={instancia}
                      onChange={(e) => setInstancia(e.target.value)}
                      className="w-full rounded-lg border border-emerald-500/30 bg-[#02241b] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Explicação de funcionamento */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-[11px] text-emerald-200/90 leading-relaxed">
              <div className="font-bold text-emerald-300 mb-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Como funciona o Piloto Automático:
              </div>
              O servidor do RadarMove executa um processo contínuo (worker) que consulta os agendamentos pendentes. Ao atingir a data e hora marcada, o envio é realizado diretamente pela API sem abrir abas do navegador e sem exigir ação do treinador.
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-[#011a14] px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Testar Conexão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
