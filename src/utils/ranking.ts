import type { OfficerRanking, RankingCriterion, Task, User } from '../types';

type CriterionConfig = {
  criterion: RankingCriterion['criterion'];
  name: string;
  taskTitle: string;
  maxScore: number;
  bonusMode?: 'fullWhen100' | 'fullWhen50';
};

const CRITERIA: CriterionConfig[] = [
  { criterion: 1, name: 'Tổng thu trên địa bàn', taskTitle: 'Số thu', maxScore: 1 },
  { criterion: 2, name: 'Quản lý khai thuế', taskTitle: 'Kê khai thuế', maxScore: 3 },
  { criterion: 3, name: 'Quản lý rủi ro hóa đơn, kê khai HKD', taskTitle: 'Quản lý rủi ro HKD', maxScore: 2 },
  { criterion: 4, name: 'Kiểm tra hộ kinh doanh', taskTitle: 'Kiểm tra HKD', maxScore: 2 },
  { criterion: 5, name: 'Rà soát gói dữ liệu hộ kinh doanh > 1 tỷ', taskTitle: 'Rà soát TMĐT', maxScore: 2 },
  { criterion: 6, name: 'Hỗ trợ hóa đơn điện tử', taskTitle: 'Hỗ trợ hóa đơn điện tử', maxScore: 0.5, bonusMode: 'fullWhen100' },
  { criterion: 7, name: 'Chuyển đổi lên doanh nghiệp', taskTitle: 'Chuyển đổi lên doanh nghiệp', maxScore: 0.5, bonusMode: 'fullWhen50' },
  { criterion: 8, name: 'Nộp thuế điện tử', taskTitle: 'Nộp thuế điện tử', maxScore: 1 },
];

function getParticipantRate(tasks: Task[], taskTitle: string, userId: string): number {
  const participant = tasks
    .filter((task) => task.title === taskTitle)
    .flatMap((task) => task.participants)
    .find((item) => item.userId === userId);

  if (!participant || participant.assigned <= 0) return 0;
  return Math.min(100, Math.max(0, (participant.completed / participant.assigned) * 100));
}

function calculateCriterionScore(config: CriterionConfig, rate: number): number {
  if (config.bonusMode === 'fullWhen100') return rate >= 100 ? config.maxScore : 0;
  if (config.bonusMode === 'fullWhen50') return rate >= 50 ? config.maxScore : 0;
  return Math.min(config.maxScore, (rate / 100) * config.maxScore);
}

export function calculateOfficerRankings(tasks: Task[], users: User[]): OfficerRanking[] {
  const rankings = users.map((user) => {
    const criteria = CRITERIA.map((config) => {
      const rate = getParticipantRate(tasks, config.taskTitle, user.id);
      const score = calculateCriterionScore(config, rate);

      return {
        criterion: config.criterion,
        name: config.name,
        maxScore: config.maxScore,
        rate: Math.round(rate),
        score: Math.round(score * 100) / 100,
      };
    });
    const totalScore = Math.round(criteria.reduce((sum, item) => sum + item.score, 0) * 100) / 100;

    return {
      userId: user.id,
      userName: user.name,
      totalScore,
      rank: 0,
      criteria,
    };
  });

  return rankings
    .sort((a, b) => b.totalScore - a.totalScore || a.userName.localeCompare(b.userName, 'vi'))
    .map((ranking, index) => ({ ...ranking, rank: index + 1 }));
}
