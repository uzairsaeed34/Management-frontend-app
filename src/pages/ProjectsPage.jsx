import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, Edit2, Trash2, BarChart2, List, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { Modal, Input, Textarea, Select, StatusBadge, ProgressBar, Avatar, EmptyState, LoadingScreen } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../utils/api";

const empty = { name: "", clientName: "", description: "", status: "active", initialScope: "", additionalScope: "0", color: "#3d5aff", startDate: "", endDate: "" };

function ProjectModal({ isOpen, onClose, project, onSaved }) {
  const [form, setForm] = useState(empty);
  const [pes, setPes] = useState([]);
  const [selectedPEs, setSelectedPEs] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    api.get("/users/pes").then(({ data }) => setPes(data.pes));
    if (project) {
      setForm({ name: project.name||"", clientName: project.clientName||"", description: project.description||"", status: project.status||"active", initialScope: project.initialScope||"", additionalScope: project.additionalScope||0, color: project.color||"#3d5aff", startDate: project.startDate?project.startDate.slice(0,10):"", endDate: project.endDate?project.endDate.slice(0,10):"" });
      setSelectedPEs(project.assignedPEs?.map((p) => p._id || p) || []);
    } else { setForm(empty); setSelectedPEs([]); }
  }, [isOpen, project]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, assignedPEs: selectedPEs };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      payload.initialScope = Number(payload.initialScope);
      payload.additionalScope = Number(payload.additionalScope);
      if (project) { await api.put("/projects/"+project._id, payload); toast("Project updated","success"); }
      else { await api.post("/projects", payload); toast("Project created","success"); }
      onSaved?.(); onClose();
    } catch(err) { toast(err.response?.data?.message||"Failed","error"); }
    finally { setSaving(false); }
  };
  const togglePE = (id) => setSelectedPEs((p) => p.includes(id)?p.filter((x)=>x!==id):[...p,id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title={project?"Edit Project":"New Project"} width="max-w-2xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Project Name" required placeholder="e.g. Vendor Onboarding Q1" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
              <Input label="Client Name" required placeholder="e.g. Acme Corp" value={form.clientName} onChange={(e)=>setForm({...form,clientName:e.target.value})} />
            </div>
            <Textarea label="Description" placeholder="Project details..." value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
            <div className="grid grid-cols-3 gap-4">
              <Select label="Status" value={form.status} onChange={(v)=>setForm({...form,status:v})} options={[{value:"active",label:"Active"},{value:"completed",label:"Completed"},{value:"on_hold",label:"On Hold"}]} />
              <Input label="Initial Scope (vendors)" required type="number" placeholder="e.g. 200" value={form.initialScope} onChange={(e)=>setForm({...form,initialScope:e.target.value})} />
              <Input label="Additional Scope" type="number" placeholder="e.g. 30" value={form.additionalScope} onChange={(e)=>setForm({...form,additionalScope:e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Start Date" type="date" value={form.startDate} onChange={(e)=>setForm({...form,startDate:e.target.value})} />
              <Input label="End Date" type="date" value={form.endDate} onChange={(e)=>setForm({...form,endDate:e.target.value})} />
              <div><label className="label">Color</label><input type="color" value={form.color} onChange={(e)=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded-xl border border-white/[0.08] bg-transparent cursor-pointer p-1" /></div>
            </div>
            {pes.length>0 && (
              <div>
                <label className="label">Assign PEs</label>
                <div className="flex flex-wrap gap-2">
                  {pes.map((pe)=>(
                    <button key={pe._id} type="button" onClick={()=>togglePE(pe._id)} className={"flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all "+(selectedPEs.includes(pe._id)?"bg-brand-500/20 border-brand-500/40 text-brand-300":"bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white")}>
                      <Avatar name={pe.name} size="sm" />{pe.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving&&<Loader2 size={14} className="animate-spin"/>}{project?"Save Changes":"Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/projects"+(statusFilter?"?status="+statusFilter:""));
      setProjects(data.projects);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(()=>{ fetchProjects(); },[fetchProjects]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    try { await api.delete("/projects/"+id); toast("Project deleted","success"); fetchProjects(); }
    catch { toast("Failed to delete","error"); }
  };

  return (
    <AppLayout>
      <TopBar title="Projects" onNewClick={isAdmin?()=>{setEditProject(null);setModalOpen(true);}:null} newLabel="New Project" />
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface/90 glass border-b border-white/[0.06] px-6 py-3 flex items-center gap-3">
          {["","active","completed","on_hold"].map((s)=>(
            <button key={s} onClick={()=>setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors "+(statusFilter===s?"bg-white/[0.1] text-white":"text-white/40 hover:text-white")}>
              {s===""?"All":s==="on_hold"?"On Hold":s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>setView("grid")} className={"p-2 rounded-lg transition-colors "+(view==="grid"?"bg-white/[0.1] text-white":"text-white/30 hover:text-white")}><BarChart2 size={16}/></button>
            <button onClick={()=>setView("list")} className={"p-2 rounded-lg transition-colors "+(view==="list"?"bg-white/[0.1] text-white":"text-white/30 hover:text-white")}><List size={16}/></button>
          </div>
        </div>
        <div className="p-6">
          {loading?<LoadingScreen/>:projects.length===0?(
            <EmptyState icon={FolderOpen} title="No projects found" description="Create your first project"
              action={isAdmin&&<button className="btn-primary" onClick={()=>{setEditProject(null);setModalOpen(true);}}><Plus size={16}/>New Project</button>}/>
          ):view==="grid"?(
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p,i)=>(
                <motion.div key={p._id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} className="card-hover p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${p.color}20`,border:`1px solid ${p.color}30`}}>
                        <FolderOpen size={18} style={{color:p.color}}/>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{p.name}</h3>
                        <p className="text-xs text-white/40">{p.clientName}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status}/>
                  </div>
                  {p.description&&<p className="text-xs text-white/40 line-clamp-2">{p.description}</p>}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white/50">Vendor Progress</span>
                      <span className="text-white font-medium">{p.completedScope}/{p.totalScope}</span>
                    </div>
                    <ProgressBar value={p.completionPercentage} color={p.color||"#3d5aff"}/>
                    <div className="flex items-center justify-between mt-1 text-xs text-white/30">
                      <span>{p.completionPercentage}% complete</span>
                      <span>{p.remainingScope} remaining</span>
                    </div>
                  </div>
                  {p.taskSummary&&(
                    <div className="flex gap-2">
                      {[{k:"pending",c:"#8b90a7",l:"Pending"},{k:"in_progress",c:"#3d5aff",l:"Active"},{k:"completed",c:"#06d6a0",l:"Done"}].map(({k,c,l})=>(
                        <div key={k} className="flex-1 text-center py-2 rounded-lg" style={{background:`${c}10`}}>
                          <div className="text-base font-bold font-display" style={{color:c}}>{p.taskSummary[k]||0}</div>
                          <div className="text-[10px] text-white/30">{l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                    <div className="flex -space-x-2">
                      {p.assignedPEs?.slice(0,4).map((pe)=>(<Avatar key={pe._id} name={pe.name} size="sm" className="border-2 border-surface-50" />))}
                    </div>
                    <div className="flex gap-1.5">
                      <Link to={`/projects/${p._id}`} className="p-1.5 rounded-lg hover:bg-brand-500/15 text-white/30 hover:text-brand-400 transition-colors" title="View details"><ExternalLink size={13}/></Link>
                      {isAdmin&&(
                        <>
                          <button onClick={(e)=>{e.preventDefault();setEditProject(p);setModalOpen(true);}} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors"><Edit2 size={13}/></button>
                          <button onClick={(e)=>{e.preventDefault();handleDelete(p._id);}} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ):(
            <div className="space-y-2">
              {projects.map((p,i)=>(
                <motion.div key={p._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}} className="card-hover p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${p.color}20`}}><FolderOpen size={16} style={{color:p.color}}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1"><span className="font-medium text-white">{p.name}</span><StatusBadge status={p.status}/></div>
                    <div className="flex items-center gap-4"><span className="text-xs text-white/40">{p.clientName}</span><ProgressBar value={p.completionPercentage} color={p.color} className="w-32"/><span className="text-xs text-white/40">{p.completionPercentage}%</span></div>
                  </div>
                  <div className="text-xs text-white/30">{p.taskSummary?.total||0} tasks</div>
                  {isAdmin&&(<div className="flex gap-1"><button onClick={()=>{setEditProject(p);setModalOpen(true);}} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors"><Edit2 size={13}/></button><button onClick={()=>handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13}/></button></div>)}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ProjectModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} project={editProject} onSaved={fetchProjects}/>
    </AppLayout>
  );
}
