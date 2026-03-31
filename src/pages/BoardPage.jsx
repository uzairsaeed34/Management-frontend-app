import React, { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Plus, GripVertical, Clock, Calendar, Kanban } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import TaskModal from "../components/modals/TaskModal";
import { PriorityBadge, TaskTypeBadge, Avatar, EmptyState, LoadingScreen } from "../components/shared/UIComponents";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../utils/api";
import { formatDate, truncate, minutesToHours } from "../utils/helpers";

const COLUMNS = [
  { id:"pending",   label:"Pending",     color:"#8b90a7", bg:"rgba(139,144,167,0.08)" },
  { id:"in_progress",label:"In Progress",color:"#3d5aff", bg:"rgba(61,90,255,0.08)"   },
  { id:"completed", label:"Completed",   color:"#06d6a0", bg:"rgba(6,214,160,0.08)"   },
];

function TaskCard({ task, index, onEdit }) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative bg-surface-50 border rounded-xl p-3.5 mb-2.5 transition-all cursor-pointer select-none
            ${snapshot.isDragging ? "border-brand-500/50 shadow-glow rotate-1 scale-[1.02]" : "border-white/[0.07] hover:border-white/[0.14]"}`}
          onClick={() => onEdit(task)}
        >
          <div {...provided.dragHandleProps} className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/20 transition-opacity" onClick={(e)=>e.stopPropagation()}>
            <GripVertical size={14}/>
          </div>
          <div className="flex items-start gap-2 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{background:task.priority==="high"?"#ff4d6d":task.priority==="medium"?"#ffd166":"#06d6a0"}}/>
            <p className={`text-sm font-medium leading-snug flex-1 ${task.status==="completed"?"line-through text-white/30":"text-white"}`}>{truncate(task.title,70)}</p>
          </div>
          {task.project && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full" style={{background:task.project.color||"#3d5aff"}}/>
              <span className="text-xs text-white/40">{task.project.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <PriorityBadge priority={task.priority}/>
            <div className="flex items-center gap-2">
              {task.dueDate&&<span className="flex items-center gap-1 text-[11px] text-white/30"><Calendar size={10}/>{formatDate(task.dueDate,"MMM d")}</span>}
              {task.timerActive&&<span className="flex items-center gap-1 text-[11px] text-green-400 animate-pulse2"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/>Live</span>}
              {task.assignedTo&&<Avatar name={task.assignedTo.name} size="sm"/>}
            </div>
          </div>
          {task.estimatedTime>0&&(
            <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center gap-1 text-[11px] text-white/25">
              <Clock size={10}/>{minutesToHours(task.estimatedTime)} est.
              {task.actualTime>0&&<> · <span className="text-brand-400">{minutesToHours(task.actualTime)}</span></>}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function BoardPage() {
  const [columns, setColumns] = useState({ pending:[], in_progress:[], completed:[] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState([]);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sortBy:"position" });
      if (projectFilter) params.set("project", projectFilter);
      const { data } = await api.get(`/tasks?${params}`);
      const grouped = { pending:[], in_progress:[], completed:[] };
      data.tasks.forEach((t)=>{ if (grouped[t.status]) grouped[t.status].push(t); });
      setColumns(grouped);
    } finally { setLoading(false); }
  }, [projectFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { api.get("/projects").then(({ data })=>setProjects(data.projects)); }, []);

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId===destination.droppableId && source.index===destination.index) return;
    const srcCol = [...columns[source.droppableId]];
    const destCol = source.droppableId===destination.droppableId ? srcCol : [...columns[destination.droppableId]];
    const [moved] = srcCol.splice(source.index, 1);
    destCol.splice(destination.index, 0, { ...moved, status:destination.droppableId });
    setColumns((prev) => ({ ...prev, [source.droppableId]: source.droppableId===destination.droppableId?destCol:srcCol, [destination.droppableId]:destCol }));
    try {
      await api.put("/tasks/reorder", { tasks: destCol.map((t,i)=>({ _id:t._id, position:i, status:destination.droppableId })) });
    } catch { toast("Failed to save order","error"); fetchTasks(); }
  };

  return (
    <AppLayout>
      <TopBar title="Board" onNewClick={isAdmin?()=>{setEditTask(null);setModalOpen(true);}:null} newLabel="New Task"/>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Project filter */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-surface/80 flex items-center gap-3">
          <select className="input py-2 h-9 text-sm appearance-none max-w-[220px]" value={projectFilter} onChange={(e)=>setProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map((p)=><option key={p._id} value={p._id} className="bg-surface-50">{p.name}</option>)}
          </select>
          <div className="flex items-center gap-5 ml-auto">
            {COLUMNS.map((col)=>(
              <span key={col.id} className="flex items-center gap-1.5 text-xs text-white/30">
                <span className="w-2 h-2 rounded-full" style={{background:col.color}}/>
                {col.label}: <b className="text-white/60">{columns[col.id]?.length||0}</b>
              </span>
            ))}
          </div>
        </div>

        {loading ? <LoadingScreen /> : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-x-auto p-6">
              <div className="flex gap-4 h-full min-w-max">
                {COLUMNS.map((col)=>(
                  <motion.div key={col.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="flex flex-col w-[320px] flex-shrink-0">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-3" style={{background:col.bg,border:`1px solid ${col.color}20`}}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{background:col.color}}/>
                        <span className="font-display font-semibold text-sm text-white">{col.label}</span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{background:`${col.color}20`,color:col.color}}>{columns[col.id]?.length||0}</span>
                      </div>
                      {isAdmin&&<button onClick={()=>{setEditTask(null);setModalOpen(true);}} className="p-1 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white transition-colors"><Plus size={14}/></button>}
                    </div>
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot)=>(
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 rounded-xl p-2 min-h-[120px] transition-colors ${snapshot.isDraggingOver?"bg-white/[0.03] border border-dashed border-white/[0.12]":""}`}>
                          {columns[col.id]?.length===0&&!snapshot.isDraggingOver&&(
                            <div className="flex items-center justify-center h-24 text-xs text-white/20 italic">Drop tasks here</div>
                          )}
                          {columns[col.id]?.map((task,idx)=>(
                            <TaskCard key={task._id} task={task} index={idx} onEdit={(t)=>{setEditTask(t);setModalOpen(true);}}/>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </motion.div>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}
      </div>
      <TaskModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} task={editTask} onSaved={fetchTasks}/>
    </AppLayout>
  );
}
