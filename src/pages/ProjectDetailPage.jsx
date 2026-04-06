import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, CheckSquare, Clock, FolderOpen, Plus, Users } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TaskModal from "../components/modals/TaskModal";
import ProjectTaskComposer from "../components/project/ProjectTaskComposer";
import ProjectTaskList from "../components/project/ProjectTaskList";
import ProjectWorkspaceSidebar from "../components/project/ProjectWorkspaceSidebar";
import { Avatar, LoadingScreen, ProgressBar, StatusBadge } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDate, minutesToHours } from "../utils/helpers";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pes, setPes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadWorkspace = async () => {
      setLoading(true);
      try {
        const [projectsRes, projectRes, vendorsRes, pesRes] = await Promise.all([
          api.get("/projects"),
          api.get(`/projects/${id}`),
          api.get(`/vendors?project=${id}`).catch(() => ({ data: { vendors: [] } })),
          api.get("/users/pes").catch(() => ({ data: { pes: [] } })),
        ]);

        let tasksRes;
        try {
          tasksRes = await api.get(`/tasks/project/${id}`);
        } catch {
          tasksRes = await api.get(`/tasks?project=${id}`);
        }

        if (!isMounted) return;

        setProjects(projectsRes.data.projects);
        setProject(projectRes.data.project);
        setTasks(tasksRes.data.tasks);
        setVendors(vendorsRes.data.vendors);
        setPes(pesRes.data.pes);
      } catch {
        if (isMounted) navigate("/projects");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWorkspace();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <LoadingScreen />
      </AppLayout>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const activeTasks = tasks.filter((task) => task.status === "in_progress").length;
  const todoTasks = tasks.filter((task) => task.status === "pending").length;
  const trackedTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
  const completedVendors = vendors.filter((vendor) => vendor.status === "completed").length;

  const handleTaskCreated = (task) => {
    setTasks((current) => [task, ...current]);
  };

  const handleTaskSaved = (task, mode) => {
    if (!task) return;
    if (mode === "created") {
      setTasks((current) => [task, ...current]);
    } else {
      setTasks((current) => current.map((item) => (item._id === task._id ? task : item)));
    }
    setEditTask(null);
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col xl:flex-row">
          <ProjectWorkspaceSidebar
            projects={projects}
            currentProjectId={project._id}
            currentProject={project}
            taskCount={tasks.length}
          />

          <section className="flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-surface/92 backdrop-blur-md">
              <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                  <button
                    onClick={() => navigate("/projects")}
                    className="mt-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/45 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <ArrowLeft size={15} />
                  </button>

                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
                      <FolderOpen size={12} />
                      Project Workspace
                    </div>
                    <h1 className="mt-3 text-3xl font-display font-bold text-white truncate">{project.name}</h1>
                    <p className="text-sm text-white/40 mt-1">
                      {project.clientName}
                      {project.description ? ` • ${project.description}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={project.status} />
                  <Link to="/projects" className="btn-secondary">
                    All Projects
                  </Link>
                  {isAdmin && (
                    <button onClick={() => setEditTask({ project: project._id })} className="btn-primary">
                      <Plus size={15} />
                      Quick Task
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-5 flex-wrap">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-w-[280px]">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-white/35">To Do</p>
                      <p className="mt-2 text-2xl font-display font-bold text-white">{todoTasks}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-white/35">In Progress</p>
                      <p className="mt-2 text-2xl font-display font-bold text-white">{activeTasks}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-white/35">Done</p>
                      <p className="mt-2 text-2xl font-display font-bold text-white">{completedTasks}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-white/35">Tracked Time</p>
                      <p className="mt-2 text-2xl font-display font-bold text-white">{minutesToHours(trackedTime)}</p>
                    </div>
                  </div>

                  <div className="w-full lg:w-[320px] rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-white/35">Project completion</span>
                      <span className="text-white font-medium">{project.completionPercentage}%</span>
                    </div>
                    <ProgressBar value={project.completionPercentage} color={project.color} />
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-white/35 text-xs">Scope</p>
                        <p className="mt-1 text-white font-medium">{project.completedScope}/{project.totalScope}</p>
                      </div>
                      <div>
                        <p className="text-white/35 text-xs">Vendors</p>
                        <p className="mt-1 text-white font-medium">{completedVendors}/{vendors.length} complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                <div className="space-y-6">
                  <ProjectTaskComposer
                    projectId={project._id}
                    canCreate={isAdmin}
                    users={pes}
                    onTaskCreated={handleTaskCreated}
                  />

                  <ProjectTaskList
                    tasks={tasks}
                    canEdit
                    onEditTask={setEditTask}
                  />
                </div>

                <div className="space-y-6">
                  <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <h3 className="text-lg font-display font-bold text-white">Team</h3>
                    <p className="text-sm text-white/35 mt-1">People assigned to this project workspace.</p>
                    <div className="mt-4 space-y-3">
                      {project.assignedPEs?.length ? project.assignedPEs.map((pe) => (
                        <div key={pe._id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                          <Avatar name={pe.name} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{pe.name}</p>
                            <p className="text-xs text-white/30 truncate">{pe.email}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-white/30">No PEs assigned yet.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <h3 className="text-lg font-display font-bold text-white">Project Details</h3>
                    <div className="mt-4 space-y-3 text-sm text-white/70">
                      <div className="flex items-center gap-3">
                        <Users size={14} className="text-white/35" />
                        <span>{project.assignedPEs?.length || 0} team members assigned</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Building2 size={14} className="text-white/35" />
                        <span>{vendors.length} vendor records linked</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckSquare size={14} className="text-white/35" />
                        <span>{tasks.length} tasks in this project</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-white/35" />
                        <span>{minutesToHours(trackedTime)} tracked across tasks</span>
                      </div>
                      {project.startDate && (
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-white/35" />
                          <span>Started {formatDate(project.startDate)}</span>
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-white/35" />
                          <span>Due {formatDate(project.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <TaskModal
        isOpen={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask?._id ? editTask : null}
        onSaved={handleTaskSaved}
        fixedProjectId={project._id}
        hideProjectField
      />
    </AppLayout>
  );
}
