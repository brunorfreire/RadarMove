import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  Github, 
  Key, 
  Layers,
  ArrowRight,
  Server
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabaseClient';

export const SupabaseConnectionView: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    totalTemplates?: number;
  }>({
    tested: false,
    connected: isSupabaseConfigured(),
    message: isSupabaseConfigured() 
      ? 'Chaves detectadas no ambiente. Clique em Testar Conexão para validar.' 
      : 'Modo Demonstração (Mock). Configure o arquivo .env com suas chaves do Supabase.',
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await testSupabaseConnection();
    setConnectionStatus({
      tested: true,
      connected: result.connected,
      message: result.message,
      totalTemplates: result.totalTemplates,
    });
    setTesting(false);
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      handleTestConnection();
    }
  }, []);

  const gitCommands = `# 1. Inicialize o repositório git (se ainda não o fez)
git init

# 2. Adicione todos os arquivos
git add .

# 3. Faça o commit inicial
git commit -m "feat: RadarMove v1.0.0 com integração Supabase e Biblioteca Nativa"

# 4. Renomeie a branch para main
git branch -M main

# 5. Adicione seu repositório remoto do GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# 6. Envie para o GitHub
git push -u origin main`;

  const envSample = `VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"`;

  return (
    <div id="supabase-connection-view" className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-[#032019] via-[#042820] to-[#021813] p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Conexão Supabase & Publicação GitHub
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  connectionStatus.connected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {connectionStatus.connected ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Conectado ao Supabase
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Modo Demonstração (Mock)
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
                Conecte seu banco PostgreSQL multi-tenant no Supabase e publique o código-fonte no seu novo repositório GitHub com isolamento por RLS.
              </p>
            </div>
          </div>

          <button
            id="btn-testar-conexao-supabase"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testando Conexão...' : 'Testar Conexão Supabase'}</span>
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
          connectionStatus.connected 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
            : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
        }`}>
          {connectionStatus.connected ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{connectionStatus.message}</p>
            {connectionStatus.totalTemplates !== undefined && (
              <p className="text-[11px] opacity-90 mt-0.5">
                Templates de desafios disponíveis no banco remoto: <strong>{connectionStatus.totalTemplates}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Colunas (Passos Supabase vs Passos GitHub) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Conexão Supabase */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-5 md:p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-emerald-500/15 pb-3">
            <Server className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Etapa 1: Conectar com o Supabase</h3>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            {/* Passo 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-bold">1</span>
                <span>Rodar o Schema e Seeds no Supabase</span>
              </div>
              <p className="text-slate-400 pl-7">
                No painel do Supabase, acesse <strong>SQL Editor</strong> e execute os arquivos:
              </p>
              <div className="pl-7 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#02140f] border border-emerald-500/15">
                  <span className="text-cyan-300">/supabase/schema.sql</span>
                  <span className="text-slate-500">Tabelas e RLS</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#02140f] border border-emerald-500/15">
                  <span className="text-emerald-300">/supabase/seed_desafios_nativos.sql</span>
                  <span className="text-slate-500">10 Desafios Globais</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#02140f] border border-emerald-500/15">
                  <span className="text-teal-300">/supabase/seed_templates_complementares_14.sql</span>
                  <span className="text-slate-500">14 Cards por Categoria</span>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-bold">2</span>
                <span>Copiar chaves do Projeto</span>
              </div>
              <p className="text-slate-400 pl-7">
                Vá em <strong>Project Settings &gt; API</strong> e copie a <code>Project URL</code> e a <code>anon / public key</code>.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-bold">3</span>
                  <span>Salvar no arquivo .env</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(envSample, 'env')}
                  className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  {copiedKey === 'env' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'env' ? 'Copiado!' : 'Copiar formato'}</span>
                </button>
              </div>
              <div className="pl-7">
                <pre className="p-3 rounded-xl bg-[#02140f] border border-emerald-500/20 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {envSample}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Abrir Painel do Supabase</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Card 2: Publicação no GitHub */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-5 md:p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
            <div className="flex items-center gap-2.5">
              <Github className="h-5 w-5 text-white" />
              <h3 className="text-base font-bold text-white">Etapa 2: Publicar no GitHub</h3>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gitCommands, 'git')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#02140f] border border-emerald-500/25 text-[11px] text-cyan-300 hover:text-cyan-200 cursor-pointer active:scale-95 transition-all"
            >
              {copiedKey === 'git' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedKey === 'git' ? 'Copiado!' : 'Copiar Comandos'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Abra seu terminal no diretório do projeto e execute os comandos abaixo para publicar seu código no novo repositório criado no GitHub:
          </p>

          <pre className="p-3.5 rounded-xl bg-[#02140f] border border-emerald-500/20 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
            {gitCommands}
          </pre>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              O arquivo <strong>.gitignore</strong> já está configurado para nunca expor seus arquivos <code>.env</code> com chaves secretas no GitHub.
            </span>
          </div>
        </div>

      </div>

      {/* Tabela de Arquitetura & RLS do Banco */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-5 md:p-6 backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Tabelas Estruturadas com Row Level Security (RLS)</h3>
        </div>
        <p className="text-xs text-slate-300">
          O schema do RadarMove garante que cada Personal Trainer acesse somente os seus alunos e leads, compartilhando templates globais de desafios com segurança.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#02140f] border border-emerald-500/20">
            <p className="font-mono text-xs font-bold text-cyan-300">public.profissionais</p>
            <p className="text-[11px] text-slate-400 mt-1">Tenant raiz (auth.uid() = id)</p>
          </div>
          <div className="p-3 rounded-xl bg-[#02140f] border border-emerald-500/20">
            <p className="font-mono text-xs font-bold text-emerald-300">public.alunos</p>
            <p className="text-[11px] text-slate-400 mt-1">Isolado por profissional_id</p>
          </div>
          <div className="p-3 rounded-xl bg-[#02140f] border border-emerald-500/20">
            <p className="font-mono text-xs font-bold text-amber-300">public.leads</p>
            <p className="text-[11px] text-slate-400 mt-1">CRM e conversão de prospecção</p>
          </div>
          <div className="p-3 rounded-xl bg-[#02140f] border border-emerald-500/20">
            <p className="font-mono text-xs font-bold text-purple-300">public.desafios_templates</p>
            <p className="text-[11px] text-slate-400 mt-1">Globais (NULL) + Personalizados</p>
          </div>
        </div>
      </div>
    </div>
  );
};
