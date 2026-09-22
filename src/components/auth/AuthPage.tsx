import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Activity, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Erro ao conectar com Google:', err);
      setError(err?.message || 'Erro ao conectar com o Google. Verifique a configuração no Supabase.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validação básica
        if (!nome.trim()) {
          setError('Por favor, informe seu nome completo.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('A senha deve conter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }

        // 1. Cadastra usuário no Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nome: nome.trim(),
              full_name: nome.trim(),
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        const user = authData?.user;

        if (user) {
          // 2. Insere/atualiza perfil na tabela 'profissionais'
          try {
            await supabase.from('profissionais').upsert({
              id: user.id,
              nome_profissional: nome.trim(),
              nome_empresa: 'RadarMove Studio',
              telefone: '',
              cor_primaria: '#10b981',
              total_alunos: 0,
            });
          } catch (profileErr) {
            console.warn('Aviso: Perfil será sincronizado no primeiro login:', profileErr);
          }

          // Se a sessão já foi iniciada automaticamente pelo Supabase
          if (authData.session) {
            setSuccess('Conta criada e autenticada com sucesso! Redirecionando...');
            setTimeout(() => {
              if (onAuthSuccess) onAuthSuccess();
              else {
                window.location.hash = '';
                window.location.reload();
              }
            }, 800);
            return;
          } else {
            setSuccess('Conta criada com sucesso! Verifique a caixa de entrada para confirmar ou faça login.');
            setIsSignUp(false);
          }
        }
      } else {
        // Login com e-mail e senha
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.');
          }
          throw signInError;
        }

        if (signInData?.user) {
          // Garante que o profissional exista na tabela
          try {
            await supabase.from('profissionais').upsert(
              {
                id: signInData.user.id,
                nome_profissional: signInData.user.user_metadata?.nome || signInData.user.email?.split('@')[0] || 'Treinador',
                nome_empresa: 'RadarMove Studio',
                cor_primaria: '#10b981',
              },
              { onConflict: 'id' }
            );
          } catch (upsertErr) {
            // silencioso
          }

          setSuccess('Login efetuado com sucesso! Carregando seu painel...');
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess();
            else {
              window.location.hash = '';
              window.location.reload();
            }
          }, 600);
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setError(err?.message || 'Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#021813] text-zinc-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorativo com gradientes sutis e blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Principal */}
      <div className="w-full max-w-md bg-[#022019]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 shadow-2xl shadow-emerald-950/80 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-3">
            <Activity className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Radar<span className="text-cyan-400">Move</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Gestão e Retenção Inteligente de Alunos para Personal Trainers
          </p>
        </div>

        {/* Toggle Login / Cadastro */}
        <div className="grid grid-cols-2 bg-[#02140f] p-1 rounded-xl border border-emerald-500/20 mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer font-bold ${
              !isSignUp
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer font-bold ${
              isSignUp
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-zinc-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Notificações de Erro e Sucesso */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Botão de Login Social com o Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          id="btn-google-auth"
          className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/25 bg-[#02130e] hover:bg-[#03241b] hover:border-emerald-500/40 text-slate-100 font-semibold text-sm flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Conectando com o Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </>
          )}
        </button>

        {/* Divisor Visual */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-emerald-500/20" />
          </div>
          <div className="relative bg-[#022019] px-3 text-[11px] uppercase tracking-wider text-slate-400">
            ou com e-mail
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="auth-nome">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-nome"
                  type="text"
                  required={isSignUp}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Treinador Rodrigo Silva"
                  className="w-full bg-[#02130e] border border-emerald-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-slate-500 transition-colors outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="auth-email">
              E-mail Profissional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-[#02130e] border border-emerald-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-slate-500 transition-colors outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="auth-password">
                Senha de Acesso
              </label>
              <span className="text-[11px] text-slate-400">
                mínimo 6 caracteres
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#02130e] border border-emerald-500/25 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-slate-500 transition-colors outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processando...</span>
              </>
            ) : isSignUp ? (
              <>
                <span>Criar Minha Conta Grátis</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            ) : (
              <>
                <span>Acessar Meu Painel</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé Seguro */}
        <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticação protegida via Supabase Auth & RLS</span>
        </div>
      </div>
    </div>
  );
};
