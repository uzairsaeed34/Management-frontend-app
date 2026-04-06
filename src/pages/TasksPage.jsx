import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckSquare, FolderOpen, ListTodo, Plus, Users } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { Avatar, EmptyState, LoadingScreen, ProgressBar, StatusBadge } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function TasksPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/projects");
        if (!isMounted) return;
        setProjects(data.projects || []);
        if (data.projects?.length) {
          setSelectedProjectId((current) => current || data.projects[0]._id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  if (loading) {
    return (
      <AppLayout>
        <LoadingScreen />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="Tasks" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <section className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(61,90,255,0.16),rgba(255,255,255,0.03))] p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-300">
                  <ListTodo size={12} />
                  Project-Based Tasks
                </div>
                <h1 className="mt-3 text-3xl font-display font-bold text-white">
                  Manage tasks through project workspaces
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/40">
                  Tasks now belong to projects, not a single global list. Open a project workspace to create,
                  view, and manage the tasks for that project only.
                </p>
              </div>

              {selectedProject && (
                <button
                  onClick={() => navigate(`/projects/${selectedProject._id}`)}
                  className="btn-primary"
                >
                  <FolderOpen size={15} />
                  Open Selected Workspace
                </button>
              )}
            </div>
          </section>

          {projects.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No project workspaces yet"
              description="Create a project first, then start adding tasks inside that project."
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="text-lg font-display font-bold text-white">Projects</h2>
                  <p className="text-sm text-white/35 mt-1">Select a project to work on its tasks.</p>
                </div>
                <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
                  {projects.map((project) => {
                    const isActive = project._id === selectedProject?._id;
                    return (
                      <button
                        key={project._id}
                        onClick={() => setSelectedProjectId(project._id)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${
                          isActive
                            ? "bg-white/[0.09] border-white/[0.12]"
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0"
                            style={{ background: `${project.color}18`, borderColor: `${project.color}33` }}
                          >
                            <FolderOpen size={16} style={{ color: project.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-white truncate">{project.name}</p>
                              <StatusBadge status={project.status} />
                            </div>
                            <p className="text-xs text-white/30 truncate mt-1">{project.clientName}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-white/35">
                              <span>{project.taskSummary?.total || 0} tasks</span>
                              <span>{project.assignedPEs?.length || 0} people</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                {selectedProject ? (
                  <>
                    <div className="px-6 py-5 border-b border-white/[0.06]">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                            style={{ background: `${selectedProject.color}18`, borderColor: `${selectedProject.color}33` }}
                          >
                            <FolderOpen size={18} style={{ color: selectedProject.color }} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-display font-bold text-white">{selectedProject.name}</h2>
                            <p className="text-sm text-white/35 mt-1">{selectedProject.clientName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <Link to={`/projects/${selectedProject._id}`} className="btn-secondary">
                            Open Workspace
                          </Link>
                          {isAdmin && (
                            <Link to={`/projects/${selectedProject._id}`} className="btn-primary">
                              <Plus size={15} />
                              Create Task
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <p className="text-xs text-white/35">Total Tasks</p>
                          <p className="mt-2 text-2xl font-display font-bold text-white">{selectedProject.taskSummary?.total || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <p className="text-xs text-white/35">To Do</p>
                          <p className="mt-2 text-2xl font-display font-bold text-white">{selectedProject.taskSummary?.pending || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <p className="text-xs text-white/35">In Progress</p>
                          <p className="mt-2 text-2xl font-display font-bold text-white">{selectedProject.taskSummary?.in_progress || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <p className="text-xs text-white/35">Done</p>
                          <p className="mt-2 text-2xl font-display font-bold text-white">{selectedProject.taskSummary?.completed || 0}</p>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-white/35">Project completion</span>
                          <span className="text-white font-medium">{selectedProject.completionPercentage}%</span>
                        </div>
                        <ProgressBar value={selectedProject.completionPercentage} color={selectedProject.color} />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
                        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                          <h3 className="text-lg font-display font-bold text-white">How it works now</h3>
                          <div className="mt-4 space-y-3 text-sm text-white/45">
                            <p>1. Choose a project from the list on the left.</p>
                            <p>2. Open that project workspace.</p>
                            <p>3. Create tasks inside the project page.</p>
                            <p>4. New tasks appear under that project only.</p>
                          </div>
                          <Link
                            to={`/projects/${selectedProject._id}`}
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-brand-500/30 bg-brand-500/12 px-4 py-3 text-sm font-medium text-brand-300 hover:bg-brand-500/20 transition-colors"
                          >
                            Go To Project Task Workspace
                            <ArrowRight size={14} />
                          </Link>
                        </div>

                        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                          <h3 className="text-lg font-display font-bold text-white">Assigned Team</h3>
                          <div className="mt-4 space-y-3">
                            {selectedProject.assignedPEs?.length ? selectedProject.assignedPEs.map((pe) => (
                              <div key={pe._id} className="flex items-center gap-3">
                                <Avatar name={pe.name} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{pe.name}</p>
                                  <p className="text-xs text-white/30 truncate">{pe.email}</p>
                                </div>
                              </div>
                            )) : (
                              <div className="inline-flex items-center gap-2 text-sm text-white/35">
                                <Users size={14} />
                                No team assigned yet
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-10">
                    <EmptyState
                      icon={FolderOpen}
                      title="Choose a project"
                      description="Select a project from the left to open its task workspace."
                    />
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
