import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Search, Clock, Trash2, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { Modal, Input, Textarea, Select, StatusBadge, Avatar, EmptyState, LoadingScreen } from "../components/shared/UIComponents";
import api from "../utils/api";
import { formatDate, minutesToHours } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const empty = { project: "", pe: "", issueType: "support", description: "", resolution: "", timeSpent: "", date: new Date().toISOString().slice(0,10), status: "open" };

function SupportLogModal({ isOpen, onClose, log, onSaved }) {
  const [form, setForm] = useState(empty);
  const [projects, setProjects] = useState([]);
  const [pes, setPes] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([api.get("/projects"), api.get("/users/pes")]).then(([p, u]) => {
      setProjects(p.data.projects.map((x) => ({ value: x._id, label: x.name })));
      setPes(u.data.pes.map((x) => ({ value: x._id, label: x.name })));
    });
    if (log) {
      setForm({ project: log.project?._id||log.project||"", pe: log.pe?._id||log.pe||"", issueType: log.issueType||"support", description: log.description||"", resolution: log.resolution||"", timeSpent: log.timeSpent||"", date: log.date?log.date.slice(0,10):new Date().toISOString().slice(0,10), status: log.status||"open" });
    } else { setForm({ ...empty, pe: isAdmin ? "" : user._id }); }
  }, [isOpen, log]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (payload.timeSpent) payload.timeSpent = Number(payload.timeSpent); else delete payload.timeSpent;
      if (log) { await api.put(`/support-logs/${log._id}`, payload); toast("Log updated","success"); }
      else { await api.post("/support-logs", payload); toast("Log created","success"); }
      onSaved?.(); onClose();
    } catch(err) { toast(err.response?.data?.message||"Failed","error"); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title={log?"Edit Support Log":"New Support Log"} width="max-w-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Select label="Project" required value={form.project} onChange={(v)=>setForm({...form,project:v})} options={projects} placeholder="Select project" />
            {isAdmin && <Select label="PE" required value={form.pe} onChange={(v)=>setForm({...form,pe:v})} options={pes} placeholder="Select PE" />}
            <div className="grid grid-cols-2 gap-4">
              <Select label="Issue Type" value={form.issueType} onChange={(v)=>setForm({...form,issueType:v})} options={[{value:"support",label:"Support"},{value:"maintenance",label:"Maintenance"}]} />
              <Select label="Status" value={form.status} onChange={(v)=>setForm({...form,status:v})} options={[{value:"open",label:"Open"},{value:"resolved",label:"Resolved"}]} />
            </div>
            <Textarea label="Description" required rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
            <Textarea label="Resolution" rows={2} placeholder="How was it resolved?" value={form.resolution} onChange={(e)=>setForm({...form,resolution:e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Time Spent (min)" type="number" placeholder="e.g. 60" value={form.timeSpent} onChange={(e)=>setForm({...form,timeSpent:e.target.value})} />
              <Input label="Date" type="date" required value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving&&<Loader2 size={14} className="animate-spin"/>}{log?"Save":"Create Log"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}

export default function SupportLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("issueType", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/support-logs?${params}`);
      const filtered = search ? data.logs.filter((l) => l.description?.toLowerCase().includes(search.toLowerCase()) || l.project?.name?.toLowerCase().includes(search.toLowerCase())) : data.logs;
      setLogs(filtered);
    } finally { setLoading(false); }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const toggleStatus = async (log) => {
    const newStatus = log.status === "open" ? "resolved" : "open";
    try { await api.put(`/support-logs/${log._id}`, { status: newStatus }); toast(newStatus === "resolved" ? "Marked resolved" : "Reopened", "success"); fetchLogs(); }
    catch { toast("Failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this log?")) return;
    try { await api.delete(`/support-logs/${id}`); toast("Deleted", "success"); fetchLogs(); }
    catch { toast("Failed", "error"); }
  };

  const totalTime = logs.reduce((acc, l) => acc + (l.timeSpent || 0), 0);

  return (
    <AppLayout>
      <TopBar title="Support Logs" onNewClick={() => { setEditLog(null); setModalOpen(true); }} newLabel="New Log" />
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-6">
          {[{label:"Total Logs",val:logs.length,color:"text-white"},{label:"Open",val:logs.filter(l=>l.status==="open").length,color:"text-yellow-400"},{label:"Resolved",val:logs.filter(l=>l.status==="resolved").length,color:"text-green-400"},{label:"Time Spent",val:minutesToHours(totalTime),color:"text-brand-400"}].map(({label,val,color})=>(
            <div key={label}><p className="text-xs text-white/40 mb-0.5">{label}</p><p className={"text-2xl font-bold font-display "+color}>{val}</p></div>
          ))}
        </div>
        <div className="sticky top-0 z-10 bg-surface/90 glass border-b border-white/[0.06] px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input placeholder="Search logs..." className="input pl-8 py-2 h-9 text-sm" value={search} onChange={(e)=>setSearch(e.target.value)}/>
          </div>
          {["","support","maintenance"].map((t)=>(
            <button key={t} onClick={()=>setTypeFilter(t)} className={"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors "+(typeFilter===t?"bg-white/[0.1] text-white":"text-white/40 hover:text-white")}>
              {t===""?"All":t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
          {["","open","resolved"].map((s)=>(
            <button key={s} onClick={()=>setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors "+(statusFilter===s?"bg-white/[0.1] text-white":"text-white/40 hover:text-white")}>
              {s===""?"All Statuses":s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-6">
          {loading?<LoadingScreen/>:logs.length===0?(
            <EmptyState icon={MessageSquare} title="No support logs" description="Log support and maintenance issues" action={<button className="btn-primary" onClick={()=>setModalOpen(true)}><Plus size={16}/>New Log</button>}/>
          ):(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-2">
              {logs.map((log,i)=>(
                <motion.div key={log._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}} className="card-hover p-4 flex items-start gap-4">
                  <button onClick={()=>toggleStatus(log)} className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors "+(log.status==="resolved"?"bg-green-500/20 text-green-400 border border-green-500/30":"bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-green-500/20 hover:text-green-400")}>
                    {log.status==="resolved"?<CheckCircle2 size={16}/>:<Clock size={16}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${log.issueType==="support"?"bg-blue-500/15 text-blue-400":"bg-orange-500/15 text-orange-400"}`}>
                        {log.issueType==="support"?"Support":"Maintenance"}
                      </span>
                      <StatusBadge status={log.status}/>
                      <span className="text-xs text-white/30">{formatDate(log.date)}</span>
                      {log.timeSpent>0&&<span className="flex items-center gap-1 text-xs text-brand-400"><Clock size={11}/>{minutesToHours(log.timeSpent)}</span>}
                    </div>
                    <p className="text-sm text-white mb-1">{log.description}</p>
                    {log.resolution&&<p className="text-xs text-white/40 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2 mt-2">✓ {log.resolution}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {log.project&&<span className="text-xs text-white/30">{log.project.name}</span>}
                      {log.pe&&<div className="flex items-center gap-1.5"><Avatar name={log.pe.name} size="sm"/><span className="text-xs text-white/30">{log.pe.name}</span></div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={()=>{setEditLog(log);setModalOpen(true);}} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors"><Edit2 size={13}/></button>
                    {isAdmin&&<button onClick={()=>handleDelete(log._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <SupportLogModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} log={editLog} onSaved={fetchLogs}/>
    </AppLayout>
  );
}
