import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { CheckSquare, FolderOpen, Building2, AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { StatCard, ProgressBar, Avatar, PriorityBadge, StatusBadge, LoadingScreen } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDate } from "../utils/helpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-100 border border-white/[0.08] rounded-xl p-3 text-xs shadow-card">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p,i)=>(
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color||p.fill }} />
          <span className="text-white/70">{p.name}: <b className="text-white">{p.value}</b></span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    api.get("/dashboard").then(({ data: d }) => setData(d.dashboard)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><TopBar title="Dashboard" /><LoadingScreen /></AppLayout>;

  const { tasks, projects, vendors, recentTasks, workloadPerPE } = data || {};

  const statusChartData = [
    { name: "Pending", value: tasks?.byStatus?.pending||0, color: "#8b90a7" },
    { name: "In Progress", value: tasks?.byStatus?.in_progress||0, color: "#3d5aff" },
    { name: "Completed", value: tasks?.byStatus?.completed||0, color: "#06d6a0" },
  ];
  const priorityChartData = [
    { name: "High", value: tasks?.byPriority?.high||0, color: "#ff4d6d" },
    { name: "Medium", value: tasks?.byPriority?.medium||0, color: "#ffd166" },
    { name: "Low", value: tasks?.byPriority?.low||0, color: "#06d6a0" },
  ];
  const completionRate = tasks?.total > 0 ? Math.round(((tasks?.byStatus?.completed||0)/tasks.total)*100) : 0;
  const stagger = { hidden:{opacity:0}, show:{opacity:1,transition:{staggerChildren:0.07}} };
  const item = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };

  return (
    <AppLayout>
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Welcome */}
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-brand-500/20 via-brand-600/10 to-transparent border border-brand-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/30 flex items-center justify-center">
            <Zap size={20} className="text-brand-300" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-lg">
              Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {user?.name?.split(" ")[0]}
            </h2>
            <p className="text-sm text-white/50">
              <span className="text-brand-300 font-semibold">{tasks?.byStatus?.in_progress||0} tasks in progress</span>
              {tasks?.overdue>0 && <span className="text-red-400 ml-2">· {tasks.overdue} overdue</span>}
            </p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div variants={item}><StatCard title="Total Tasks" value={tasks?.total||0} icon={CheckSquare} color="#3d5aff" subtitle={`${completionRate}% complete`} /></motion.div>
          <motion.div variants={item}><StatCard title="Projects" value={projects?.total||0} icon={FolderOpen} color="#06d6a0" subtitle={`${projects?.byStatus?.active||0} active`} /></motion.div>
          <motion.div variants={item}><StatCard title="Vendors" value={vendors?.total||0} icon={Building2} color="#f77f00" subtitle={`${vendors?.byStatus?.completed||0} done`} /></motion.div>
          <motion.div variants={item}><StatCard title="Overdue" value={tasks?.overdue||0} icon={AlertTriangle} color="#ff4d6d" subtitle="Need attention" /></motion.div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="card p-5">
            <h3 className="section-title mb-4">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {statusChartData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-1">
              {statusChartData.map((d)=>(
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{background:d.color}}/>{d.name}: <b className="text-white">{d.value}</b>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="card p-5">
            <h3 className="section-title mb-4">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityChartData} barSize={36}>
                <XAxis dataKey="name" tick={{fill:"#8b90a7",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#8b90a7",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {priorityChartData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="card p-5">
            <h3 className="section-title mb-4">Project Status</h3>
            <div className="space-y-4 mt-2">
              {[
                {label:"Active",val:projects?.byStatus?.active||0,total:Math.max(projects?.total||1,1),color:"#3d5aff"},
                {label:"Completed",val:projects?.byStatus?.completed||0,total:Math.max(projects?.total||1,1),color:"#06d6a0"},
                {label:"On Hold",val:projects?.byStatus?.on_hold||0,total:Math.max(projects?.total||1,1),color:"#f77f00"},
              ].map(({label,val,total,color})=>(
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-white/50">{label}</span>
                    <span className="text-white font-semibold">{val}</span>
                  </div>
                  <ProgressBar value={(val/total)*100} color={color}/>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isAdmin && workloadPerPE?.length>0 && (
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}} className="card p-5">
              <h3 className="section-title mb-4">Workload per PE</h3>
              <div className="space-y-3">
                {workloadPerPE.slice(0,6).map((pe)=>(
                  <div key={pe._id||pe.name} className="flex items-center gap-3">
                    <Avatar name={pe.name} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white truncate">{pe.name||"Unassigned"}</span>
                        <span className="text-xs text-white/40 ml-2">{pe.total}</span>
                      </div>
                      <ProgressBar value={pe.total>0?(pe.completed/pe.total)*100:0} color="#3d5aff"/>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4}} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Recent Tasks</h3>
              <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={12}/></Link>
            </div>
            <div className="space-y-1.5">
              {!recentTasks?.length && <p className="text-sm text-white/30 text-center py-8">No tasks yet</p>}
              {recentTasks?.map((task)=>(
                <Link key={task._id} to="/tasks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-brand-300 transition-colors truncate">{task.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">{task.project?.name}{task.assignedTo&&` · ${task.assignedTo.name}`}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={task.priority}/>
                    <StatusBadge status={task.status}/>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
