import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Play, Square, Trash2, Edit2, Clock, Calendar, ChevronDown, CheckSquare } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import TaskModal from "../components/modals/TaskModal";
import { PriorityBadge, StatusBadge, TaskTypeBadge, Avatar, EmptyState, LoadingScreen } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../utils/api";
import { formatDate, minutesToHours, isOverdue, truncate } from "../utils/helpers";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority:"", status:"", project:"" });
  const [projects, setProjects] = useState([]);
  const [liveTimers, setLiveTimers] = useState({});
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.status) params.set("status", filters.status);
      if (filters.project) params.set("project", filters.project);
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data.tasks);
    } finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { api.get("/projects").then(({ data }) => setProjects(data.projects)); }, []);

  // Live timer tick every 10s
  useEffect(() => {
    const tick = () => {
      setLiveTimers((prev) => {
        const next = { ...prev };
        tasks.forEach((t) => {
          if (t.timerActive && t.timerStartedAt) {
            next[t._id] = Math.floor((Date.now() - new Date(t.timerStartedAt)) / 60000);
          }
        });
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [tasks]);

  const handleTimer = async (task) => {
    try {
      if (task.timerActive) { await api.post(`/tasks/${task._id}/timer/stop`); toast("Timer stopped","info"); }
      else { await api.post(`/tasks/${task._id}/timer/start`); toast("Timer started ▶","success"); }
      fetchTasks();
    } catch(err) { toast(err.response?.data?.message||"Timer error","error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try { await api.delete(`/tasks/${id}`); toast("Task deleted","success"); fetchTasks(); }
    catch { toast("Failed to delete","error"); }
  };

  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status));

  return (
    <AppLayout>
      <TopBar title="Tasks" onNewClick={isAdmin?()=>{setEditTask(null);setModalOpen(true);}:null} newLabel="New Task" />
      <div className="flex-1 overflow-y-auto">
        {/* Filter bar */}
        <div className="sticky top-0 z-10 bg-surface/90 glass border-b border-white/[0.06] px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input placeholder="Search tasks..." className="input pl-8 py-2 h-9 text-sm" value={search} onChange={(e)=>setSearch(e.target.value)}/>
          </div>
          {[
            { key:"priority", opts:[{value:"",label:"All Priorities"},{value:"high",label:"🔴 High"},{value:"medium",label:"🟡 Medium"},{value:"low",label:"🟢 Low"}] },
            { key:"status", opts:[{value:"",label:"All Statuses"},{value:"pending",label:"Pending"},{value:"in_progress",label:"In Progress"},{value:"completed",label:"Completed"}] },
          ].map(({key,opts})=>(
            <div key={key} className="relative">
              <select className="input pr-8 py-2 h-9 text-sm appearance-none cursor-pointer" value={filters[key]} onChange={(e)=>setFilters({...filters,[key]:e.target.value})}>
                {opts.map((o)=><option key={o.value} value={o.value} className="bg-surface-50">{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"/>
            </div>
          ))}
          <div className="relative">
            <select className="input pr-8 py-2 h-9 text-sm appearance-none cursor-pointer" value={filters.project} onChange={(e)=>setFilters({...filters,project:e.target.value})}>
              <option value="">All Projects</option>
              {projects.map((p)=><option key={p._id} value={p._id} className="bg-surface-50">{p.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"/>
          </div>
          <span className="text-xs text-white/30 ml-auto">{tasks.length} tasks</span>
          {overdueTasks.length>0 && <span className="text-xs text-red-400 font-medium">⚠ {overdueTasks.length} overdue</span>}
        </div>

        <div className="p-6">
          {loading ? <LoadingScreen /> : tasks.length===0 ? (
            <EmptyState icon={CheckSquare} title="No tasks found" description="Create your first task to get started"
              action={isAdmin&&<button className="btn-primary" onClick={()=>{setEditTask(null);setModalOpen(true);}}><Plus size={16}/>New Task</button>}/>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-2">
              {tasks.map((task,i)=>{
                const overdue = isOverdue(task.dueDate, task.status);
                const liveMins = task.timerActive ? (liveTimers[task._id]||0) : 0;
                return (
                  <motion.div key={task._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.025}}
                    className={`card-hover p-4 flex items-center gap-4 ${overdue?"border-red-500/20":""}`}>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{background:task.priority==="high"?"#ff4d6d":task.priority==="medium"?"#ffd166":"#06d6a0"}}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-sm font-medium ${task.status==="completed"?"line-through text-white/30":"text-white"}`}>{task.title}</span>
                        {overdue && <span className="text-xs text-red-400 font-medium">Overdue</span>}
                        {task.timerActive && (
                          <span className="flex items-center gap-1 text-xs text-green-400 font-medium animate-pulse2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"/>
                            {minutesToHours((task.actualTime||0)+liveMins)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-white/30">{task.project?.name}</span>
                        <TaskTypeBadge type={task.taskType}/>
                        <PriorityBadge priority={task.priority}/>
                        <StatusBadge status={task.status}/>
                        {task.dueDate&&<span className={`flex items-center gap-1 text-xs ${overdue?"text-red-400":"text-white/30"}`}><Calendar size={11}/>{formatDate(task.dueDate)}</span>}
                        {task.estimatedTime>0&&<span className="flex items-center gap-1 text-xs text-white/30"><Clock size={11}/>{minutesToHours(task.estimatedTime)} est.</span>}
                        {task.actualTime>0&&<span className="flex items-center gap-1 text-xs text-brand-400"><Clock size={11}/>{minutesToHours(task.actualTime)}</span>}
                      </div>
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Avatar name={task.assignedTo.name} size="sm"/>
                        <span className="text-xs text-white/40 hidden sm:block">{task.assignedTo.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {task.status!=="completed" && (
                        <button onClick={()=>handleTimer(task)} className={`p-2 rounded-lg transition-colors ${task.timerActive?"bg-red-500/15 text-red-400 hover:bg-red-500/25":"hover:bg-white/[0.06] text-white/40 hover:text-green-400"}`} title={task.timerActive?"Stop":"Start"}>
                          {task.timerActive?<Square size={14}/>:<Play size={14}/>}
                        </button>
                      )}
                      <button onClick={()=>{setEditTask(task);setModalOpen(true);}} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors"><Edit2 size={14}/></button>
                      {isAdmin&&<button onClick={()=>handleDelete(task._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
      <TaskModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} task={editTask} onSaved={fetchTasks}/>
    </AppLayout>
  );
}
