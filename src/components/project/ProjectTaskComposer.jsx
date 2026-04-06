import React, { useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Input, Select, Textarea } from "../shared/UIComponents";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";

const initialState = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
};

export default function ProjectTaskComposer({ projectId, canCreate, users, onTaskCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialState);
  const toast = useToast();

  if (!canCreate) return null;

  const setField = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setForm(initialState);
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        projectId,
        taskType: "new_pe_work",
      };

      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;

      const { data } = await api.post("/tasks", payload);
      onTaskCreated?.(data.task);
      toast("Task created", "success");
      reset();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create task", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(61,90,255,0.14),rgba(255,255,255,0.03))] p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-300">
            <Sparkles size={12} />
            Task Creation
          </div>
          <h3 className="mt-3 text-xl font-display font-bold text-white">Create work inside this project</h3>
          <p className="text-sm text-white/40 mt-1">
            New tasks are linked to the current project automatically, so this page stays its own workspace.
          </p>
        </div>
        <button onClick={() => setIsOpen((open) => !open)} className="btn-primary">
          <Plus size={15} />
          {isOpen ? "Close" : "New Task"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-5 border-t border-white/[0.08] pt-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Task Name"
              required
              placeholder="e.g. Review onboarding prompts"
              value={form.title}
              onChange={(e) => setField("title")(e.target.value)}
            />
            <Select
              label="Assigned User"
              value={form.assignedTo}
              onChange={setField("assignedTo")}
              options={users.map((user) => ({ value: user._id, label: user.name }))}
              placeholder="Unassigned"
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Add task details, notes, or acceptance criteria..."
            rows={3}
            value={form.description}
            onChange={(e) => setField("description")(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={setField("status")}
              options={[
                { value: "pending", label: "To Do" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Done" },
              ]}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={setField("priority")}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setField("dueDate")(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={reset} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
