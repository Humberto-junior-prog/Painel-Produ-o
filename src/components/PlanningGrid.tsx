import { ProductionTask, TeamMember } from '../types';
import { RefreshCw, ChevronUp, ChevronDown, Trash2, Plus, PlusCircle, Users, UserPlus, UserCircle, Edit3, Check, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, FocusEvent, FormEvent, ChangeEvent, KeyboardEvent } from 'react';

import { TEAM_MEMBERS, TEAM_COLORS } from '../constants';

interface PlanningGridProps {
  tasks: ProductionTask[];
  weeklyPlans: Record<string, Record<string, number>>;
  teamMembers: string[];
  teamColors: Record<string, { bg: string, text: string, border: string }>;
  onUpdatePlan: (productId: string, day: string, value: number) => void;
  onSaveWeeklyPlans?: (allPlans: Record<string, Record<string, number>>) => Promise<void>;
  onAddProduct: (name: string, assignee: TeamMember) => void;
  onRemoveProduct: (id: string) => void;
  onMoveProduct: (id: string, direction: 'up' | 'down') => void;
  onAddMember: (name: string) => void;
  onUpdateMember: (oldName: string, newName: string, color?: { bg: string, text: string, border: string }) => void;
  onRemoveMember: (name: string) => void;
  onToggleNewProduct: (id: string) => void;
  onUpdateProductAssignee?: (productId: string, newAssignee: string) => void;
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
  { key: 'seg', label: 'S', fullLabel: 'Seg' },
  { key: 'ter', label: 'T', fullLabel: 'Ter' },
  { key: 'qua', label: 'Q', fullLabel: 'Qua' },
  { key: 'qui', label: 'Q', fullLabel: 'Qui' },
  { key: 'sex', label: 'S', fullLabel: 'Sex' },
  { key: 'sab', label: 'S', fullLabel: 'Sab' },
  { key: 'dom', label: 'D', fullLabel: 'Dom' },
] as const;

interface PlanInputProps {
  value: number;
  onChange: (val: number) => void;
}

function PlanInput({ value, onChange }: PlanInputProps) {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value.toString());
    }
  }, [value, isEditing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^[0-9]+$/.test(val)) {
      setLocalValue(val);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const num = localValue === '' ? 0 : parseInt(localValue);
    onChange(num);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    e.target.select();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value.toString());
      setIsEditing(false);
      e.currentTarget.blur();
    }
  };

  return (
    <input 
      type="text"
      inputMode="numeric"
      value={localValue === '0' && !isEditing ? '' : localValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      placeholder="0"
      className="w-full bg-stone-100/50 border border-transparent focus:border-amber-400 focus:bg-white rounded-lg px-0.5 py-1.5 md:py-2 text-center text-xs font-black text-stone-900 transition-all outline-none"
    />
  );
}

