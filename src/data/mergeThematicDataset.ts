import type { AppDataset, WorkItem } from '../domain/models';
import { migrateDataset } from './localStorageRepository';

export function mergeThematicDataset(
  current: AppDataset,
  incoming: AppDataset,
  themeTaskIds: string[] = []
): AppDataset {
  const nextWorkItems: WorkItem[] = [...current.workItems];
  const filterByTheme = themeTaskIds.length > 0;

  // For incoming items, update existing or append
  for (const item of incoming.workItems) {
    if (filterByTheme && !themeTaskIds.includes(item.taskDefinitionId)) {
      continue;
    }
    const existingIndex = nextWorkItems.findIndex(
      (w) =>
        w.teamId === item.teamId &&
        w.officerId === item.officerId &&
        w.taskDefinitionId === item.taskDefinitionId
    );

    if (existingIndex >= 0) {
      nextWorkItems[existingIndex] = {
        ...nextWorkItems[existingIndex],
        assigned: item.assigned,
        completed: item.completed,
        deadline: item.deadline,
        status: item.status,
        updatedAt: new Date().toISOString(),
      };
    } else {
      nextWorkItems.push({
        ...item,
        id: item.id || `THEME-${item.teamId}-${item.officerId}-${item.taskDefinitionId}-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Ensure any task definitions from incoming are registered
  const taskMap = new Map(current.taskDefinitions.map((t) => [t.id, t]));
  for (const t of incoming.taskDefinitions) {
    if (!taskMap.has(t.id)) {
      taskMap.set(t.id, t);
    }
  }

  // Ensure any officers from incoming are registered
  const officerMap = new Map(current.officers.map((o) => [o.id, o]));
  for (const o of incoming.officers) {
    if (!officerMap.has(o.id)) {
      officerMap.set(o.id, o);
    }
  }

  const merged: AppDataset = {
    schemaVersion: 1,
    teams: structuredClone(current.teams),
    officers: Array.from(officerMap.values()),
    taskDefinitions: Array.from(taskMap.values()),
    workItems: nextWorkItems,
    updatedAt: new Date().toISOString(),
  };

  return migrateDataset(merged);
}
