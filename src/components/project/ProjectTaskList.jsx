import React from "react";
import { Calendar, CheckSquare, Clock, Pencil } from "lucide-react";
import { Avatar, EmptyState, PriorityBadge, StatusBadge } from "../shared/UIComponents";
import { formatDate, minutesToHours } from "../../utils/helpers";

const formatStatusLabel = (status) => {
  const labels = {
    pending: "To Do",
    in_progress: "In Progress",
    completed: "Done",
  };

  return labels[status] || status;
};

export default function ProjectTaskList({ tasks, canEdit, onEditTask }) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-lg font-display font-bold text-white">Project Tasks</h3>
          <p className="text-sm text-white/35 mt-1">All work created in this project appears here only.</p>
        </div>
        <div className="text-sm text-white/40">{tasks.length} task{tasks.length === 1 ? "" : "s"}</div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks in this project"
          description="Create the first task and it will appear here immediately."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-white/[0.02] text-left">
              <tr className="text-[11px] uppercase tracking-[0.16em] text-white/28">
                <th className="px-5 py-3 font-medium">Task</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Assignee</th>
                <th className="px-5 py-3 font-medium">Due Date</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-t border-white/[0.05] align-top">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <p className="text-xs text-white/35 mt-1 max-w-md">
                      {task.description || "No description added yet."}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={task.status} />
                    <p className="text-[11px] text-white/28 mt-2">{formatStatusLabel(task.status)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-5 py-4">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignedTo.name} size="sm" />
                        <div>
                          <p className="text-sm text-white">{task.assignedTo.name}</p>
                          <p className="text-[11px] text-white/30">{task.assignedTo.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-white/30">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {task.dueDate ? (
                      <div className="inline-flex items-center gap-2 text-sm text-white/70">
                        <Calendar size={13} />
                        {formatDate(task.dueDate)}
                      </div>
                    ) : (
                      <span className="text-sm text-white/30">No due date</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 text-sm text-white/70">
                      <div className="inline-flex items-center gap-2">
                        <Clock size={13} />
                        {minutesToHours(task.actualTime || 0)} tracked
                      </div>
                      <p className="text-[11px] text-white/30">
                        {task.estimatedTime ? `${minutesToHours(task.estimatedTime)} estimated` : "No estimate"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {canEdit ? (
                      <button
                        onClick={() => onEditTask?.(task)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    ) : (
                      <span className="text-sm text-white/25">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
