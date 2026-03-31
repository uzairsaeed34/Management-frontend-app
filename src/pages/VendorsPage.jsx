import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Search, CheckCircle2, Clock, Trash2, Edit2, Loader2, Download, Upload } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { Modal, Input, Textarea, Select, StatusBadge, ProgressBar, EmptyState, LoadingScreen } from "../components/shared/UIComponents";
import api from "../utils/api";
import { formatDate } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { exportToExcel, importFromExcel } from "../utils/excel";

const empty = { vendorName: "", project: "", status: "pending", notes: "", vendorType: "", country: "" };

function VendorModal({ isOpen, onClose, vendor, onSaved }) {
  const [form, setForm] = useState(empty);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    api.get("/projects").then(({ data }) => setProjects(data.projects.map((p) => ({ value: p._id, label: p.name }))));
    if (vendor) {
      setForm({ vendorName: vendor.vendorName||"", project: vendor.project?._id||vendor.project||"", status: vendor.status||"pending", notes: vendor.notes||"", vendorType: vendor.vendorType||"", country: vendor.country||"" });
    } else { setForm(empty); }
  }, [isOpen, vendor]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (vendor) { await api.put(`/vendors/${vendor._id}`, form); toast("Vendor updated","success"); }
      else { await api.post("/vendors", form); toast("Vendor created","success"); }
      onSaved?.(); onClose();
    } catch(err) { toast(err.response?.data?.message||"Failed","error"); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title={vendor ? "Edit Vendor" : "Add Vendor"}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input label="Vendor Name" required placeholder="e.g. Acme Industries" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
            <Select label="Project" required value={form.project} onChange={(v) => setForm({ ...form, project: v })} options={projects} placeholder="Select project" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Vendor Type" placeholder="e.g. Supplier" value={form.vendorType} onChange={(e) => setForm({ ...form, vendorType: e.target.value })} />
              <Input label="Country" placeholder="e.g. United States" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }]} />
            <Textarea label="Notes" placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {vendor ? "Save Changes" : "Add Vendor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}

function ImportVendorModal({ isOpen, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setFile(null); setProject("");
    api.get("/projects").then(({ data }) => setProjects(data.projects.map((p) => ({ value: p._id, label: p.name }))));
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !project) return toast("Select project and file", "error");
    setSaving(true);
    try {
      const parsedData = await importFromExcel(file);
      // Map user-friendly excel column names to backend schema keys
      const data = parsedData.map(row => ({
        vendorName: row["Vendor Name"] || row.vendorName || row.name || row.Name || `Vendor ${Math.floor(Math.random() * 1000)}`,
        vendorType: row["Type"] || row.vendorType || row.type || "",
        country: row["Country"] || row.country || "",
        status: (row["Status"] || row.status || "pending").toLowerCase(),
        notes: row["Notes"] || row.notes || ""
      }));
      await api.post("/vendors/bulk", { projectId: project, vendors: data });
      toast("Vendors imported successfully", "success");
      onImported?.();
      onClose();
    } catch (err) { toast(err.message || "Failed to import", "error"); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Vendors">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Select label="Target Project" required value={project} onChange={(v) => setProject(v)} options={projects} placeholder="Select destination project" />
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Select .xlsx File</label>
              <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 transition-colors" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving || !file || !project} className="btn-primary disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Import
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState([]);
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (projectFilter) params.set("project", projectFilter);
      const { data } = await api.get(`/vendors?${params}`);
      setVendors(data.vendors);
    } finally { setLoading(false); }
  }, [search, statusFilter, projectFilter]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { api.get("/projects").then(({ data }) => setProjects(data.projects)); }, []);

  const toggleStatus = async (vendor) => {
    const newStatus = vendor.status === "pending" ? "completed" : "pending";
    try {
      await api.put(`/vendors/${vendor._id}`, { status: newStatus });
      toast(newStatus === "completed" ? "Marked completed ✓" : "Marked pending", "success");
      fetchVendors();
    } catch { toast("Failed to update", "error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this vendor?")) return;
    try { await api.delete(`/vendors/${id}`); toast("Vendor deleted", "success"); fetchVendors(); }
    catch { toast("Failed to delete", "error"); }
  };

  const handleExport = () => {
    if (!vendors.length) return toast("No vendors to export", "error");
    const exportData = vendors.map(v => ({
      "Vendor Name": v.vendorName,
      "Project": v.project?.name || "Unassigned",
      "Type": v.vendorType || "",
      "Country": v.country || "",
      "Status": v.status,
      "Completed": v.completedDate ? formatDate(v.completedDate) : "",
      "Notes": v.notes || ""
    }));
    exportToExcel(exportData, `Vendors_${new Date().toISOString().split('T')[0]}`);
  };

  const completedCount = vendors.filter((v) => v.status === "completed").length;
  const completionPct = vendors.length > 0 ? Math.round((completedCount / vendors.length) * 100) : 0;

  const groupedVendors = useMemo(() => {
    return vendors.reduce((acc, v) => {
      const pName = v.project?.name || "Unassigned";
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(v);
      return acc;
    }, {});
  }, [vendors]);

  return (
    <AppLayout>
      <TopBar title="Vendors" onNewClick={() => { setEditVendor(null); setModalOpen(true); }} newLabel="Add Vendor" />
      <div className="flex-1 overflow-y-auto">
        {/* Stats bar */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-8 flex-wrap">
            {[
              { label: "Total", value: vendors.length, color: "text-white" },
              { label: "Completed", value: completedCount, color: "text-green-400" },
              { label: "Pending", value: vendors.length - completedCount, color: "text-yellow-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs text-white/40 mb-0.5">{label}</p>
                <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
              </div>
            ))}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/40">Overall Progress</span>
                <span className="text-white font-semibold">{completionPct}%</span>
              </div>
              <ProgressBar value={completionPct} color="#06d6a0" />
            </div>
            {/* Quick Actions */}
            <div className="flex items-center gap-3 ml-auto">
              <button onClick={() => setImportModalOpen(true)} className="btn-secondary py-1.5 px-3">
                <Upload size={14} /> Import
              </button>
              <button onClick={handleExport} className="btn-secondary py-1.5 px-3">
                <Download size={14} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-surface/90 glass border-b border-white/[0.06] px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input placeholder="Search vendors..." className="input pl-8 py-2 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {["", "pending", "completed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <select className="input py-2 h-9 text-sm appearance-none max-w-[180px]" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id} className="bg-surface-50">{p.name}</option>)}
          </select>
          <span className="text-xs text-white/30 ml-auto">{vendors.length} vendors visible</span>
        </div>

        <div className="p-6">
          {loading ? <LoadingScreen /> : vendors.length === 0 ? (
            <EmptyState icon={Building2} title="No vendors found" description="Add or import vendors to get started"
              action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} />Add Vendor</button>} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {Object.keys(groupedVendors).map((projName, idx) => (
                <div key={projName} className="space-y-3">
                  <h3 className="text-white font-medium text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {projName} <span className="text-white/30 text-sm font-normal">({groupedVendors[projName].length})</span>
                  </h3>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white/[0.04] text-white/40 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-medium">Status / Name</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Location</th>
                            <th className="px-4 py-3 font-medium">Added By</th>
                            <th className="px-4 py-3 font-medium">Notes</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {groupedVendors[projName].map((vendor, i) => (
                            <motion.tr key={vendor._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 flex items-center gap-3">
                                <button onClick={() => toggleStatus(vendor)}
                                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${vendor.status === "completed" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/[0.04] text-white/20 border border-white/[0.08] hover:text-green-400 hover:border-green-500/30"}`}>
                                  {vendor.status === "completed" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                </button>
                                <div>
                                  <div className={`font-medium ${vendor.status === "completed" ? "line-through text-white/40" : "text-white"}`}>{vendor.vendorName}</div>
                                  {vendor.completedDate && <div className="text-[10px] text-green-400">Done {formatDate(vendor.completedDate)}</div>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-white/60">
                                {vendor.vendorType && <span className="bg-white/[0.04] px-2 py-0.5 rounded text-xs">{vendor.vendorType}</span>}
                              </td>
                              <td className="px-4 py-3 text-white/60 text-xs">
                                {vendor.country && `🌍 ${vendor.country}`}
                              </td>
                              <td className="px-4 py-3 text-white/40 text-xs">
                                {vendor.createdBy?.name || "Unknown"}
                              </td>
                              <td className="px-4 py-3 text-white/40 text-xs max-w-[200px] truncate" title={vendor.notes}>
                                {vendor.notes}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => { setEditVendor(vendor); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                  {isAdmin && <button onClick={() => handleDelete(vendor._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <VendorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} vendor={editVendor} onSaved={fetchVendors} />
      <ImportVendorModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onImported={fetchVendors} />
    </AppLayout>
  );
}

