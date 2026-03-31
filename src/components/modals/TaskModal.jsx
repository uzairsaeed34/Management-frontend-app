import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Modal, Input, Textarea, Select } from "../shared/UIComponents";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";

const TASK_TYPES = [
  { value: "new_pe_work", label: "New PE Work" },
  { value: "manual_validation", label: "Manual Validation" },
  { value: "support", label: "Support" },
  { value: "maintenance", label: "Maintenance" },
  { value: "vendor_creation", label: "Vendor Creation" },
  { value: "testing", label: "Testing" },
  { value: "debugging", label: "Debugging" },
  { value: "enhancement", label: "Enhancement" },
];

const empty = {
  title: "", description: "", project: "", assignedTo: "",
  taskType: "new_pe_work", priority: "medium", status: "pending",
  startDate: "", dueDate: "", estimatedTime: "",
};

export default function TaskModal({ isOpen, onClose, task, onSaved }) {
  const [form, setForm] = useState(empty);
  const [projects, setProjects] = useState([]);
  const [pes, setPes] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([api.get("/projects"), api.get("/users/pes")]).then(([p, u]) => {
      setProjects(p.data.projects.map((x) => ({ value: x._id, label: x.name })));
      setPes(u.data.pes.map((x) => ({ value: x._id, label: x.name })));
    });
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        project: task.project?._id || task.project || "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
        taskType: task.taskType || "new_pe_work",
        priority: task.priority || "medium",
        status: task.status || "pending",
        startDate: task.startDate ? task.startDate.slice(0, 10) : "",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        estimatedTime: task.estimatedTime || "",
      });
    } else {
      setForm(empty);
    }
  }, [isOpen, task]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.estimatedTime) delete payload.estimatedTime;
      else payload.estimatedTime = Number(payload.estimatedTime);

      if (task) {
        await api.put(`/tasks/${task._id}`, payload);
        toast("Task updated", "success");
      } else {
        await api.post("/tasks", payload);
        toast("Task created", "success");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save task", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Edit Task" : "New Task"} width="max-w-2xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input label="Task Title" required placeholder="What needs to be done?" value={form.title} onChange={(e) => set("title")(e.target.value)} />

            <div className="grid grid-cols-2 gap-4">
              <Select label="Project" required value={form.project} onChange={set("project")}
                options={projects} placeholder="Select project" />
              <Select label="Assign To" value={form.assignedTo} onChange={set("assignedTo")}
                options={pes} placeholder="Unassigned" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Select label="Task Type" required value={form.taskType} onChange={set("taskType")} options={TASK_TYPES} />
              <Select label="Priority" value={form.priority} onChange={set("priority")} options={[
                { value: "high", label: "🔴 High" },
                { value: "medium", label: "🟡 Medium" },
                { value: "low", label: "🟢 Low" },
              ]} />
              <Select label="Status" value={form.status} onChange={set("status")} options={[
                { value: "pending", label: "Pending" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]} />
            </div>

            <Textarea label="Description" rows={3} placeholder="Add details..." value={form.description} onChange={(e) => set("description")(e.target.value)} />

            <div className="grid grid-cols-3 gap-4">
              <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} />
              <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => set("dueDate")(e.target.value)} />
              <Input label="Est. Time (min)" type="number" placeholder="e.g. 120" value={form.estimatedTime} onChange={(e) => set("estimatedTime")(e.target.value)} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {task ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}
