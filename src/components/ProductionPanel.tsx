import { ProductionTask } from '../types';
import { CheckCircle2, Clock, PlayCircle, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';
import { TEAM_COLORS } from '../constants';

interface ProductionPanelProps {
  tasks: ProductionTask[];
  userName: string;
  onUpdateStatus?: (taskId: string, newStatus: 'Pendente' | 'Concluído') => void;
  teamColors: Record<string, { bg: string, text: string, border: string }>;
  weeklyPlans: Record<string, Record<string, number>>;
}

export function ProductionPanel({ tasks, userName, onUpdateStatus, teamColors, weeklyPlans }: ProductionPanelProps) {
  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayKey = days[new Date().getDay()];

  const userTasks = tasks.filter(t => {
    const isAssigned = t.assignee === userName;
    const plan = weeklyPlans[t.id];
    const todayQuantity = plan ? plan[todayKey] : t.quantity;
    return isAssigned && todayQuantity > 0;
  });

  const dayOfWeek = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date());
  const userColor = teamColors[userName] || teamColors.Gerente;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
      <div className={`p-4 border-b border-stone-100 flex items-center justify-between ${userColor.bg} bg-opacity-5`}>
        <div className="flex items-center gap-2">
          <div className={`${userColor.bg} p-1.5 rounded-lg`}>
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-800 font-serif italic leading-none">Minha Programação: {userName}</h3>
            <p className={`text-[10px] font-bold ${userColor.text} uppercase tracking-widest leading-none mt-1`}>
              {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-stone-100">
        {userTasks.length === 0 ? (
          <div className="p-8 text-center text-stone-400 font-medium text-sm">Nenhuma tarefa atribuída.</div>
        ) : (
          userTasks.map((task, idx) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <div className={`w-1 h-8 rounded-full ${userColor.bg} opacity-20 group-hover:opacity-100 transition-opacity`} />
                {task.status === 'Concluído' ? (
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="bg-stone-50 text-stone-100 p-2 rounded-xl shrink-0 border border-stone-100">
                    <div className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 pr-2 flex items-center gap-2">
                  <h4 className="text-[11px] sm:text-xs font-bold text-stone-800 leading-tight uppercase tracking-tight break-words">
                    {task.productName}
                  </h4>
                  {task.isNew && (
                    <motion.span 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-tighter shrink-0"
                    >
                      NOVO
                    </motion.span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right min-w-[80px]">
                  <span className="text-xl font-bold text-stone-900 leading-none">{task.quantity}</span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block leading-none mt-1">
                    {task.unit === 'un' ? 'Unidades' : task.unit === 'kg' ? 'Quilos' : 'Bandejas'}
                  </span>
                </div>
                
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => {
                      onUpdateStatus?.(task.id, task.status === 'Concluído' ? 'Pendente' : 'Concluído');
                    }}
                    className={`px-10 py-3 rounded-2xl text-sm font-bold transition-all shadow-md active:scale-95 ${
                      task.status === 'Concluído' 
                        ? 'bg-emerald-600 text-white shadow-emerald-500/10' 
                        : 'bg-amber-500 text-stone-900 hover:bg-amber-400 shadow-amber-500/10'
                    }`}
                  >
                    {task.status === 'Concluído' ? 'Feito' : 'Produzir'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
