// Production Planning App
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Package, 
  AlertCircle,
  LayoutDashboard,
  ChefHat,
  History,
  Settings,
  LogOut,
  Bell,
  Lock,
  UserCheck,
  Edit2,
  Plus,
  X,
  Trash2,
  CalendarRange,
  Calendar,
  LogIn
} from 'lucide-react';
import { 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { db, auth, signIn, signOut } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { StatsCard } from './components/StatsCard';
import { ProductionPanel } from './components/ProductionPanel';
import { ProductionPlanningTable } from './components/InventoryTable';
import { PlanningGrid } from './components/PlanningGrid';
import { AIAssistant } from './components/AIAssistant';
import { PRODUCTION_TASKS, TEAM_MEMBERS, TEAM_COLORS } from './constants';
import { TeamMember, ProductionTask } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [teamColors, setTeamColors] = useState<Record<string, { bg: string, text: string, border: string }>>({});
  const [currentUser, setCurrentUser] = useState<string>('Tiago');
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Weekly plans and history are now merged into the task/product object in the database
  // but we keep these state hooks for backwards compatibility with existing components
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, Record<string, number>>>({});
  const [weeklyHistory, setWeeklyHistory] = useState<Record<string, Record<string, boolean>>>({});
  const hasSetInitialMember = useRef(false);

  useEffect(() => {
    // Handle redirect result for mobile/tablet logins
    getRedirectResult(auth).catch((error) => {
      console.error("Error with redirect login:", error);
      // You can alert here if needed, but often it's just a cancelation
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const [isInitializing, setIsInitializing] = useState(false);

  const initializeDefaultConfig = async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    try {
      console.log("Starting database initialization...");
      await setDoc(doc(db, 'globalConfig', 'main'), {
        teamMembers: ['Tiago', 'Guilherme', 'Danieli'],
        teamColors: {
          'Tiago': { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' },
          'Guilherme': { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-100' },
          'Danieli': { bg: 'bg-rose-400', text: 'text-rose-500', border: 'border-rose-100' },
          'Gerente': { bg: 'bg-stone-900', text: 'text-stone-950', border: 'border-stone-200' },
          'Planejamento': { bg: 'bg-stone-900', text: 'text-stone-950', border: 'border-stone-200' }
        },
        notices: {
          'Tiago': ['Focar nos sonhos de creme primeiro.', 'Conferir temperatura do forno dois.'],
          'Guilherme': ['Preparar baguetes para o turno da tarde.', 'Limpeza da mesa de inox.'],
          'Danieli': ['Finalizar assados antes das 10h.', 'Organizar estoque de embalagens.'],
          'Gerente': ['Reunião de metas às 14h.', 'Conferir pedidos de matéria-prima.'],
          'Planejamento': ['Ajustar produção para o feriado.']
        },
        maintenanceTasks: [
          { id: '1', assignee: 'Tiago', task: 'Masseira (geral)' },
          { id: '2', assignee: 'Guilherme', task: 'Divisora (geral)' },
          { id: '3', assignee: 'Danieli', task: 'Modeladora de pães (geral)' }
        ],
        lastWeeklyReset: new Date().toISOString()
      });

      // Initialize tasks sequentially to ensure reliability
      for (let i = 0; i < PRODUCTION_TASKS.length; i++) {
        const t = PRODUCTION_TASKS[i];
        console.log(`Initializing task: ${t.productName}`);
        await setDoc(doc(db, 'products', t.id), {
          productName: t.productName,
          quantity: t.quantity,
          unit: t.unit,
          status: t.status,
          assignee: t.assignee,
          order: i,
          plans: { seg: t.quantity, ter: t.quantity, qua: t.quantity, qui: t.quantity, sex: t.quantity, sab: t.quantity, dom: t.quantity },
          history: { seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false },
          updatedAt: serverTimestamp()
        });
      }
      console.log("Database initialization complete.");
    } catch (e) {
      console.error("Initialization error:", e);
      handleFirestoreError(e, OperationType.WRITE, 'initialization');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Sync products
    const q = query(collection(db, 'products'), orderBy('order', 'asc'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      console.log("Products snapshot received, count:", snapshot.size);
      
      const newTasks: any[] = [];
      const newPlans: Record<string, Record<string, number>> = {};
      const newHistory: Record<string, Record<string, boolean>> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const task = { ...data, id: doc.id };
        newTasks.push(task);
        
        // Ensure every project has a complete plans object
        const defaultPlans = { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 };
        newPlans[doc.id] = { ...defaultPlans, ...(data.plans || {}) };
        
        const defaultHistory = { seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false };
        newHistory[doc.id] = { ...defaultHistory, ...(data.history || {}) };
      });

      // Group by assignee first, then by the original order field
      newTasks.sort((a, b) => {
        const assigneeA = (a.assignee || '').toString();
        const assigneeB = (b.assignee || '').toString();
        
        if (assigneeA !== assigneeB) {
          return assigneeA.localeCompare(assigneeB);
        }
        return (a.order || 0) - (b.order || 0);
      });
      
      setTasks(newTasks);
      setWeeklyPlans(newPlans);
      setWeeklyHistory(newHistory);
      setDataLoading(false);

      if (snapshot.empty && !isInitializing) {
        console.log("Database empty, initializing defaults...");
        initializeDefaultConfig();
      }
    }, (error) => {
      console.error("Products sync error:", error);
      setDataLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Sync config
    const unsubscribeConfig = onSnapshot(doc(db, 'globalConfig', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const members = (data.teamMembers || []).map((m: string) => m.trim());
        setTeamMembers(members);
        
        // Always open on the first colleague's tab by default when the app opens
        if (!hasSetInitialMember.current && members.length > 0) {
          // If Tiago is in the list, use him, otherwise use the first member
          const initialMember = members.includes('Tiago') ? 'Tiago' : members[0];
          setCurrentUser(initialMember);
          hasSetInitialMember.current = true;
        }

        setTeamColors(data.teamColors || {});
        setNotices(data.notices || {});
        setMaintenanceTasks(data.maintenanceTasks || []);

        // Weekly Reset Logic from Cloud State
        const lastResetDate = data.lastWeeklyReset;
        const now = new Date();
        const currentWeekStart = new Date(now);
        const day = currentWeekStart.getDay();
        const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
        currentWeekStart.setDate(diff);
        currentWeekStart.setHours(0, 0, 0, 0);

        if (!lastResetDate || new Date(lastResetDate).getTime() < currentWeekStart.getTime()) {
          // Reset history for all products in the database
          // Note: This should ideally be a cloud function, but we do it client-side for now
          // We only do it if the user is a manager to avoid race conditions
          if (currentUser === 'Gerente') {
            tasks.forEach(async (t) => {
              await updateDoc(doc(db, 'products', t.id), {
                history: { seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false },
                updatedAt: serverTimestamp()
              });
            });
            updateDoc(doc(db, 'globalConfig', 'main'), {
              lastWeeklyReset: currentWeekStart.toISOString()
            });
          }
        }
      } else if (!isInitializing) {
        initializeDefaultConfig();
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'globalConfig/main'));

    return () => {
      unsubscribeProducts();
      unsubscribeConfig();
    };
  }, [user]); // Removed currentUser from dependencies 

  const handleUpdatePlan = async (productId: string, day: string, value: number) => {
    try {
      const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const todayKey = days[new Date().getDay()];
      
      const updates: any = {
        [`plans.${day}`]: value,
        updatedAt: serverTimestamp()
      };

      if (day === todayKey) {
        updates.quantity = value;
      }

      await updateDoc(doc(db, 'products', productId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleSaveWeeklyPlans = async (allPlans: Record<string, Record<string, number>>) => {
    try {
      const batch = writeBatch(db);
      // Determine today's day key (seg, ter, etc.)
      const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const todayKey = dayNames[new Date().getDay()];

      console.log(`[Batch-Save] Initiating save for ${Object.keys(allPlans).length} products. Today is: ${todayKey}`);

      Object.entries(allPlans).forEach(([productId, plans]) => {
        if (!productId || !plans) return;
        
        const productRef = doc(db, 'products', productId);
        
        // Prepare updates - Force integers and ensure no undefined values
        const cleanPlans: Record<string, number> = {
          seg: Number(plans.seg) || 0,
          ter: Number(plans.ter) || 0,
          qua: Number(plans.qua) || 0,
          qui: Number(plans.qui) || 0,
          sex: Number(plans.sex) || 0,
          sab: Number(plans.sab) || 0,
          dom: Number(plans.dom) || 0,
        };

        const updates: any = {
          plans: cleanPlans,
          updatedAt: serverTimestamp()
        };
        
        // If today is represented in the plans, update the primary quantity too
        if (cleanPlans[todayKey] !== undefined) {
          updates.quantity = cleanPlans[todayKey];
        }

        batch.update(productRef, updates);
      });

      await batch.commit();
      console.log("[Batch-Save] Success: Batch committed to Firestore.");
    } catch (error) {
      console.error("[Batch-Save] Critical failure during batch save:", error);
      handleFirestoreError(error, OperationType.UPDATE, 'products/batch');
      throw error;
    }
  };

  const handleAddProduct = async (name: string, assignee: string) => {
    try {
      const newId = `p-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate a large order to put it at the end of the global list, 
      // but the UI sorting by assignee + order will handle correctly.
      const nextOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) + 1 : 0;
      
      await setDoc(doc(db, 'products', newId), {
        productName: name,
        quantity: 0,
        unit: 'un',
        status: 'Pendente',
        assignee: assignee.trim(),
        order: nextOrder,
        plans: { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 },
        history: { seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleUpdateProductAssignee = async (productId: string, newAssignee: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        assignee: newAssignee.trim(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleRemoveProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleMoveProduct = async (id: string, direction: 'up' | 'down') => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const assigneeTasks = tasks.filter(t => 
        (t.assignee || '').trim().toLowerCase() === (task.assignee || '').trim().toLowerCase()
      );
      const index = assigneeTasks.findIndex(t => t.id === id);
      
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === assigneeTasks.length - 1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const targetTask = assigneeTasks[targetIndex];

      // Swap orders
      const tempOrder = task.order || 0;
      await updateDoc(doc(db, 'products', id), { order: targetTask.order || 0 });
      await updateDoc(doc(db, 'products', targetTask.id), { order: tempOrder });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'products');
    }
  };

  const handleAddMember = async (name: string) => {
    if (teamMembers.includes(name)) return;
    
    const colorPool = [
      { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100' },
      { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-100' },
      { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-100' },
      { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-100' },
      { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-100' },
    ];
    const color = colorPool[teamMembers.length % colorPool.length];
    
    try {
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        teamMembers: [...teamMembers, name],
        [`teamColors.${name}`]: color
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleUpdateMember = async (oldName: string, newName: string, color?: { bg: string, text: string, border: string }) => {
    if (newName && newName !== oldName && teamMembers.includes(newName)) return;
    
    try {
      if (newName && newName !== oldName) {
        const configDoc = doc(db, 'globalConfig', 'main');
        const newTeamMembers = teamMembers.map(m => m === oldName ? newName : m);
        
        // Use a full object replacement for teamColors to ensure the old key is gone
        const newTeamColors = { ...teamColors };
        newTeamColors[newName] = color || teamColors[oldName];
        delete newTeamColors[oldName];

        const configUpdates: any = {
          teamMembers: newTeamMembers,
          teamColors: newTeamColors
        };

        // Also update notices
        const newNotices = { ...notices };
        if (newNotices[oldName]) {
          newNotices[newName] = newNotices[oldName];
          delete newNotices[oldName];
        }
        configUpdates.notices = newNotices;

        await updateDoc(configDoc, configUpdates);
        
        // Update all tasks associated with this member
        const tasksToUpdate = tasks.filter(t => 
          (t.assignee || '').trim().toLowerCase() === oldName.trim().toLowerCase()
        );
        await Promise.all(
          tasksToUpdate.map(t => updateDoc(doc(db, 'products', t.id), { assignee: newName.trim() }))
        );

        if (currentUser === oldName) setCurrentUser(newName);
      } else if (color) {
        await updateDoc(doc(db, 'globalConfig', 'main'), {
          [`teamColors.${oldName}`]: color
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleRemoveMember = async (name: string) => {
    try {
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        teamMembers: teamMembers.filter(m => m !== name),
        [`teamColors.${name}`]: null
      });
      if (currentUser === name) setCurrentUser('Gerente');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [managerCodeInput, setManagerCodeInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [managerView, setManagerView] = useState<'daily' | 'weekly'>('daily');

  // Personalized and Editable Notices
  const [notices, setNotices] = useState<Record<string, string[]>>({
    'Tiago': ['Focar nos sonhos de creme primeiro.', 'Conferir temperatura do forno dois.'],
    'Guilherme': ['Preparar baguetes para o turno da tarde.', 'Limpeza da mesa de inox.'],
    'Danieli': ['Finalizar assados antes das 10h.', 'Organizar estoque de embalagens.'],
    'Gerente': ['Reunião de metas às 14h.', 'Conferir pedidos de matéria-prima.'],
    'Planejamento': ['Ajustar produção para o feriado.']
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState([
    { id: '1', assignee: 'Tiago', task: 'Masseira (geral)' },
    { id: '2', assignee: 'Guilherme', task: 'Divisora (geral)' },
    { id: '3', assignee: 'Danieli', task: 'Modeladora de pães (geral)' }
  ]);

  const [editingNotice, setEditingNotice] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(false);

  const handleAddNotice = async (user: string) => {
    try {
      const currentNotices = notices[user] || [];
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        [`notices.${user}`]: [...currentNotices, '']
      });
      setEditingNotice(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleRemoveNotice = async (user: string, index: number) => {
    try {
      const currentNotices = (notices[user] || []).filter((_, i) => i !== index);
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        [`notices.${user}`]: currentNotices
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleUpdateNotice = async (user: string, index: number, newText: string) => {
    try {
      const currentNotices = [...(notices[user] || [])];
      currentNotices[index] = newText;
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        [`notices.${user}`]: currentNotices
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleAddMaintenance = async () => {
    try {
      const newId = Math.random().toString();
      const newTask = { 
        id: newId, 
        assignee: currentUser === 'Gerente' || currentUser === 'Planejamento' ? 'Tiago' : currentUser, 
        task: '' 
      };
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        maintenanceTasks: [...maintenanceTasks, newTask]
      });
      setEditingMaintenance(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleUpdateMaintenance = async (id: string, field: 'task' | 'assignee', value: string) => {
    try {
      const newTasks = maintenanceTasks.map(t => t.id === id ? { ...t, [field]: value } : t);
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        maintenanceTasks: newTasks
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleRemoveMaintenance = async (id: string) => {
    try {
      const newTasks = maintenanceTasks.filter(t => t.id !== id);
      await updateDoc(doc(db, 'globalConfig', 'main'), {
        maintenanceTasks: newTasks
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'globalConfig/main');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'Pendente' | 'Concluído') => {
    try {
      const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const todayKey = days[new Date().getDay()];
      
      await updateDoc(doc(db, 'products', taskId), {
        status: newStatus,
        [`history.${todayKey}`]: newStatus === 'Concluído',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${taskId}`);
    }
  };

  const handleToggleNewProduct = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await updateDoc(doc(db, 'products', taskId), {
        isNew: !task?.isNew,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${taskId}`);
    }
  };

  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayKey = days[new Date().getDay()];
  const weekDayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  // Calculate statistics based on view and user
  let statsTotal = 0;
  let statsCompleted = 0;

  if (currentUser === 'Gerente') {
    if (managerView === 'daily') {
      const activeTasks = tasks.filter(t => (weeklyPlans[t.id]?.[todayKey] ?? 0) > 0);
      statsTotal = activeTasks.length;
      statsCompleted = activeTasks.filter(t => weeklyHistory[t.id]?.[todayKey]).length;
    } else {
      // Weekly stats
      tasks.forEach(task => {
        weekDayKeys.forEach(day => {
          if ((weeklyPlans[task.id]?.[day] ?? 0) > 0) {
            statsTotal++;
            if (weeklyHistory[task.id]?.[day]) {
              statsCompleted++;
            }
          }
        });
      });
    }
  } else if (currentUser !== 'Planejamento') {
    const userTasksToday = tasks.filter(t => 
      (t.assignee || '').trim().toLowerCase() === (currentUser || '').trim().toLowerCase() && (weeklyPlans[t.id]?.[todayKey] ?? 0) > 0
    );
    statsTotal = userTasksToday.length;
    statsCompleted = userTasksToday.filter(t => weeklyHistory[t.id]?.[todayKey]).length;
  }

  const activeColor = teamColors[currentUser] || teamColors.Gerente;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ChefHat className="w-12 h-12 text-amber-500 animate-bounce" />
          <p className="text-stone-400 font-serif italic">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl border border-stone-100 max-w-md w-full text-center"
        >
          <div className="inline-flex p-5 bg-amber-500 rounded-3xl shadow-xl shadow-amber-500/20 mb-8">
            <ChefHat className="w-10 h-10 text-stone-950" />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 font-serif italic mb-4">Padaria Mil Delícias</h1>
          <p className="text-stone-500 mb-10 leading-relaxed">Painel de Produção & Gerenciamento. Acesse para acompanhar as metas do dia.</p>
          
          <button 
            disabled={isLoggingIn}
            onClick={async () => {
              console.log("Tentando entrar com Google...");
              setIsLoggingIn(true);
              try {
                await signIn();
              } catch (e) {
                console.error("Login failed:", e);
              } finally {
                setIsLoggingIn(false);
              }
            }}
            className={`w-full ${isLoggingIn ? 'bg-stone-500 scale-[0.98]' : 'bg-stone-900'} text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-lg hover:shadow-stone-900/10 active:scale-[0.98] group`}
          >
            {isLoggingIn ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              <>
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Entrar com Google
              </>
            )}
          </button>
          
          <div className="mt-8 pt-8 border-t border-stone-50 space-y-4">
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest text-center">Problemas ao entrar?</p>
            <div className="grid grid-cols-1 gap-2 text-left">
              <div className="bg-stone-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-stone-600 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" /> Erro de Cookies?
                </p>
                <p className="text-[10px] text-stone-400 leading-tight">
                  No tablet/celular, use o <b>Chrome</b>. Se aparecer "Cookies Desativados", desabilite o "Bloqueio de rastreamento entre sites" ou "Anti-rastreamento inteligente" nas configurações do navegador.
                </p>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-stone-600 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-sky-500" /> Navegação Privada?
                </p>
                <p className="text-[10px] text-stone-400 leading-tight">
                  Tente não usar o modo anônimo, pois ele bloqueia cookies necessários para o Google validar sua conta.
                </p>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-stone-600 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" /> Navegador Recomendado
                </p>
                <p className="text-[10px] text-stone-400 leading-tight">
                  Evite abrir o link diretamente pelo WhatsApp. Copie o link e cole diretamente no <b>Google Chrome</b> para garantir que os cookies funcionem corretamente.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fdfcfb] select-none">
      {/* Sidebar - Fixed to the viewport */}
      <aside className="w-12 md:w-40 bg-stone-900 text-white flex flex-col items-center py-6 md:py-8 fixed inset-y-0 left-0 z-50 shadow-2xl transition-all duration-300">
        <div className="bg-amber-500 p-1.5 md:p-2 rounded-xl mb-8 md:mb-12 shadow-lg shadow-amber-500/20">
          <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-stone-950" />
        </div>

        <div className="w-full px-1 md:px-4 flex-1 flex flex-col gap-2 md:gap-3 overflow-y-auto no-scrollbar">
          <p className="text-[7px] md:text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 md:mb-2 px-1 text-center md:text-left">Equipe</p>
          {teamMembers.map((member) => {
            const memberColor = teamColors[member] || teamColors.Gerente || TEAM_COLORS.Gerente;
            const isActive = currentUser === member;
            return (
              <button
                key={member}
                onClick={() => setCurrentUser(member)}
                title={member}
                className={`w-full flex items-center justify-center md:justify-start gap-3 p-2 md:p-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? `${memberColor.bg} text-stone-950 shadow-md shadow-amber-500/10 font-bold` 
                    : `text-stone-500 hover:text-white hover:bg-stone-800`
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs truncate hidden md:block">{member}</span>
              </button>
            );
          })}
          
          <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-stone-800 space-y-2">
            {!isManagerAuthenticated ? (
              <div className="px-1">
                {!showPasswordInput ? (
                  <button
                    onClick={() => setShowPasswordInput(true)}
                    className="w-full flex items-center justify-center md:justify-start gap-3 p-2 rounded-xl transition-all text-stone-600 hover:text-white hover:bg-stone-800"
                    title="Acesso Gerente"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-serif italic hidden md:block">Gerente</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      type="password"
                      placeholder="PW"
                      value={managerCodeInput}
                      onChange={(e) => {
                        setManagerCodeInput(e.target.value);
                        if (e.target.value === '1234') {
                          setIsManagerAuthenticated(true);
                          setCurrentUser('Gerente');
                          setShowPasswordInput(false);
                          setManagerCodeInput('');
                        }
                      }}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-0.5 md:px-3 py-1.5 text-[9px] md:text-[10px] text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setCurrentUser('Gerente')}
                  title="Dashboard Gerente"
                  className={`w-full flex items-center justify-center md:justify-start gap-3 p-2 rounded-xl transition-all ${
                    currentUser === 'Gerente' 
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/20' 
                      : 'text-stone-500 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-serif italic hidden md:block">Gerente</span>
                </button>
                <button
                  onClick={() => setCurrentUser('Planejamento')}
                  title="Planejamento Semanal"
                  className={`w-full flex items-center justify-center md:justify-start gap-3 p-2 rounded-xl transition-all ${
                    currentUser === 'Planejamento' 
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/20' 
                      : 'text-stone-500 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <CalendarRange className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-serif italic hidden md:block">Planejamento</span>
                </button>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={() => signOut()}
          className="p-3 text-red-500/20 hover:text-red-500 transition-colors mt-auto shrink-0"
          title="Sair"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </aside>

      {/* Main Content - Pushed by the fixed sidebar */}
      <main className="flex-1 ml-12 md:ml-40 p-3 md:p-10 relative flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-4 md:mb-8 pb-3 md:pb-4 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold font-serif italic text-stone-800">
              {currentUser === 'Gerente' ? 'Gerenciamento' : currentUser === 'Planejamento' ? 'Planejamento' : `Olá, ${currentUser}!`}
            </h2>
            <p className="text-stone-400 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-0.5 md:mt-1">
              {currentUser === 'Gerente' ? (managerView === 'daily' ? 'Visão Geral Diária' : 'Acompanhamento Semanal') : currentUser === 'Planejamento' ? 'Metas de Produção Semanal' : 'Sua programação diária'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {currentUser === 'Gerente' && (
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button 
                  onClick={() => setManagerView('daily')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    managerView === 'daily' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setManagerView('weekly')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    managerView === 'weekly' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Semana
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {currentUser === 'Gerente' && (
              <ProductionPlanningTable 
                tasks={tasks} 
                teamMembers={teamMembers}
                teamColors={teamColors} 
                weeklyHistory={weeklyHistory}
                weeklyPlans={weeklyPlans}
                view={managerView}
                onUpdateProductAssignee={handleUpdateProductAssignee}
              />
            )}
            {currentUser === 'Planejamento' && (
              <PlanningGrid 
                tasks={tasks}
                weeklyPlans={weeklyPlans} 
                teamMembers={teamMembers}
                teamColors={teamColors}
                onUpdatePlan={handleUpdatePlan}
                onSaveWeeklyPlans={handleSaveWeeklyPlans}
                onAddProduct={handleAddProduct}
                onRemoveProduct={handleRemoveProduct}
                onMoveProduct={handleMoveProduct}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onRemoveMember={handleRemoveMember}
                onToggleNewProduct={handleToggleNewProduct}
                onUpdateProductAssignee={handleUpdateProductAssignee}
              />
            )}
            {currentUser !== 'Gerente' && currentUser !== 'Planejamento' && (
              <ProductionPanel 
                tasks={tasks} 
                userName={currentUser as TeamMember} 
                onUpdateStatus={handleUpdateStatus} 
                teamColors={teamColors}
                weeklyPlans={weeklyPlans}
              />
            )}

            {/* Stats Cards */}
            {currentUser !== 'Planejamento' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group">
                  <StatsCard 
                    title={currentUser === 'Gerente' && managerView === 'weekly' ? "Total na Semana" : "Total de Itens"} 
                    value={statsTotal} 
                    icon={Package} 
                    color="bg-stone-950"
                  />
                  <div className="absolute top-2 right-4 text-white/5 font-black text-6xl pointer-events-none group-hover:text-white/10 transition-colors leading-none">
                    {statsTotal}
                  </div>
                </div>
                <StatsCard 
                  title={currentUser === 'Gerente' ? (managerView === 'weekly' ? "Produção semanal" : "Produção Diária") : "Já Concluídos"} 
                  value={statsCompleted} 
                  icon={CheckCircle2} 
                  trend={`${statsTotal > 0 ? Math.round((statsCompleted / statsTotal) * 100) : 100}% concluído`}
                  color="bg-emerald-500"
                />
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
            {/* Important Notices Section */}
            {currentUser === 'Planejamento' ? (
              <div className="space-y-6 mt-12 md:mt-0">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">Gestão de Avisos</p>
                  </div>
                  <button 
                    onClick={() => setEditingNotice(!editingNotice)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      editingNotice ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {editingNotice ? 'Pronto' : 'Editar'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {teamMembers.map(member => (
                    <div key={member} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm relative group/notices">
                      <div className="flex items-center justify-between mb-3 border-b border-stone-50 pb-2">
                         <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-widest">{member}</h4>
                         <button onClick={() => handleAddNotice(member)} className="p-1 text-stone-300 hover:text-amber-600 transition-colors">
                           <Plus className="w-4 h-4" />
                         </button>
                      </div>
                      <ul className="space-y-2">
                        {(notices[member] || []).map((notice, idx) => (
                          <li key={idx} className="flex items-start gap-2 group/item">
                            {editingNotice ? (
                              <div className="flex-1 flex gap-2">
                                <input 
                                  autoFocus={idx === (notices[member]?.length || 0) - 1 && notice === ''}
                                  value={notice}
                                  onChange={(e) => handleUpdateNotice(member, idx, e.target.value)}
                                  className="text-[11px] text-stone-600 font-medium flex-1 bg-amber-50/30 border-amber-100 border rounded-lg px-2 py-1 outline-amber-500"
                                />
                                <button onClick={() => handleRemoveNotice(member, idx)} className="text-red-300 hover:text-red-500">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <p className="text-[11px] text-stone-600 leading-tight font-medium flex-1">{notice}</p>
                              </>
                            )}
                          </li>
                        ))}
                        {(!notices[member] || notices[member].length === 0) && (
                          <li className="text-[10px] text-stone-300 italic">Nenhum aviso.</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentUser !== 'Gerente' ? (
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm relative">
                 <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-3">
                    <h4 className="text-sm font-bold font-serif italic text-stone-800">Seus Avisos Importantes</h4>
                 </div>
                 <ul className="space-y-4">
                   {(notices[currentUser] || []).map((notice, idx) => (
                     <li key={idx} className="flex items-start gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                       <p className="text-xs text-stone-600 leading-relaxed font-medium flex-1">{notice}</p>
                     </li>
                   ))}
                   {(!notices[currentUser] || notices[currentUser].length === 0) && (
                     <li className="text-[10px] text-stone-400 italic">Você não possui avisos hoje.</li>
                   )}
                 </ul>
              </div>
            ) : null}

              {/* Cleaning Task Section */}
              {currentUser === 'Planejamento' ? (
                <div className="space-y-6 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2 px-1">
                    <Trash2 className="w-3.5 h-3.5 text-sky-500" />
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">Gestão de Manutenção</p>
                  </div>
                  {teamMembers.map(member => (
                    <div key={member} className="bg-sky-50/30 p-6 rounded-3xl border border-sky-100 shadow-sm group/maint">
                      <div className="flex items-center justify-between mb-4 border-b border-sky-200/50 pb-2">
                        <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Manutenção {member}</h4>
                        <div className="flex gap-1 opacity-0 group-hover/maint:opacity-100 transition-opacity">
                          <button onClick={() => setEditingMaintenance(!editingMaintenance)} className="p-1 text-sky-500 hover:text-sky-900">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setMaintenanceTasks(prev => [...prev, { id: Math.random().toString(), assignee: member, task: '' }]);
                              setEditingMaintenance(true);
                            }} 
                            className="p-1 text-sky-500 hover:text-sky-900"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {maintenanceTasks.filter(t => t.assignee === member).map((t) => (
                          <div key={t.id} className="flex justify-between items-center text-xs group/task">
                            {editingMaintenance ? (
                              <input 
                                value={t.task}
                                onChange={(e) => handleUpdateMaintenance(t.id, 'task', e.target.value)}
                                placeholder="Nova tarefa..."
                                className="text-sky-900 italic flex-1 bg-white border-sky-100 border rounded px-1 outline-sky-500 mr-2"
                              />
                            ) : (
                              <span className="text-sky-700 italic">{t.task}</span>
                            )}
                            {editingMaintenance && (
                              <button onClick={() => handleRemoveMaintenance(t.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {maintenanceTasks.filter(t => t.assignee === member).length === 0 && (
                          <div className="text-[10px] text-sky-300 italic">Nenhuma tarefa definida.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentUser !== 'Gerente' && currentUser !== 'Planejamento' ? (
                <div className="bg-stone-900 p-6 rounded-3xl shadow-lg relative overflow-hidden group border border-stone-800">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                    <Trash2 className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">Sua Manutenção Semanal</h4>
                  <div className="space-y-3 relative z-10">
                    {maintenanceTasks.filter(t => t.assignee === currentUser).map(t => (
                      <div key={t.id}>
                        <p className="text-white font-serif italic text-lg leading-tight">{t.task}</p>
                      </div>
                    ))}
                    {maintenanceTasks.filter(t => t.assignee === currentUser).length === 0 && (
                      <p className="text-stone-500 text-xs italic">Nenhuma tarefa para esta semana.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

