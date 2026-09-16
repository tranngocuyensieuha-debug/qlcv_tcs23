import type { Task } from '../types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMoveParticipant: (sourceTaskId: string, targetTaskId: string, userId: string) => void;
  onUpdateParticipantAssigned: (taskId: string, userId: string, assigned: number) => void;
  onUpdateParticipantCompleted: (taskId: string, userId: string, completed: number) => void;
  onUpdateTaskDeadline: (taskId: string, deadline: string) => void;
  onUpdateParticipantDeadline: (taskId: string, userId: string, deadline: string) => void;
}

export default function TaskBoard({
  tasks,
  onEdit,
  onDelete,
  onMoveParticipant,
  onUpdateParticipantAssigned,
  onUpdateParticipantCompleted,
  onUpdateTaskDeadline,
  onUpdateParticipantDeadline,
}: TaskBoardProps) {
  return (
    <div className="bg-[#f4f5f7] p-4">
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onMoveParticipant={onMoveParticipant}
            onUpdateParticipantAssigned={onUpdateParticipantAssigned}
            onUpdateParticipantCompleted={onUpdateParticipantCompleted}
            onUpdateTaskDeadline={onUpdateTaskDeadline}
            onUpdateParticipantDeadline={onUpdateParticipantDeadline}
          />
        ))}
      </div>
    </div>
  );
}
