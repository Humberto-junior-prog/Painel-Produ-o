import { ProductionTask, TeamMember } from '../types';
import { RefreshCw, ChevronUp, ChevronDown, Trash2, Plus, PlusCircle, Users, UserPlus, UserCircle, Edit3, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FocusEvent, FormEvent } from 'react';

interface PlanningGridProps {
  tasks: ProductionTask[];
  weeklyPlans: Record<string, Record<string, number>>;
  teamMembers: string[];
  teamColors: Record<string, { bg: string, text: string, border: string }>;
  onUpdatePlan: (productId: string, day: string, value: number) => void;
  onAddProduct: (name: string, assignee: TeamMember) => void;
  onRemoveProduct: (id: string) => void;
  onMoveProduct: (id: string, direction: 'up' | 'down') => void;
  onAddMember: (name: string) => void;
  onUpdateMember: (oldName: string, newName: string, color?: { bg: string, text: string, border: string }) => void;
  onRemoveMember: (name: string) => void;
  onToggleNewProduct: (id: string) => void;
}

const COLOR_OPTIONS = [
  { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' },
  { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-100' },
  { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-100' },
  { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-100' },
  { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-100' },
  { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-100' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-100' },
  { bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-100' },
  { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-100' },
  { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-100' },
  { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-100' },
  { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-100' },
  { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', border: 'border-fuchsia-100' },
  { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-slate-500', text: 'text-slate-600', border: 'border-slate-100' },
  { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-100' },
  { bg: 'bg-zinc-500', text: 'text-zinc-600', border: 'border-zinc-100' },
  { bg: 'bg-stone-500', text: 'text-stone-600', border: 'border-stone-100' },
];

const DAYS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sab' },
  { key: 'dom', label: 'Dom' },
] as const;

export function PlanningGrid({ 
  tasks,
  weeklyPlans, 
  teamMembers,
  teamColors,
  onUpdatePlan,
  onAddProduct,
  onRemoveProduct,
  onMoveProduct,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onToggleNewProduct
}: PlanningGridProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'team'>('products');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductAssignee, setNewProductAssignee] = useState<string>(teamMembers[0] || '');

  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [selectedColor, setSelectedColor] = useState<{ bg: string, text: string, border: string } | null>(null);

  const handleUpdate = (productId: string, day: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdatePlan(productId, day, numValue);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newProductName.trim()) {
      onAddProduct(newProductName.trim(), newProductAssignee);
      setNewProductName('');
      setShowAddForm(false);
    }
  };

  const handleAddMemberSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName('');
    }
  };

  const startEditingMember = (name: string) => {
    setEditingMember(name);
    setEditMemberName(name);
    setSelectedColor(teamColors[name] || COLOR_OPTIONS[0]);
  };

  const saveMemberEdit = () => {
    if (editingMember) {
      onUpdateMember(editingMember, editMemberName.trim(), selectedColor || undefined);
    }
    setEditingMember(null);
    setSelectedColor(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex gap-4 border-b border-stone-100 pb-1">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all relative ${
            activeTab === 'products' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> 
          Produtos Plan.
          {activeTab === 'products' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all relative ${
            activeTab === 'team' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Users className="w-4 h-4" /> 
          Equipe
          {activeTab === 'team' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-stone-800 font-serif italic">Planejamento de Metas Semanais</h3>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mt-1">Defina as quantidades diárias de produção</p>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => setShowAddForm(!showAddForm)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                   showAddForm ? 'bg-stone-100 text-stone-600' : 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/20'
                 }`}
               >
                {showAddForm ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddForm ? 'Cancelar' : 'Novo Produto'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm"
              >
                <form onSubmit={handleAddSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest px-1">Nome do Produto</label>
                    <input 
                      autoFocus
                      required
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Ex: Pão de Milho Especial"
                      className="w-full bg-white border-amber-200 border rounded-xl px-4 py-2.5 outline-amber-500 text-sm font-medium"
                    />
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest px-1">Responsável</label>
                    <select 
                      value={newProductAssignee}
                      onChange={(e) => setNewProductAssignee(e.target.value)}
                      className="w-full bg-white border-amber-200 border rounded-xl px-4 py-2.5 outline-amber-500 text-sm font-medium"
                    >
                      {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-stone-800 transition-all flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Adicionar
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50/50 text-stone-400 border-b border-stone-100">
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] min-w-[200px]">Produto / Responsável</th>
                    {DAYS.map(day => (
                      <th key={day.key} className="px-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center w-14">
                        {day.label}
                      </th>
                    ))}
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {tasks.map((task, pIdx) => {
                    const productId = task.id;
                    const planValues = weeklyPlans[productId] || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
                    const color = teamColors[task.assignee] || teamColors.Gerente;
                    
                    return (
                      <motion.tr 
                        key={productId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: pIdx * 0.01 }}
                        className="hover:bg-amber-50/10 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-1 h-8 rounded-full ${color.bg} opacity-20 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-stone-800 text-[10px] uppercase tracking-tight leading-tight">{task.productName}</p>
                                {task.isNew && (
                                  <span className="text-[7px] font-black bg-amber-100 text-amber-600 px-1 rounded-sm tracking-tighter">NEW</span>
                                )}
                                <button 
                                  onClick={() => onToggleNewProduct(task.id)}
                                  className={`p-0.5 rounded-full transition-all ${
                                    task.isNew 
                                      ? 'text-amber-500 scale-110 opacity-100' 
                                      : 'text-stone-200 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                                  }`}
                                  title={task.isNew ? "Remover status de Novo" : "Marcar como Novo Produto"}
                                >
                                  <Star className={`w-3.5 h-3.5 ${task.isNew ? 'fill-amber-500' : ''}`} />
                                </button>
                              </div>
                              <p className={`text-[8px] font-black uppercase tracking-tighter ${color.text} mt-0.5`}>{task.assignee}</p>
                            </div>
                          </div>
                        </td>
                        {DAYS.map(day => (
                          <td key={day.key} className="px-1 py-2">
                            <input 
                              type="number"
                              min="0"
                              value={planValues[day.key] || ''}
                              onFocus={handleFocus}
                              onChange={(e) => handleUpdate(productId, day.key, e.target.value)}
                              placeholder="0"
                              className="w-full bg-stone-100/50 border border-transparent focus:border-amber-400 focus:bg-white rounded-lg px-1 py-2 text-center text-xs font-black text-stone-900 transition-all outline-none"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col">
                              <button 
                                disabled={pIdx === 0}
                                onClick={() => onMoveProduct(productId, 'up')}
                                className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-0"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                disabled={pIdx === tasks.length - 1}
                                onClick={() => onMoveProduct(productId, 'down')}
                                className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-0"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button 
                              onClick={() => onRemoveProduct(productId)}
                              className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-stone-800 font-serif italic">Gestão da Equipe</h3>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mt-1">Gerencie os colaboradores ativos no painel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 h-fit">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Novo Colaborador</h4>
              </div>
              
              <form onSubmit={handleAddMemberSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest px-1">Nome do Colaborador</label>
                  <input 
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full bg-stone-50 border border-stone-100 focus:border-amber-400 focus:bg-white rounded-2xl px-5 py-4 outline-none text-sm font-bold text-stone-800 transition-all placeholder:text-stone-300 placeholder:font-normal"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-stone-900 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform" />
                  Incluir Colaborador
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
               <div className="p-6 border-b border-stone-50 bg-stone-50/30">
                 <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Colaboradores no Painel</h4>
               </div>
               <div className="divide-y divide-stone-50 max-h-[600px] overflow-y-auto no-scrollbar">
                 {teamMembers.map((member) => {
                   const color = teamColors[member] || teamColors.Gerente;
                   const isEditing = editingMember === member;
                   
                   return (
                      <div key={member} className="px-6 py-5 group transition-colors hover:bg-stone-50/50">
                        <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4 flex-1">
                           <div className={`w-12 h-12 ${color.bg} rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 shrink-0`}>
                             <UserCircle className="w-7 h-7 text-white" />
                           </div>
                           {isEditing ? (
                             <div className="flex flex-col gap-1 flex-1">
                               <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-1">Novo Nome</label>
                               <input 
                                 autoFocus
                                 value={editMemberName}
                                 onChange={(e) => setEditMemberName(e.target.value)}
                                 className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm font-bold outline-none shadow-sm focus:ring-2 focus:ring-amber-500/20"
                               />
                             </div>
                           ) : (
                             <span className="font-bold text-stone-800 text-base">{member}</span>
                           )}
                         </div>
                         <div className="flex items-center gap-1">
                           {!isEditing && (
                             <>
                               <button 
                                 onClick={() => startEditingMember(member)}
                                 className="p-2 text-stone-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                 title="Editar Colaborador"
                               >
                                 <Edit3 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if (window.confirm(`ATENÇÃO: Deseja realmente remover "${member}" do painel? Todos os seus produtos também serão excluídos!`)) {
                                     onRemoveMember(member);
                                   }
                                 }}
                                 className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                 title="Remover Colaborador"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                         </div>
                        </div>

                        {isEditing && (
                          <div className="mt-6 pt-6 border-t border-stone-100 space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4 px-1">Cor do Identificador</p>
                              <div className="grid grid-cols-5 gap-3">
                                {COLOR_OPTIONS.map((opt, i) => (
                                  <button 
                                    key={i}
                                    type="button"
                                    onClick={() => setSelectedColor(opt)}
                                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${opt.bg} ${
                                      selectedColor?.bg === opt.bg ? 'scale-110 ring-4 ring-emerald-500/30 ring-offset-2' : 'hover:scale-105 opacity-80 hover:opacity-100 shadow-sm'
                                    }`}
                                  >
                                    {selectedColor?.bg === opt.bg && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <button 
                                onClick={saveMemberEdit}
                                className="flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Confirmar Alterações
                              </button>
                              <button 
                                onClick={() => { setEditingMember(null); setSelectedColor(null); }}
                                className="px-6 bg-stone-100 text-stone-500 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                   );
                 })}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
