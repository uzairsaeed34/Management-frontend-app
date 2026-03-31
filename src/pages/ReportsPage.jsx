import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BarChart2, Download, Clock, CheckSquare, TrendingUp } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { ProgressBar, Avatar, LoadingScreen } from "../components/shared/UIComponents";
import api from "../utils/api";
import { minutesToHours, formatDate } from "../utils/helpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-100 border border-white/[0.08] rounded-xl p-3 text-xs shadow-card">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-white/70">{p.name}: <b className="text-white">{p.value}</b></span>
        </div>
      ))}
    </div>
  );
};

const TYPE_COLORS = ["#3d5aff","#06d6a0","#ffd166","#ff4d6d","#f77f00","#a78bfa","#34d399","#fb923c"];

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard"),
      api.get("/tasks"),
      api.get("/projects"),
      api.get("/vendors"),
      api.get("/support-logs"),
    ]).then(([dash, tasks, projects, vendors, logs]) => {
      setData({ dashboard: dash.data.dashboard, tasks: tasks.data.tasks, projects: projects.data.projects, vendors: vendors.data.vendors, logs: logs.data.logs });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [["Task Title","Project","Assigned To","Status","Priority","Type","Est (min)","Actual (min)","Due Date"]];
    data.tasks.forEach((t) => rows.push([t.title, t.project?.name||"", t.assignedTo?.name||"Unassigned", t.status, t.priority, t.taskType, t.estimatedTime||0, t.actualTime||0, t.dueDate?formatDate(t.dueDate):""]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `pe-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  if (loading) return <AppLayout><TopBar title="Reports" /><LoadingScreen /></AppLayout>;
  if (!data) return <AppLayout><TopBar title="Reports" /><div className="p-8 text-white/40">No data available</div></AppLayout>;

  const { dashboard, tasks, projects, vendors, logs } = data;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalEstimated = tasks.reduce((a, t) => a + (t.estimatedTime || 0), 0);
  const totalActual = tasks.reduce((a, t) => a + (t.actualTime || 0), 0);
  const totalLogTime = logs.reduce((a, l) => a + (l.timeSpent || 0), 0);

  // Workload stacked bar
  const workloadData = (dashboard.workloadPerPE || []).slice(0, 8).map((pe) => ({
    name: pe.name?.split(" ")[0] || "?",
    Pending: pe.pending || 0,
    "In Progress": pe.in_progress || 0,
    Completed: pe.completed || 0,
  }));

  // Task type pie
  const typeMap = {};
  tasks.forEach((t) => { typeMap[t.taskType] = (typeMap[t.taskType] || 0) + 1; });
  const typeData = Object.entries(typeMap).map(([k, v]) => ({
    name: k.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase()), value: v,
  }));

  // Priority pie
  const priorityData = [
    { name: "High", value: tasks.filter(t=>t.priority==="high").length, color: "#ff4d6d" },
    { name: "Medium", value: tasks.filter(t=>t.priority==="medium").length, color: "#ffd166" },
    { name: "Low", value: tasks.filter(t=>t.priority==="low").length, color: "#06d6a0" },
  ];

  return (
    <AppLayout>
      <TopBar title="Reports" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Performance Overview</h2>
            <p className="text-sm text-white/40">Generated {formatDate(new Date())}</p>
          </div>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: CheckSquare, label: "Tasks Completed", value: completedTasks, sub: `of ${tasks.length} total`, color: "#06d6a0" },
            { icon: Clock, label: "Hours Tracked", value: minutesToHours(totalActual), sub: `${minutesToHours(totalEstimated)} estimated`, color: "#3d5aff" },
            { icon: BarChart2, label: "Vendors Done", value: vendors.filter(v=>v.status==="completed").length, sub: `of ${vendors.length} total`, color: "#ffd166" },
            { icon: TrendingUp, label: "Issues Resolved", value: logs.filter(l=>l.status==="resolved").length, sub: `${minutesToHours(totalLogTime)} support time`, color: "#f77f00" },
          ].map(({ icon: Icon, label, value, sub, color }, i) => (
            <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-3xl font-bold font-display text-white">{value}</p>
              <p className="text-xs text-white/25 mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Workload bar */}
          {workloadData.length > 0 && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="card p-5 lg:col-span-2">
              <h3 className="section-title mb-4">Workload per PE</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={workloadData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill:"#8b90a7", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#8b90a7", fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="Pending" fill="#8b90a7" stackId="a" />
                  <Bar dataKey="In Progress" fill="#3d5aff" stackId="a" />
                  <Bar dataKey="Completed" fill="#06d6a0" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[{c:"#8b90a7",l:"Pending"},{c:"#3d5aff",l:"In Progress"},{c:"#06d6a0",l:"Completed"}].map(({c,l})=>(
                  <div key={l} className="flex items-center gap-1.5 text-xs text-white/40">
                    <span className="w-2 h-2 rounded-full" style={{ background:c }} />{l}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Priority pie */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="card p-5">
            <h3 className="section-title mb-4">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {priorityData.map((d,i)=><Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {priorityData.map((d)=>(
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background:d.color }} />
                    <span className="text-white/50">{d.name}</span>
                  </div>
                  <span className="font-semibold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Task type breakdown */}
          {typeData.length > 0 && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="card p-5">
              <h3 className="section-title mb-4">Tasks by Type</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="45%" height={160}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {typeData.map((_,i)=><Cell key={i} fill={TYPE_COLORS[i%TYPE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {typeData.slice(0,7).map((d,i)=>(
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:TYPE_COLORS[i%TYPE_COLORS.length] }} />
                      <span className="text-white/50 flex-1 truncate">{d.name}</span>
                      <span className="font-semibold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Project progress */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }} className="card p-5">
            <h3 className="section-title mb-4">Project Progress</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {projects.slice(0,10).map((p)=>(
                <div key={p._id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color||"#3d5aff" }} />
                  <span className="text-xs text-white/60 w-28 truncate flex-shrink-0">{p.name}</span>
                  <div className="flex-1"><ProgressBar value={p.completionPercentage} color={p.color||"#3d5aff"} /></div>
                  <span className="text-xs text-white/40 w-8 text-right flex-shrink-0">{p.completionPercentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* PE Time Efficiency */}
        {(dashboard.workloadPerPE||[]).length > 0 && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="card p-5">
            <h3 className="section-title mb-4">Time Efficiency per PE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(dashboard.workloadPerPE||[]).slice(0,6).map((pe)=>{
                const peTasks = tasks.filter((t)=>t.assignedTo?._id===pe._id||t.assignedTo===pe._id);
                const est = peTasks.reduce((a,t)=>a+(t.estimatedTime||0),0);
                const actual = peTasks.reduce((a,t)=>a+(t.actualTime||0),0);
                const eff = est>0?Math.round((est/Math.max(actual,1))*100):null;
                return (
                  <div key={pe._id||pe.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                    <Avatar name={pe.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{pe.name}</p>
                      <p className="text-xs text-white/30">{pe.completed}/{pe.total} done · {minutesToHours(actual)}</p>
                    </div>
                    {eff!==null && (
                      <div className={`text-xs font-bold px-2 py-1 rounded-lg ${eff>=100?"bg-green-500/15 text-green-400":"bg-orange-500/15 text-orange-400"}`}>
                        {eff}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
