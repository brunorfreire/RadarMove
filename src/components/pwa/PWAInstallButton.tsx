import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'topbar' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'topbar'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Se já está instalado e rodando em modo standalone, oculta o botão
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Caso não tenha evento capturado ainda (ex: desktop Chrome já instalado ou navegador sem suporte)
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Instalar RadarMove na tela inicial do celular ou computador"
          className={`w-full group flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3 text-left transition-all hover:border-emerald-400 hover:bg-emerald-500/20 active:scale-98 ${className}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Download className="h-4 w-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Instalar Aplicativo</span>
              <span className="rounded bg-emerald-400/20 px-1 py-0.2 text-[9px] font-extrabold text-emerald-300">
                PWA
              </span>
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              Adicionar à tela inicial
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="Instalar o RadarMove no seu celular (Tela Cheia)"
          className={`flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-[#03231c] px-3 py-2 text-xs font-bold text-emerald-300 hover:border-emerald-400 hover:bg-[#053228] hover:text-white transition-all active:scale-95 shadow-sm shadow-emerald-950 ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {/* Modal Guia de Instalação para iPhone / iPad e navegadores manuais */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="relative w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-[#031d17] p-6 text-slate-100 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instalar o RadarMove</h3>
                  <p className="text-[11px] text-slate-400">Como aplicativo no seu celular</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p className="text-slate-200">
                Para ter a experiência de <strong>tela cheia</strong> sem as barras do navegador:
              </p>

              <div className="rounded-xl border border-emerald-500/15 bg-[#02130e] p-3 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
                    1
                  </span>
                  <span>
                    No Safari (iOS) ou Chrome (Android), toque no botão <strong>Compartilhar <Share2 className="inline h-3.5 w-3.5 text-cyan-400 mx-0.5" /></strong> ou no menu de <strong>3 pontos</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
                    2
                  </span>
                  <span>
                    Role para baixo e selecione <strong>"Adicionar à Tela de Início" <PlusSquare className="inline h-3.5 w-3.5 text-emerald-400 mx-0.5" /></strong>.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
                    3
                  </span>
                  <span>
                    Toque em <strong>Adicionar</strong>. O ícone oficial do RadarMove aparecerá junto aos seus apps instalados!
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              Entendi, vou adicionar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
