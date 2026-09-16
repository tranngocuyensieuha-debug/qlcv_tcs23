export type AccountRole = 'lead' | 'team';

interface SessionAccountBase {
  id: string;
  label: string;
}

export type SessionAccount = SessionAccountBase & (
  | { role: 'lead'; teamId?: never }
  | { role: 'team'; teamId: string }
);

export interface Team {
  id: string;
  name: string;
  shortName: string;
}

export interface Officer {
  id: string;
  name: string;
  title: string;
  teamId: string;
  area: string;
  areaDetail?: string;
  dataStatus?: string;
}

export interface TaskDefinition {
  id: string;
  name: string;
  category: string;
  unit: string;
  measurement: string;
  reportPeriod: string;
  applicableTeamIds: string[];
}

export type WorkStatus = 'todo' | 'in_progress' | 'waiting' | 'done';

export interface WorkItem {
  id: string;
  taskDefinitionId: string;
  teamId: string;
  officerId: string;
  taxpayerCode?: string;
  subjectName?: string;
  assigned: number;
  completed: number;
  deadline: string;
  status: WorkStatus;
  updatedAt: string;
}

export interface AppDataset {
  schemaVersion: number;
  teams: Team[];
  officers: Officer[];
  taskDefinitions: TaskDefinition[];
  workItems: WorkItem[];
  updatedAt: string;
}
