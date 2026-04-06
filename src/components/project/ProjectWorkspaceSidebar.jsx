import React from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Layers3, Users, CheckSquare, ChevronRight } from "lucide-react";
import { Avatar, ProgressBar, StatusBadge } from "../shared/UIComponents";

export default function ProjectWorkspaceSidebar({
  projects,
  currentProjectId,
  currentProject,
  taskCount,
}) {
  return (
    <aside className="w-full xl:w-80 xl:min-w-80 border-r border-white/[0.06] bg-white/[0.02]">
      <div className="p-5 border-b border-white/[0.06]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/25 mb-2">Projects</p>
        <h2 className="text-xl font-display font-bold text-white">Workspace</h2>
        <p className="text-sm text-white/35 mt-1">
          Open a project to manage its own tasks, people, and delivery flow.
        </p>
      </div>

      {currentProject && (
        <div className="p-5 border-b border-white/[0.06] space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center border"
              style={{ background: `${currentProject.color}18`, borderColor: `${currentProject.color}33` }}
            >
              <FolderOpen size={18} style={{ color: currentProject.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentProject.name}</p>
              <p className="text-xs text-white/35 truncate">{currentProject.clientName}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[11px] text-white/30">Tasks</p>
              <p className="text-lg font-display font-bold text-white mt-1">{taskCount}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[11px] text-white/30">Team</p>
              <p className="text-lg font-display font-bold text-white mt-1">{currentProject.assignedPEs?.length || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[11px] text-white/30">Done</p>
              <p className="text-lg font-display font-bold text-white mt-1">{currentProject.completionPercentage}%</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-white/35">Vendor progress</span>
              <span className="text-white font-medium">{currentProject.completedScope}/{currentProject.totalScope}</span>
            </div>
            <ProgressBar value={currentProject.completionPercentage} color={currentProject.color} />
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={currentProject.status} />
            <div className="flex -space-x-2">
              {currentProject.assignedPEs?.slice(0, 4).map((pe) => (
                <Avatar key={pe._id} name={pe.name} size="sm" className="border-2 border-surface" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-2 max-h-[calc(100vh-19rem)] overflow-y-auto">
        {projects.map((project) => {
          const active = project._id === currentProjectId;
          return (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className={`block rounded-2xl border px-4 py-3 transition-all ${
                active
                  ? "bg-white/[0.09] border-white/[0.12]"
                  : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{ background: `${project.color}18`, borderColor: `${project.color}33` }}
                >
                  <FolderOpen size={15} style={{ color: project.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{project.name}</p>
                    <ChevronRight size={14} className={active ? "text-white/70" : "text-white/20"} />
                  </div>
                  <p className="text-xs text-white/30 truncate mt-0.5">{project.clientName}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-white/35">
                    <span className="inline-flex items-center gap-1"><CheckSquare size={11} />{project.taskSummary?.total || 0}</span>
                    <span className="inline-flex items-center gap-1"><Users size={11} />{project.assignedPEs?.length || 0}</span>
                    <span className="inline-flex items-center gap-1"><Layers3 size={11} />{project.status === "on_hold" ? "On Hold" : project.status}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
