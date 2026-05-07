import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { getProductionInsights } from '../services/geminiService';
import { PRODUCTION_TASKS } from '../constants';
import { ProductionTask } from '../types';

interface Insight {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
}

export function AIAssistant({ tasks }: { tasks: ProductionTask[] }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      const data = await getProductionInsights(tasks);
      setInsights(data.insights || []);
      setLoading(false);
    }
    fetchInsights();
  }, [tasks.length]); // Refresh when quantity of tasks changes or just on mount for this demo

  return (
    <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-24 h-24 rotate-12" />
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500 p-2 rounded-xl">
          <Sparkles className="w-5 h-5 text-stone-950" />
        </div>
        <h3 className="text-xl font-bold font-serif italic text-amber-500">Inteligência da Chef</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          <AnimatePresence>
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700 hover:border-amber-500/50 transition-colors cursor-default"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    insight.type === 'warning' ? 'bg-red-500' : 
                    insight.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{insight.title}</span>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">{insight.description}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <button className="w-full mt-4 flex items-center justify-between text-stone-400 hover:text-white text-xs font-medium group/btn">
            Ver plano detalhado de produção
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
