import React from 'react';
import { X, BellRing, CheckCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useFinancial();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-sm bg-zinc-950 border-l border-amber-500/20 text-zinc-100 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-amber-500/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Central de Alertas & Notificações</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-mono">
            {notifications.filter((n) => !n.lida).length} não lidas
          </span>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar todas
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhuma notificação no momento.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.lida
                    ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60'
                    : 'bg-zinc-900/80 border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {n.tipo === 'SUCESSO' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {n.tipo === 'ALERTA' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  {n.tipo === 'DÍVIDA' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  {n.tipo === 'INFO' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}

                  <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-200 mb-0.5 flex justify-between items-center">
                      <span>{n.titulo}</span>
                      {!n.lida && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{n.mensagem}</p>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">
                      {n.data}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
