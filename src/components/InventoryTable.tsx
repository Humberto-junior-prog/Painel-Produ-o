import { ProductionTask, TeamMember } from '../types';
import { UserCircle } from 'lucide-react';
import { TEAM_MEMBERS, TEAM_COLORS } from '../constants';
import { motion } from 'motion/react';

interface ProductionPlanningTableProps {
  tasks: ProductionTask[];
  onAddTask?: () => void;
  teamColors: Record<string, { bg: string, text: string, border: string }>;
  weeklyHistory: Record<string, Record<string, boolean>>;
  weeklyPlans: Record<string, Record<string, number>>;
  view: 'daily' | 'weekly';
}

export function ProductionPlanningTable({ tasks, teamColors, weeklyHistory, weeklyPlans, view }: ProductionPlanningTableProps) {
  const teamMembers = Object.keys(teamColors).filter(name => name !== 'Gerente' && name !== 'Planejamento');
  
  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 (Dom) - 6 (Sab)
  const currentHour = now.getHours();
  const endOfShiftHour = 18;

  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayKey = days[currentDayIndex];

  // Convert week day keys to JS day indices for comparison
  const dayKeyToIndex: Record<string, number> = {
    'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6
  };

  const weekDays = [
    { key: 'seg', label: 'Seg' },
    { key: 'ter', label: 'Ter' },
    { key: 'qua', label: 'Qua' },
    { key: 'qui', label: 'Qui' },
    { key: 'sex', label: 'Sex' },
    { key: 'sab', label: 'Sáb' },
    { key: 'dom', label: 'Dom' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        {teamMembers.map((member) => {
          const memberTasks = tasks.filter(t => t.assignee === member);
          
          let progress = 0;
          let totalAssigned = 0;

          if (view === 'daily') {
            const tasksWithQuantity = memberTasks.filter(t => (weeklyPlans[t.id]?.[todayKey] ?? 0) > 0);
            const completedCount = tasksWithQuantity.filter(t => t.status === 'Concluído').length;
            totalAssigned = tasksWithQuantity.length;
            progress = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 100;
          } else {
            // Weekly progress calculation
            let weeklyTotalPoints = 0;
            let weeklyCompletedPoints = 0;
            
            memberTasks.forEach(task => {
              weekDays.forEach(day => {
                const quantity = weeklyPlans[task.id]?.[day.key] ?? 0;
                if (quantity > 0) {
                  weeklyTotalPoints++;
                  if (weeklyHistory[task.id]?.[day.key]) {
                    weeklyCompletedPoints++;
                  }
                }
              });
            });
            
            totalAssigned = weeklyTotalPoints;
            progress = totalAssigned > 0 ? Math.round((weeklyCompletedPoints / totalAssigned) * 100) : 100;
          }

          const memberColor = teamColors[member] || teamColors.Gerente;

          return (
            <motion.div 
              key={member}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden"
            >
              <div className={`p-5 border-b border-stone-100 ${memberColor.bg} bg-opacity-5 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${memberColor.bg} rounded-xl flex items-center justify-center shadow-md shadow-amber-500/10`}>
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-lg leading-none">{member}</h4>
                    <p className={`text-[10px] font-bold ${memberColor.text} uppercase tracking-widest mt-1`}>
                      {view === 'daily' ? `${totalAssigned} Produtos Hoje` : `${totalAssigned} Tarefas na Semana`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-32 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full ${memberColor.bg}`}
                      />
                    </div>
                    <span className={`text-[10px] font-black ${memberColor.text}`}>{progress}%</span>
                  </div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Progresso da Produção</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white text-stone-400">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] min-w-[200px]">Produto</th>
                      {view === 'daily' ? (
                        <>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Quantidade</th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Status</th>
                        </>
                      ) : (
                        weekDays.map(day => (
                          <th key={day.key} className="px-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-center">{day.label}</th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {memberTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-6 rounded-full ${memberColor.bg} opacity-20 group-hover:opacity-100 transition-opacity`} />
                            <p className="font-bold text-stone-800 text-sm uppercase tracking-tight truncate max-w-[250px]">{task.productName}</p>
                          </div>
                        </td>
                        {view === 'daily' ? (
                          <>
                            <td className="px-6 py-4 text-center">
                              <span className="font-black text-stone-900">{task.quantity}</span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase ml-1">{task.unit}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                task.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
                              }`}>
                                {task.status}
                              </span>
                            </td>
                          </>
                        ) : (
                          weekDays.map(day => {
                            const isDone = weeklyHistory[task.id]?.[day.key];
                            const quantityPlanned = weeklyPlans[task.id]?.[day.key] ?? 0;
                            const dayIndex = dayKeyToIndex[day.key];
                            
                            // Color logic:
                            // Black: quantity 0
                            // Green: isDone true
                            // Red: quantity > 0 AND isDone false AND (day is past OR (day is today AND currentHour >= 18))
                            
                            let baseColor = 'bg-stone-50 border border-stone-200';
                            let shadowColor = '';

                            if (quantityPlanned === 0) {
                              baseColor = 'bg-stone-900 border-stone-950 shadow-inner';
                            } else if (isDone) {
                              baseColor = 'bg-emerald-500 border-emerald-600 shadow-sm shadow-emerald-500/20';
                            } else {
                              const isPast = dayIndex < currentDayIndex;
                              const isTodayPastShift = dayIndex === currentDayIndex && currentHour >= endOfShiftHour;
                              
                              if (isPast || isTodayPastShift) {
                                baseColor = 'bg-rose-500 border-rose-600 shadow-sm shadow-rose-500/20';
                              }
                            }

                            return (
                              <td key={day.key} className="px-2 py-4 text-center">
                                <div className={`w-3.5 h-3.5 rounded-sm mx-auto transition-all ${baseColor}`} />
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
