import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaUserShield,
  FaComments,
  FaPaperPlane,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaUserCheck,
  FaShieldAlt,
  FaPhone,
  FaEnvelope,
  FaSync,
  FaUserPlus
} from 'react-icons/fa';
import { useThemeStore } from '../../store/useThemeStore';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../../services/admin.service';
import { toast } from 'react-toastify';
import { formatTime } from '../../utils/formatTime';

const AdminDashboard = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalConversations: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    phoneSuffix: '+91',
    about: 'Hey there! I am using Alliance.',
    role: 'admin',
  });
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    phoneSuffix: '+91',
    about: '',
    role: 'admin',
  });
  const [updating, setUpdating] = useState(false);

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers();
      if (res.status === 'success' || res.data) {
        const userList = res.data?.users || res.users || [];
        setUsers(userList);
        if (res.data?.stats || res.stats) {
          setStats(res.data?.stats || res.stats);
        }
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to load user management data';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handlers for Add User
  const handleCreateUser = async () => {
    if (!newUserData.username && !newUserData.email && !newUserData.phoneNumber) {
      toast.error('Please enter at least a username, email, or phone number');
      return;
    }

    let payload = { ...newUserData };
    if (payload.email && !payload.email.includes('@') && payload.email.includes('gmail.com')) {
      payload.email = payload.email.replace('gmail.com', '@gmail.com');
    }

    try {
      setCreating(true);
      const res = await createAdminUser(payload);
      if (res.status === 'success' || res.data) {
        toast.success(`Admin user ${payload.username || 'registration'} created successfully!`);
        setShowAddModal(false);
        setNewUserData({
          username: '',
          email: '',
          phoneNumber: '',
          phoneSuffix: '+91',
          about: 'Hey there! I am using Alliance.',
          role: 'admin',
        });
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to create user registration');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error creating user registration');
    } finally {
      setCreating(false);
    }
  };

  // Handlers for Edit
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      phoneSuffix: user.phoneSuffix || '+91',
      about: user.about || '',
      role: user.role || 'user',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      setUpdating(true);
      const res = await updateAdminUser(editingUser._id, editFormData);
      if (res.status === 'success' || res.data) {
        toast.success(`User details updated successfully!`);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to update user');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating user details');
    } finally {
      setUpdating(false);
    }
  };

  // Handlers for Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      setDeleting(true);
      const res = await deleteAdminUser(deletingUser._id);
      if (res.status === 'success' || res.data) {
        toast.success(`User registration deleted permanently`);
        setDeletingUser(null);
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to delete user registration');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error deleting user registration');
    } finally {
      setDeleting(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber || '').includes(searchTerm) ||
      (u._id || '').includes(searchTerm);

    const matchesRole =
      roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div
      className={`h-full flex flex-col overflow-y-auto select-none p-4 md:p-6 ${
        isDark ? 'bg-[#09090B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 accent-gradient rounded-2xl text-white shadow-lg shadow-orange-500/20">
              <FaShieldAlt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
              <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                Manage user registrations, edit details, register new users, and monitor system metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl accent-gradient text-white shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all"
          >
            <FaUserPlus className="w-3.5 h-3.5" />
            <span>Add New User</span>
          </button>

          <button
            onClick={fetchUsers}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl border transition-all ${
              isDark
                ? 'bg-[#18181B] border-[#27272A] hover:border-[#F97316] text-[#FAFAFA]'
                : 'bg-white border-[#E7E5E4] hover:border-[#F97316] text-[#0C0A09] shadow-sm'
            }`}
          >
            <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F97316]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Registered Users', value: stats.totalUsers, icon: FaUsers, color: 'from-orange-500 to-amber-500' },
          { label: 'System Administrators', value: stats.totalAdmins, icon: FaUserShield, color: 'from-purple-600 to-indigo-500' },
          { label: 'Active Conversations', value: stats.totalConversations, icon: FaComments, color: 'from-emerald-500 to-teal-400' },
          { label: 'Messages Exchanged', value: stats.totalMessages, icon: FaPaperPlane, color: 'from-blue-500 to-cyan-400' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-3xl border flex items-center gap-4 ${
                isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#E7E5E4] shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                  {card.label}
                </p>
                <h3 className="text-2xl font-black">{loading ? '...' : card.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search & Role Filters */}
      <div className={`p-4 rounded-3xl border mb-6 flex flex-col md:flex-row gap-3 ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#E7E5E4] shadow-sm'
      }`}>
        <div className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${
          isDark
            ? 'bg-[#09090B] border-[#27272A] focus-within:border-[#F97316]'
            : 'bg-[#FAFAF9] border-[#E7E5E4] focus-within:border-[#F97316]'
        }`}>
          <FaSearch className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
          <input
            type="text"
            placeholder="Search users by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-transparent text-xs font-medium outline-none ${
              isDark ? 'placeholder-[#71717A]' : 'placeholder-[#A8A29E]'
            }`}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-[#71717A] hover:text-[#FAFAFA]">
              <FaTimes />
            </button>
          )}
        </div>

        {/* Role Selector Tabs */}
        <div className="flex gap-2">
          {['all', 'user', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 text-xs font-bold rounded-2xl capitalize transition-all border ${
                roleFilter === role
                  ? 'accent-gradient text-white border-transparent shadow-md shadow-orange-500/20'
                  : isDark
                    ? 'bg-[#09090B] border-[#27272A] text-[#71717A] hover:text-white'
                    : 'bg-[#FAFAF9] border-[#E7E5E4] text-[#78716C] hover:text-black'
              }`}
            >
              {role === 'all' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Users Management Table */}
      <div className={`rounded-3xl border overflow-hidden flex-1 ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#E7E5E4] shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'bg-[#09090B]/60 border-[#27272A] text-[#71717A]' : 'bg-[#FAFAF9] border-[#E7E5E4] text-[#A8A29E]'} font-bold uppercase tracking-wider`}>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Stats</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#27272A]' : 'divide-[#E7E5E4]'}`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#71717A]">
                    Loading user registry...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#71717A]">
                    No matching user registrations found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className={`transition-colors ${isDark ? 'hover:bg-[#27272A]/50' : 'hover:bg-[#F5F5F4]'}`}>
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={u.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`}
                            alt={u.username}
                            className="w-10 h-10 rounded-2xl object-cover border border-orange-500/20"
                          />
                          {u.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm truncate">{u.username || 'Unnamed User'}</p>
                          <p className={`text-[10px] truncate ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                            ID: {u._id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {u.email && (
                          <div className="flex items-center gap-1.5 font-semibold">
                            <FaEnvelope className="text-[#F97316] w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                        )}
                        {u.phoneNumber && (
                          <div className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-[#A1A1AA]' : 'text-[#78716C]'}`}>
                            <FaPhone className="text-emerald-500 w-3 h-3 flex-shrink-0" />
                            <span>{u.phoneSuffix}{u.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl inline-flex items-center gap-1 ${
                        u.role === 'admin'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {u.role === 'admin' ? <FaUserShield /> : <FaUserCheck />}
                        <span>{u.role || 'user'}</span>
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="py-3.5 px-4">
                      <div className={`text-[11px] font-semibold space-y-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#78716C]'}`}>
                        <p>Chats: <strong className="text-white">{u.conversationCount || 0}</strong></p>
                        <p>Sent: <strong className="text-white">{u.messageCount || 0}</strong></p>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className={`py-3.5 px-4 text-[11px] font-medium ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                      {u.createdAt ? formatTime(u.createdAt) : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"
                          title="Edit User Details"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Delete User Registration"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW USER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#E7E5E4] text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4 border-[#27272A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 accent-gradient rounded-xl text-white">
                    <FaUserPlus />
                  </div>
                  <h3 className="text-lg font-extrabold">Register New User</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Prefix</label>
                    <input
                      type="text"
                      value={newUserData.phoneSuffix}
                      onChange={(e) => setNewUserData({ ...newUserData, phoneSuffix: e.target.value })}
                      className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                        isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={newUserData.phoneNumber}
                      onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                      className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                        isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">About Bio</label>
                  <input
                    type="text"
                    value={newUserData.about}
                    onChange={(e) => setNewUserData({ ...newUserData, about: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="admin">Admin (Full Administrative Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#27272A]">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition ${
                    isDark ? 'border-[#27272A] hover:bg-[#27272A] text-slate-300' : 'border-[#E7E5E4] hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={creating}
                  className="flex-1 py-3 text-xs font-bold rounded-2xl accent-gradient text-white shadow-lg shadow-orange-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creating ? <span>Registering...</span> : <><FaCheck /><span>Create Registration</span></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER DETAILS MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#E7E5E4] text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4 border-[#27272A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 accent-gradient rounded-xl text-white">
                    <FaEdit />
                  </div>
                  <h3 className="text-lg font-extrabold">Edit User Registration</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Username</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Prefix</label>
                    <input
                      type="text"
                      value={editFormData.phoneSuffix}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneSuffix: e.target.value })}
                      className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                        isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                        isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">About Bio</label>
                  <input
                    type="text"
                    value={editFormData.about}
                    onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest block mb-1">Access Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className={`w-full p-3 text-xs font-semibold rounded-2xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#09090B] border-[#27272A] text-white' : 'bg-[#FAFAF9] border-[#E7E5E4] text-slate-900'
                    }`}
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="admin">Admin (Full Administrative Privilege)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#27272A]">
                <button
                  onClick={() => setEditingUser(null)}
                  disabled={updating}
                  className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition ${
                    isDark ? 'border-[#27272A] hover:bg-[#27272A] text-slate-300' : 'border-[#E7E5E4] hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="flex-1 py-3 text-xs font-bold rounded-2xl accent-gradient text-white shadow-lg shadow-orange-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updating ? <span>Saving...</span> : <><FaCheck /><span>Save Changes</span></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE USER REGISTRATION MODAL */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#E7E5E4] text-slate-900'
              }`}
            >
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold text-center mb-2">Delete User Registration?</h3>
              <p className={`text-xs text-center leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Are you sure you want to delete registration for <strong className="text-red-500">{deletingUser.username || deletingUser.email || deletingUser._id}</strong>?
                This will permanently purge their profile, chats, and messages from the database.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={deleting}
                  className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition ${
                    isDark ? 'border-[#27272A] hover:bg-[#27272A] text-slate-300' : 'border-[#E7E5E4] hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 text-xs font-bold rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <FaTrash className="w-3.5 h-3.5" />
                      <span>Delete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
