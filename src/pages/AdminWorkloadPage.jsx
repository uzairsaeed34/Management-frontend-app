import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { StatCard, LoadingScreen } from "../components/shared/UIComponents";
import api from "../utils/api";

const emptyForm = {
  id: null,
  peName: "",
  project: "",
  task: "",
  occupancy: "",
  bandwidth: "",
  reviewer: "",
};

const AdminWorkloadPage = () => {
  const PE_NAMES = [
    "Abdullah","Muzammil Hussain","Yumna","Ashar","Ashish","Lahari","Manideepa","Hassan",
    "Hasnain Raza","Akhila","Akhshay","Shaik Neloufar","Asil","Jayanthi","Hassan Ali",
    "Abdul Basit","Sri Sai Natha Chittajallu","Pooja Sri Kankanampati","Madhu Sree Ummidi",
  ];

  const PROJECTS = [
    "Nowports AP","Bempro AR","HR AP Retail","HR Marchandize","Sienna","NZF","Time Square","Bempro AP",
    "LA","ATS","Nowports AR","NZF","Harry Rosen","Martek","Telus","Navistar","CIBC","Bempro",
    "Rab Design","Mehreen's help","IDRF","DBG","RAB Inventory","Nowports","RAB Order Processing",
    "TimeSquare","TCF Canada","Sienna APQ","Sienna CSV and Concur","Dogwoods","Distrivalto",
  ];

  const TASKS = [
    "New PE Work, Manual Data Validation, Support",
    "New PE Work (Occasional), Support",
    "Maintenance (Occasional)",
    "Maintenance (Occasional)",
    "Manual Data Validation, Support, IDW Monitoring",
    "Manual Data Validation, Support, Maintenance",
    "Maintenance (Occasional)",
    "Maintenance (Occasional)",
    "Maintenance, Support, IDW Monitoring",
    "Maintenance, Support, IDW Monitoring",
    "Support, New Scenarios, Data validation",
    "Maintenance (Occasional), New changes",
    "Manual Data Validation, Support, IDW Monitoring",
    "Manual Data Validation, Support, IDW Monitoring",
    "Maintenance , Post Production New changes",
    "Maintenance (Occasional)",
    "Testing phase",
    "Maintenance (Occasional)",
    "Development",
    "Development",
    "Development and Maintenance",
    "Helping in R&D",
    "Maintenance, Support,",
    "Manually executing the process",
    "Maintenance, Support, IDW Monitoring",
    "Monitoring and debugging (occasional)",
    "Monitoring and debugging (occasional)",
    "Manual Data Validation, Support, IDW Monitoring",
    "Monitoring",
    "Support (development)",
    "Maintenance and IDW Monitoring",
    "Development (finished)",
    "Maintenance, Support, IDW Monitoring",
    "Job Shadow videos, understanding document (assigned recently)",
    "Validation (sometimes when the backlog is high)",
    "Dev + Support",
    "Maintenance (Occasional)",
    "Maintenance (Occasional)",
    "Dev + Support",
    "Validaion Monitoring and On going Bug fixing Support",
    "New Project V2 Validation and Development",
    "Monitoring and Support",
    "IDW Training on V2",
    "Inventory Bots Monitoring",
  ];

  const REVIEWERS = ["Uzair","Mehreen","Amna","Mashood","Shaheryar","Qamar","Chaitanya"];

  const inputStyle = { color: "#0f172a", backgroundColor: "#ffffff", borderColor: "#cbd5e1" };
  const elementStyle = { border: "1px solid #cbd5e1", borderRadius: "12px" };

  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadWorkloads = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workloads");
      setWorkloads(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load workloads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkloads(); }, []);

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        peName: form.peName.trim(),
        project: form.project.trim(),
        task: form.task.trim(),
        occupancy: Number(form.occupancy),
        bandwidth: Number(form.bandwidth),
        reviewer: form.reviewer.trim(),
      };

      if (!payload.peName || !payload.project || !payload.task || isNaN(payload.occupancy) || isNaN(payload.bandwidth) || !payload.reviewer) {
        throw new Error("Please fill in all fields with valid values.");
      }

      if (form.id) {
        await api.put(`/workloads/${form.id}`, payload);
      } else {
        await api.post("/workloads", payload);
      }

      await loadWorkloads();
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Unable to save record.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      peName: item.peName,
      project: item.project,
      task: item.task,
      occupancy: item.occupancy,
      bandwidth: item.bandwidth,
      reviewer: item.reviewer,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/workloads/${id}`);
      await loadWorkloads();
      if (form.id === id) resetForm();
    } catch (err) {
      console.error(err);
      setError("Unable to delete record.");
    } finally {
      setSaving(false);
    }
  };

  const totalPEs = useMemo(() => new Set(workloads.map((w) => w.peName)).size, [workloads]);
  const avgOccupancy = useMemo(() => {
    if (!workloads.length) return 0;
    const sum = workloads.reduce((acc, w) => acc + Number(w.occupancy || 0), 0);
    return parseFloat((sum / workloads.length).toFixed(1));
  }, [workloads]);

  if (loading) return <AppLayout><TopBar title="Admin Workload" /><LoadingScreen /></AppLayout>;

  return (
    <AppLayout>
      <TopBar title="Admin Workload" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Workload Records" value={workloads.length} icon={null} color="#3d5aff" />
          <StatCard title="Distinct PEs" value={totalPEs} icon={null} color="#06d6a0" />
          <StatCard title="Avg Occupancy" value={`${avgOccupancy}%`} icon={null} color="#fbbf24" />
        </motion.div>

        {error && <div className="p-3 rounded-lg bg-red-600/10 border border-red-500/20 text-red-200">{error}</div>}

        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="card card-hover p-4 space-y-3">
          <h3 className="section-title">{form.id ? "Edit Workload" : "New Workload"}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={form.peName} onChange={(e) => setForm({ ...form, peName: e.target.value })} className="input input-light">
              <option value="">Choose PE Name</option>
              {PE_NAMES.map((name) => (<option key={name} value={name}>{name}</option>))}
            </select>

            <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="input input-light">
              <option value="">Choose Project</option>
              {PROJECTS.map((project) => (<option key={project} value={project}>{project}</option>))}
            </select>

            <select value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} className="input input-light">
              <option value="">Choose Task</option>
              {TASKS.map((task) => (<option key={task} value={task}>{task}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="number" value={form.occupancy} onChange={(e) => setForm({ ...form, occupancy: e.target.value })} placeholder="Occupancy %" className="input input-light" />
            <input type="number" value={form.bandwidth} onChange={(e) => setForm({ ...form, bandwidth: e.target.value })} placeholder="Bandwidth %" className="input input-light" />
            <select value={form.reviewer} onChange={(e) => setForm({ ...form, reviewer: e.target.value })} className="input input-light">
              <option value="">Choose Reviewer</option>
              {REVIEWERS.map((name) => (<option key={name} value={name}>{name}</option>))}
            </select>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="btn-primary w-full">{form.id ? "Update Record" : "Add Record"}</button>
              {form.id && <button type="button" onClick={resetForm} className="btn-secondary w-full">Cancel</button>}
            </div>
          </div>
        </motion.form>

        <div className="card p-4 overflow-x-auto">
          <h3 className="section-title mb-3">Workload Records</h3>
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-white/40 border-b border-white/[0.08]">
                <th className="px-3 py-2">PE Name</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Occupancy</th>
                <th className="px-3 py-2">Bandwidth</th>
                <th className="px-3 py-2">Reviewer</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workloads.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-white/[0.05] hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-2">{item.peName}</td>
                  <td className="px-3 py-2">{item.project}</td>
                  <td className="px-3 py-2">{item.task}</td>
                  <td className="px-3 py-2">{item.occupancy}%</td>
                  <td className="px-3 py-2">{item.bandwidth}%</td>
                  <td className="px-3 py-2">{item.reviewer}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button type="button" onClick={() => handleEdit(item)} className="btn-secondary">Edit</button>
                    <button type="button" onClick={() => handleDelete(item.id)} className="btn-danger">Delete</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminWorkloadPage;
