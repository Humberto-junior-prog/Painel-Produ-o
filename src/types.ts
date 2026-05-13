export type TeamMember = string;

export interface ProductionTask {
  id: string;
  productName: string;
  quantity: number;
  unit: 'kg' | 'un' | 'bandeja';
  status: 'Pendente' | 'Concluído';
  assignee: TeamMember;
  startTime?: string;
  isNew?: boolean;
  history?: Record<string, boolean>;
  plans?: Record<string, number>;
}

export interface DailyProductionStats {
  totalItems: number;
  completedItems: number;
  startTime: string;
  expectedEndTime: string;
}
