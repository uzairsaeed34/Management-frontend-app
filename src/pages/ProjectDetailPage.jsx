import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, FolderOpen, Edit2, CheckSquare, Building2,
  Users, Calendar, TrendingUp, Clock, Plus,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import TaskModal from "../components/modals/TaskModal";
import {
  StatusBadge, PriorityBadge, ProgressBar, Avatar,
  LoadingScreen, EmptyState, TaskTypeBadge,
} from "../components/shared/UIComponents";
import api from "../utils/api";
import { formatDate, minutesToHours, taskTypeLabels } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-100 border border-white/[0.08] rounded-xl p-3 text-xs shadow-card">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-white/70">{p.name}: <b className="text-white">{p.value}</b></span>
        </div>
      ))}
    </div>
  );
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, vRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/vendors?project=${id}`),
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
      setVendors(vRes.data.vendors);
    } catch {
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <AppLayout><LoadingScreen /></AppLayout>;
  if (!project) return null;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;

  const totalTime = tasks.reduce((a, t) => a + (t.actualTime || 0), 0);
  const completedVendors = vendors.filter((v) => v.status === "completed").length;

  const statusData = [
    { name: "Pending",     value: pendingTasks,   color: "#8b90a7" },
    { name: "In Progress", value: inProgressTasks, color: "#3d5aff" },
    { name: "Completed",   value: completedTasks,  color: "#06d6a0" },
  ].filter((d) => d.value > 0);

  const priorityMap = { high: 0, medium: 0, low: 0 };
  tasks.forEach((t) => { if (priorityMap[t.priority] !== undefined) priorityMap[t.priority]++; });

  const TABS = ["overview", "tasks", "vendors"];

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Custom header */}
        <div className="sticky top-0 z-10 bg-surface/90 glass border-b border-white/[0.07] px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/projects")} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${project.color}20`, border: `1px solid ${project.color}30` }}>
              <FolderOpen size={15} style={{ color: project.color }} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white truncate">{project.name}</h1>
              <p className="text-xs text-white/40">{project.clientName}</p>
            </div>
          </div>
          <StatusBadge status={project.status} />
          {isAdmin && (
            <button onClick={() => setTaskModalOpen(true)} className="btn-primary">
              <Plus size={15} /> New Task
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Scope progress banner */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border" style={{ background: `${project.color}08`, borderColor: `${project.color}20` }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <div className="flex items-center gap-6">
                {[
                  { label: "Initial Scope", value: project.initialScope },
                  { label: "Additional", value: `+${project.additionalScope}` },
                  { label: "Total", value: project.totalScope, highlight: true },
                  { label: "Completed", value: project.completedScope, color: "#06d6a0" },
                  { label: "Remaining", value: project.remainingScope, color: "#ffd166" },
                ].map(({ label, value, highlight, color }) => (
                  <div key={label}>
                    <p className="text-xs text-white/40 mb-0.5">{label}</p>
                    <p className={`text-xl font-bold font-display ${highlight ? "text-white" : ""}`} style={{ color: color || (highlight ? undefined : "white") }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-display" style={{ color: project.color }}>{project.completionPercentage}%</p>
                <p className="text-xs text-white/30">vendor completion</p>
              </div>
            </div>
            <ProgressBar value={project.completionPercentage} color={project.color} />
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: CheckSquare, label: "Total Tasks",    value: tasks.length,          color: "#3d5aff", sub: `${completedTasks} done` },
              { icon: Clock,       label: "Time Tracked",   value: minutesToHours(totalTime), color: "#06d6a0", sub: "actual time" },
              { icon: Building2,   label: "Vendors",        value: vendors.length,        color: "#ffd166", sub: `${completedVendors} completed` },
              { icon: Users,       label: "Team",           value: project.assignedPEs?.length || 0, color: "#a78bfa", sub: "PEs assigned" },
            ].map(({ icon: Icon, label, value, color, sub }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className="text-xs text-white/40">{label}</span>
                </div>
                <p className="text-2xl font-bold font-display text-white">{value}</p>
                <p className="text-xs text-white/30 mt-0.5">{sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === t ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white"}`}>
                {t}
                {t === "tasks"   && <span className="ml-1.5 text-xs text-white/30">{tasks.length}</span>}
                {t === "vendors" && <span className="ml-1.5 text-xs text-white/30">{vendors.length}</span>}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Task status chart */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
                <h3 className="section-title mb-4">Task Status</h3>
                {statusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                          {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {statusData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-white/50">{d.name}</span></div>
                          <span className="font-semibold text-white">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-sm text-white/30 text-center py-8">No tasks yet</p>}
              </motion.div>

              {/* Priority breakdown */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.05 } }} className="card p-5">
                <h3 className="section-title mb-4">Priority Split</h3>
                <div className="space-y-3 mt-4">
                  {[
                    { k: "high",   label: "High",   color: "#ff4d6d" },
                    { k: "medium", label: "Medium", color: "#ffd166" },
                    { k: "low",    label: "Low",    color: "#06d6a0" },
                  ].map(({ k, label, color }) => (
                    <div key={k}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/50">{label}</span>
                        <span className="font-semibold text-white">{priorityMap[k]}</span>
                      </div>
                      <ProgressBar value={tasks.length > 0 ? (priorityMap[k] / tasks.length) * 100 : 0} color={color} />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Team + project info */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="card p-5 space-y-4">
                <h3 className="section-title">Team & Info</h3>
                {project.assignedPEs?.length > 0 ? (
                  <div className="space-y-2">
                    {project.assignedPEs.map((pe) => (
                      <div key={pe._id} className="flex items-center gap-2">
                        <Avatar name={pe.name} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-white">{pe.name}</p>
                          <p className="text-[10px] text-white/30">{pe.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-white/30">No PEs assigned</p>}

                <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs text-white/40">
                  {project.startDate && <div className="flex items-center gap-2"><Calendar size={12} /><span>Started {formatDate(project.startDate)}</span></div>}
                  {project.endDate && <div className="flex items-center gap-2"><Calendar size={12} /><span>Due {formatDate(project.endDate)}</span></div>}
                  <div className="flex items-center gap-2"><TrendingUp size={12} /><span>Created by {project.createdBy?.name}</span></div>
                </div>

                {project.description && (
                  <div className="pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-white/40 leading-relaxed">{project.description}</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {tasks.length === 0 ? (
                <EmptyState icon={CheckSquare} title="No tasks yet" description="Create the first task for this project"
                  action={isAdmin && <button className="btn-primary" onClick={() => setTaskModalOpen(true)}><Plus size={16} />New Task</button>} />
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <motion.div key={task._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="card-hover p-4 flex items-center gap-4">
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: task.priority === "high" ? "#ff4d6d" : task.priority === "medium" ? "#ffd166" : "#06d6a0" }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium mb-1 ${task.status === "completed" ? "line-through text-white/30" : "text-white"}`}>{task.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <TaskTypeBadge type={task.taskType} />
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                          {task.dueDate && <span className="text-xs text-white/30 flex items-center gap-1"><Calendar size={10} />{formatDate(task.dueDate)}</span>}
                          {task.actualTime > 0 && <span className="text-xs text-brand-400">{minutesToHours(task.actualTime)}</span>}
                        </div>
                      </div>
                      {task.assignedTo && <Avatar name={task.assignedTo.name} size="sm" />}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Vendors Tab */}
          {activeTab === "vendors" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {vendors.length === 0 ? (
                <EmptyState icon={Building2} title="No vendors yet" description="Add vendors to track prompt creation" />
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <ProgressBar value={vendors.length > 0 ? (completedVendors / vendors.length) * 100 : 0} color="#06d6a0" className="flex-1" />
                    <span className="text-sm font-semibold text-white flex-shrink-0">{completedVendors}/{vendors.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {vendors.map((v, i) => (
                      <motion.div key={v._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                        className="card p-3.5 flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${v.status === "completed" ? "bg-green-500/20 border border-green-500/30" : "bg-white/[0.05] border border-white/[0.08]"}`}>
                          <Building2 size={13} className={v.status === "completed" ? "text-green-400" : "text-white/30"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${v.status === "completed" ? "line-through text-white/40" : "text-white"}`}>{v.vendorName}</p>
                          {v.country && <p className="text-xs text-white/25">{v.country}</p>}
                        </div>
                        <StatusBadge status={v.status} />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={null}
        onSaved={fetchAll}
      />
    </AppLayout>
  );
}
