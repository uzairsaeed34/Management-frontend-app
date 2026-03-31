import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, Shield, UserCircle, Trash2, Edit2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { Modal, Input, Select, Avatar, EmptyState, LoadingScreen, StatusBadge } from "../components/shared/UIComponents";
import api from "../utils/api";
import { formatDate, timeAgo } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const empty = { name: "", email: "", password: "", role: "pe", isActive: true };

function UserModal({ isOpen, onClose, user: editUser, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    if (editUser) { setForm({ name: editUser.name||"", email: editUser.email||"", password: "", role: editUser.role||"pe", isActive: editUser.isActive !== false }); }
    else { setForm(empty); }
  }, [isOpen, editUser]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (editUser && !payload.password) delete payload.password;
      if (editUser) { await api.put(`/users/${editUser._id}`, payload); toast("User updated","success"); }
      else { await api.post("/auth/register", payload); toast("User created","success"); }
      onSaved?.(); onClose();
    } catch(err) { toast(err.response?.data?.message||"Failed","error"); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title={editUser?"Edit User":"New User"}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input label="Full Name" required placeholder="John Doe" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
            <Input label="Email" required type="email" placeholder="john@company.com" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
            <Input label={editUser?"New Password (leave blank to keep)":"Password"} type="password" placeholder="••••••••" required={!editUser} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Role" value={form.role} onChange={(v)=>setForm({...form,role:v})} options={[{value:"pe",label:"Prompt Engineer"},{value:"admin",label:"Admin"}]}/>
              <Select label="Status" value={form.isActive?"true":"false"} onChange={(v)=>setForm({...form,isActive:v==="true"})} options={[{value:"true",label:"Active"},{value:"false",label:"Inactive"}]}/>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving&&<Loader2 size={14} className="animate-spin"/>}{editUser?"Save Changes":"Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const { user: me } = useAuth();
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
    } finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast(user.isActive ? "User deactivated" : "User activated", "success");
      fetchUsers();
    } catch { toast("Failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this user?")) return;
    try { await api.delete(`/users/${id}`); toast("User deactivated","success"); fetchUsers(); }
    catch { toast("Failed","error"); }
  };

  return (
    <AppLayout>
      <TopBar title="Users" onNewClick={()=>{setEditUser(null);setModalOpen(true);}} newLabel="New User"/>
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface/90 glass border-b border-white/[0.06] px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input placeholder="Search users..." className="input pl-8 py-2 h-9 text-sm" value={search} onChange={(e)=>setSearch(e.target.value)}/>
          </div>
          {["","admin","pe"].map((r)=>(
            <button key={r} onClick={()=>setRoleFilter(r)} className={"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors "+(roleFilter===r?"bg-white/[0.1] text-white":"text-white/40 hover:text-white")}>
              {r===""?"All":r==="pe"?"PE (Prompt Engineer)":"Admin"}
            </button>
          ))}
          <span className="text-xs text-white/30 ml-auto">{users.length} users</span>
        </div>
        <div className="p-6">
          {loading?<LoadingScreen/>:users.length===0?(
            <EmptyState icon={Users} title="No users found" action={<button className="btn-primary" onClick={()=>setModalOpen(true)}><Plus size={16}/>New User</button>}/>
          ):(
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {users.map((u,i)=>(
                <motion.div key={u._id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="card-hover p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="lg"/>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{u.name}</p>
                          {u._id === me?._id && <span className="text-[10px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded">You</span>}
                        </div>
                        <p className="text-xs text-white/40">{u.email}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${u.role==="admin"?"bg-purple-500/15 text-purple-400 border border-purple-500/20":"bg-brand-500/15 text-brand-400 border border-brand-500/20"}`}>
                      {u.role==="admin"?<Shield size={11}/>:<UserCircle size={11}/>}
                      {u.role==="admin"?"Admin":"PE"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
                    <span>Joined {formatDate(u.createdAt)}</span>
                    {u.lastLogin&&<span>· Last seen {timeAgo(u.lastLogin)}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${u.isActive?"bg-green-400":"bg-white/20"}`}/>
                      <span className={"text-xs "+(u.isActive?"text-green-400":"text-white/30")}>{u.isActive?"Active":"Inactive"}</span>
                    </div>
                    {u._id !== me?._id && (
                      <div className="flex items-center gap-1">
                        <button onClick={()=>toggleActive(u)} className={"p-1.5 rounded-lg transition-colors "+(u.isActive?"hover:bg-yellow-500/10 text-white/30 hover:text-yellow-400":"hover:bg-green-500/10 text-white/30 hover:text-green-400")}>
                          {u.isActive?<ToggleRight size={15}/>:<ToggleLeft size={15}/>}
                        </button>
                        <button onClick={()=>{setEditUser(u);setModalOpen(true);}} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors"><Edit2 size={13}/></button>
                        <button onClick={()=>handleDelete(u._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <UserModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} user={editUser} onSaved={fetchUsers}/>
    </AppLayout>
  );
}
