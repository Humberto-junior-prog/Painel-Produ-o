import { ProductionTask } from './types';

export const PRODUCTION_TASKS: ProductionTask[] = [
  // Tiago - 10 itens
  { id: 't1', productName: 'Sonho Creme', quantity: 10, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't2', productName: 'Sonho Doce de Leite', quantity: 10, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't3', productName: 'Sonho Mousse de Limão', quantity: 8, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't4', productName: 'Sonho Creme de Avelã', quantity: 8, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't5', productName: 'Donuts Chocolate', quantity: 12, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't6', productName: 'Pão de Rabanada', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't7', productName: 'Pão Suíço COM açúcar', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't8', productName: 'Pão Suíço SEM açúcar', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't9', productName: 'Suição', quantity: 10, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  { id: 't10', productName: 'Pão Broa de milho', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Tiago' },
  
  // Guilherme
  { id: 'g1', productName: 'Baguete Parmesão (Manhã)', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g2', productName: 'Baguete Provolone (Manhã)', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g3', productName: 'Baguete Gergelim (Manhã)', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g4', productName: 'Pão Brioche', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g5', productName: 'Pão de Batata', quantity: 30, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g6', productName: 'Pão Mini Hot Dog', quantity: 40, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g7', productName: 'Pão Cervejinha com Queijo', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g8', productName: 'Pão doce creme', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g9', productName: 'Pão doce com coco', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g10', productName: 'Pão doce doce de leite', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g11', productName: 'Pão doce goiabada', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },
  { id: 'g12', productName: 'Pão doce geleia morango', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Guilherme' },

  // Danieli
  { id: 'd1', productName: 'Baguete Parmesão (Tarde)', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd2', productName: 'Baguete Provolone (Tarde)', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd3', productName: 'Baguete Gergelim (Tarde)', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd4', productName: 'Assado de Frango', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd5', productName: 'Assado de Presunto', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd6', productName: 'Assado de Mortadela', quantity: 15, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd7', productName: 'Assado de Hamburguinho', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd8', productName: 'Assado de Hot Dog', quantity: 20, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd9', productName: 'Torrada simples', quantity: 10, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd10', productName: 'Torrada temperada', quantity: 10, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
  { id: 'd11', productName: 'Torrada doce', quantity: 10, unit: 'un', status: 'Pendente', assignee: 'Danieli' },
];

export const TEAM_MEMBERS = ['Tiago', 'Guilherme', 'Danieli'] as const;

export const TEAM_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'Tiago': { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' },
  'Guilherme': { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-100' },
  'Danieli': { bg: 'bg-rose-400', text: 'text-rose-500', border: 'border-rose-100' },
  'Gerente': { bg: 'bg-stone-900', text: 'text-stone-950', border: 'border-stone-200' },
  'Planejamento': { bg: 'bg-stone-900', text: 'text-stone-950', border: 'border-stone-200' }
};
