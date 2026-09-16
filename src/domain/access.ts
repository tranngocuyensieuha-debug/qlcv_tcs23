import type { AppDataset, SessionAccount } from './models';

export function scopeDataset(data: AppDataset, account: SessionAccount): AppDataset {
  if (account.role === 'lead') {
    return data;
  }

  return {
    ...data,
    teams: data.teams.filter((team) => team.id === account.teamId),
    officers: data.officers.filter((officer) => officer.teamId === account.teamId),
    taskDefinitions: data.taskDefinitions.filter((task) =>
      task.applicableTeamIds.includes(account.teamId)),
    workItems: data.workItems.filter((workItem) => workItem.teamId === account.teamId),
  };
}
