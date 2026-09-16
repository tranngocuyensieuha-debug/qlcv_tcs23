import type { AppDataset, TaskDefinition } from '../domain/models';
import { migrateDataset } from './localStorageRepository';

const identity = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi').replace(/\s+/g, ' ');
const sameSemanticTask = (left: TaskDefinition, right: TaskDefinition) => (
  identity(left.name) === identity(right.name)
  && identity(left.category) === identity(right.category)
  && identity(left.unit) === identity(right.unit)
  && identity(left.measurement) === identity(right.measurement)
  && identity(left.reportPeriod) === identity(right.reportPeriod)
);

export function mergeTeamDataset(current: AppDataset, incoming: AppDataset, teamId: string): AppDataset {
  if (!current.teams.some((team) => team.id === teamId)) throw new Error(`Tổ ${teamId} không tồn tại trong dataset hiện tại.`);
  const definitions: TaskDefinition[] = current.taskDefinitions.flatMap((definition) => {
    if (!definition.applicableTeamIds.includes(teamId)) return [structuredClone(definition)];
    const remaining = definition.applicableTeamIds.filter((id) => id !== teamId);
    return remaining.length ? [{ ...definition, applicableTeamIds: remaining }] : [];
  });
  const taskIdMap = new Map<string, string>();
  for (const incomingDefinition of incoming.taskDefinitions) {
    const existing = definitions.find((candidate) => sameSemanticTask(candidate, incomingDefinition));
    if (existing) {
      existing.applicableTeamIds = [...new Set([...existing.applicableTeamIds, teamId])];
      taskIdMap.set(incomingDefinition.id, existing.id);
    } else {
      let nextId = incomingDefinition.id;
      for (let suffix = 1; definitions.some((candidate) => candidate.id === nextId); suffix += 1) nextId = `${incomingDefinition.id}--${teamId}-${suffix}`;
      definitions.push({ ...structuredClone(incomingDefinition), id: nextId, applicableTeamIds: [teamId] });
      taskIdMap.set(incomingDefinition.id, nextId);
    }
  }
  const merged: AppDataset = {
    schemaVersion: 1,
    teams: structuredClone(current.teams),
    officers: [...current.officers.filter((officer) => officer.teamId !== teamId), ...incoming.officers.map((officer) => ({ ...structuredClone(officer), teamId }))],
    taskDefinitions: definitions,
    workItems: [...current.workItems.filter((item) => item.teamId !== teamId), ...incoming.workItems.map((item) => ({ ...structuredClone(item), teamId, taskDefinitionId: taskIdMap.get(item.taskDefinitionId) ?? item.taskDefinitionId }))],
    updatedAt: incoming.updatedAt,
  };
  return migrateDataset(merged);
}