export function PlanningGrid({ 
  tasks,
  weeklyPlans, 
  teamMembers,
  teamColors,
  onUpdatePlan,
  onSaveWeeklyPlans,
  onAddProduct,
  onRemoveProduct,
  onMoveProduct,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onToggleNewProduct,
  onUpdateProductAssignee
}: PlanningGridProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'team'>('products');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductAssignee, setNewProductAssignee] = useState<string>('');

  // Update default assignee when teamMembers load
  useEffect(() => {
    if ((!newProductAssignee || !teamMembers.includes(newProductAssignee)) && teamMembers.length > 0) {
      setNewProductAssignee(teamMembers[0]);
    }
  }, [teamMembers, newProductAssignee]);

  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [selectedColor, setSelectedColor] = useState<{ bg: string, text: string, border: string } | null>(null);

  const [draftPlans, setDraftPlans] = useState<Record<string, Record<string, number>>>(weeklyPlans);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const lastWeeklyPlans = React.useRef(weeklyPlans);

  // Sync draft with weeklyPlans when server data truly changes
  useEffect(() => {
    if (isSaving) return;

    const serverIds = Object.keys(weeklyPlans);
    
    // Check if lengths differ or if keys differ (new items added)
    const hasNewItems = serverIds.some(id => !draftPlans[id]);
    
    // Optimization: check if props actually changed from our last known server state
    const serverDataHasChanged = JSON.stringify(weeklyPlans) !== JSON.stringify(lastWeeklyPlans.current);

    if (!hasChanges && serverDataHasChanged) {
      // If no local changes, or just finished saving, sync everything
      setDraftPlans(weeklyPlans);
      lastWeeklyPlans.current = weeklyPlans;
    } else if (hasNewItems) {
      // Merge logic: ONLY add newly discovered items from server, keep local edits
      setDraftPlans(prev => {
        const next = { ...prev };
        let updated = false;

        serverIds.forEach(id => {
          if (!next[id]) {
            next[id] = weeklyPlans[id];
            updated = true;
          }
        });

        return updated ? next : prev;
      });
      // Update our reference to the NEW items only? No, just the items we touched.
      // Actually, we can update the whole reference, so next time we know what was "previous"
      lastWeeklyPlans.current = weeklyPlans;
    }
  }, [weeklyPlans, hasChanges, isSaving]);

  const handlePlanChange = (productId: string, day: string, value: number) => {
    setDraftPlans(prev => {
      const currentProductPlans = prev[productId] || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
      return {
        ...prev,
        [productId]: {
          ...currentProductPlans,
          [day]: value
        }
      };
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveAll = async () => {
    if (!onSaveWeeklyPlans || !hasChanges) return;

    setIsSaving(true);
    try {
      // Create a clean copy to save
      const plansToSave: Record<string, Record<string, number>> = JSON.parse(JSON.stringify(draftPlans));
      
      await onSaveWeeklyPlans(plansToSave);
      
      // Update our reference to prevent immediate revert when the next snapshot arrives
      lastWeeklyPlans.current = plansToSave;
      
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save plans:", error);
      alert("Erro ao salvar: Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
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
        <div className="space-y-6 pb-24 md:pb-0">          {/* Mobile Actions Bar - Fixed at bottom */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 p-4 z-50 flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
            <button 
              onClick={handleSaveAll}
              className={`flex-[3] flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 border-2 shadow-lg ${
                saveSuccess
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : hasChanges 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 border-emerald-400 border-b-4' 
                  : 'bg-stone-100 text-stone-300 border-stone-200 grayscale'
              }`}
              disabled={isSaving || (!hasChanges && !saveSuccess)}
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : saveSuccess ? <Check className="w-6 h-6 border-2 rounded-full p-0.5" /> : <Check className="w-5 h-5" />}
              <span>{isSaving ? 'Gravando...' : saveSuccess ? 'Gravado!' : 'Gravar'}</span>
            </button>
            
            <button 
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 shadow-lg ${
                showAddForm 
                  ? 'bg-stone-50 text-stone-600 border-stone-200' 
                  : 'bg-stone-900 text-white shadow-stone-900/30 border-stone-800 border-b-4'
              }`}
            >
              {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          {/* Planning Header */}
          <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-black text-stone-800 font-serif italic">Metas da Semana</h3>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Defina as quantidades diárias e role para Gravar</p>
            </div>
            <div className="hidden md:flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handleSaveAll}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 md:py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all active:scale-95 border-2 ${
                  saveSuccess
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : hasChanges 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-emerald-400 border-b-4' 
                    : 'bg-white text-stone-300 border-stone-100 opacity-100 cursor-default'
                }`}
                disabled={isSaving || (!hasChanges && !saveSuccess)}
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{isSaving ? 'Gravando...' : saveSuccess ? 'Gravado!' : 'Gravar'}</span>
              </button>
              
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 rounded-xl text-[11px] md:text-sm font-black uppercase tracking-widest transition-all ${
                  showAddForm ? 'bg-stone-100 text-stone-600' : 'bg-stone-900 text-white shadow-lg shadow-stone-900/10 hover:bg-stone-800'
                }`}
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddForm ? 'Fechar' : 'Produto'}
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
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest px-1">Nome do Produto</label>
                    <input 
                      autoFocus
                      required
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Ex: Pão de Milho Especial"
                      className="w-full bg-white border-amber-200 border rounded-xl px-4 py-3 outline-amber-500 text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest px-1">Responsável</label>
                    <select 
                      value={newProductAssignee}
                      onChange={(e) => setNewProductAssignee(e.target.value)}
                      className="w-full bg-white border-amber-200 border rounded-xl px-4 py-3 outline-amber-500 text-sm font-bold shadow-sm"
                    >
                      {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full md:w-auto bg-stone-900 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <PlusCircle className="w-4 h-4" /> Adicionar
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto relative no-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-20 bg-stone-50 shadow-sm">
                  <tr className="text-stone-400 border-b border-stone-100">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] bg-stone-50 sticky left-0 z-30">Produto</th>
                    {DAYS.map(day => (
                      <th key={day.key} className="px-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center w-16 bg-stone-50">
                        {day.fullLabel}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center w-24 bg-stone-50">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {teamMembers.map((member) => {
                    const memberTasks = tasks.filter(t => t.assignee?.trim().toLowerCase() === member?.trim().toLowerCase());
                    const memberColor = teamColors[member] || teamColors.Gerente || TEAM_COLORS.Gerente;
                    if (memberTasks.length === 0) return null;

                    return (
                      <React.Fragment key={member}>
                        <tr className={`${memberColor.bg} bg-opacity-5`}>
                          <td colSpan={9} className="px-6 py-2 border-y border-stone-100/50">
                            <div className="flex items-center gap-2">
                              <UserCircle className={`w-4 h-4 ${memberColor.text}`} />
                              <span className={`text-xs font-black uppercase tracking-widest ${memberColor.text}`}>
                                {member}
                              </span>
                              <span className="text-[10px] text-stone-400 font-medium lowercase">({memberTasks.length} produtos)</span>
                            </div>
                          </td>
                        </tr>
                        {memberTasks.map((task, pIdx) => {
                          const productId = task.id;
                          const planValues = draftPlans[productId] || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
                          return (
                            <tr key={productId} className="hover:bg-amber-50/10 transition-colors group">
                              <td className="px-6 py-4 sticky left-0 bg-white z-10 group-hover:bg-amber-50/10 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-1 h-8 rounded-full ${memberColor.bg} opacity-20 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-stone-800 text-sm uppercase tracking-tight leading-tight">{task.productName}</p>
                                      {task.isNew && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 rounded-full">NOVO</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {DAYS.map(day => (
                                <td key={day.key} className="px-1 py-2">
                                  <PlanInput 
                                    value={planValues[day.key] || 0}
                                    onChange={(val) => handlePlanChange(productId, day.key, val)}
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-2">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => onMoveProduct(productId, 'up')} className="p-1 text-stone-300 hover:text-stone-600"><ChevronUp className="w-4 h-4" /></button>
                                  <button onClick={() => onMoveProduct(productId, 'down')} className="p-1 text-stone-300 hover:text-stone-600"><ChevronDown className="w-4 h-4" /></button>
                                  <button onClick={() => onRemoveProduct(productId)} className="p-1.5 text-stone-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}

                  {/* Orphan Tasks Desktop */}
                  {(() => {
                    const orphanTasks = tasks.filter(t => !teamMembers.some(m => m.trim().toLowerCase() === t.assignee?.trim().toLowerCase()));
                    if (orphanTasks.length === 0) return null;

                    return (
                      <React.Fragment>
                        <tr className="bg-stone-50">
                          <td colSpan={9} className="px-6 py-2 border-y border-stone-200">
                            <div className="flex items-center gap-2">
                              <UserCircle className="w-4 h-4 text-stone-400" />
                              <span className="text-xs font-black uppercase tracking-widest text-stone-500">
                                Sem Responsável / Outros
                              </span>
                              <span className="text-[10px] text-stone-400 font-medium lowercase">({orphanTasks.length} produtos)</span>
                            </div>
                          </td>
                        </tr>
                        {orphanTasks.map((task) => {
                          const productId = task.id;
                          const planValues = draftPlans[productId] || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
                          
                          return (
                            <tr key={productId} className="hover:bg-stone-100/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-8 rounded-full bg-stone-200 opacity-20 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  <div>
                                    <p className="font-bold text-stone-800 text-sm uppercase tracking-tight leading-tight">{task.productName}</p>
                                    <p className="text-[10px] text-stone-400 font-medium uppercase mt-0.5 italic">Assign: {task.assignee || 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                              {DAYS.map(day => (
                                <td key={day.key} className="px-1 py-2">
                                  <PlanInput 
                                    value={planValues[day.key] || 0}
                                    onChange={(val) => handlePlanChange(productId, day.key, val)}
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-2 text-center">
                                <button 
                                  onClick={() => onRemoveProduct(productId)}
                                  className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-8 pb-40">
            {teamMembers.map((member) => {
              const memberTasks = tasks.filter(t => (t.assignee || '').trim().toLowerCase() === member.trim().toLowerCase());
              const memberColor = teamColors[member] || teamColors.Gerente || TEAM_COLORS.Gerente;
              if (memberTasks.length === 0) return null;

              return (
                <div key={member} className="space-y-4">
                  <div className="flex items-center gap-2 px-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${memberColor.bg} shadow-sm`} />
                    <span className={`text-[12px] font-black uppercase tracking-[0.15em] ${memberColor.text}`}>{member}</span>
                    <div className="flex-1 h-px bg-stone-100" />
                    <span className="text-[10px] text-stone-400 font-bold bg-stone-50 px-2 py-0.5 rounded-full uppercase">
                      {memberTasks.length} {memberTasks.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  
                  {memberTasks.map((task) => {
                    const productId = task.id;
                    const planValues = draftPlans[productId] || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
                    
                    return (
                      <div key={productId} className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-5 space-y-4 mx-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1 h-6 rounded-full ${memberColor.bg} opacity-30`} />
                            <h4 className="font-black text-stone-800 text-[14px] uppercase tracking-tight leading-tight">{task.productName}</h4>
                            {task.isNew && <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">NOVO</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => onRemoveProduct(productId)} 
                              className="text-stone-300 p-2 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                          <div className="grid grid-cols-7 gap-1 md:gap-1.5 min-w-[280px]">
                            {DAYS.map(day => (
                              <div key={day.key} className="space-y-1.5">
                                <p className="text-[9px] font-black text-center text-stone-400 uppercase tracking-tighter">{day.label}</p>
                                <PlanInput 
                                  value={planValues[day.key] || 0}
                                  onChange={(val) => handlePlanChange(productId, day.key, val)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            
            {/* Orphan Mobile View - Styled exactly like member sections */}
            {(() => {
              const orphanTasks = tasks.filter(t => !teamMembers.some(m => m.trim().toLowerCase() === (t.assignee || '').trim().toLowerCase()));
              if (orphanTasks.length === 0) return null;
              
              return (
                <div className="space-y-4 pt-10 border-t border-stone-100">
                  <div className="flex items-center gap-2 px-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    <span className="text-[12px] font-black uppercase tracking-[0.15em] text-stone-500">Sem Responsável</span>
                    <div className="flex-1 h-px bg-stone-100" />
                  </div>
                  
                  {orphanTasks.map(task => {
                    const productId = task.id;
                    const planValues = draftPlans[productId] || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
                    
                    return (
                      <div key={productId} className="bg-stone-50/50 rounded-[2rem] shadow-sm border border-stone-100 p-5 space-y-4 mx-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-stone-800 text-[14px] uppercase tracking-tight">{task.productName}</h4>
                              {task.isNew && <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">NOVO</span>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Assign: {task.assignee || 'N/A'}</span>
                              <select 
                                onChange={(e) => onUpdateProductAssignee && onUpdateProductAssignee(task.id, e.target.value)}
                                className="bg-white border border-stone-200 text-[9px] font-black uppercase rounded-lg px-2 py-1 outline-none shadow-sm"
                                defaultValue=""
                              >
                                <option value="" disabled>Trocar Responsável</option>
                                {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                          </div>
                          <button onClick={() => onRemoveProduct(productId)} className="text-stone-300 p-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                          <div className="grid grid-cols-7 gap-1 min-w-[280px]">
                            {DAYS.map(day => (
                              <div key={day.key} className="space-y-1.5">
                                <p className="text-[9px] font-black text-center text-stone-400 uppercase tracking-tighter">{day.label}</p>
                                <PlanInput 
                                  value={planValues[day.key] || 0}
                                  onChange={(val) => handlePlanChange(productId, day.key, val)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                   const color = teamColors[member] || teamColors.Gerente || TEAM_COLORS.Gerente;
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
