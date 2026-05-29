import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdBlock, MdPerson, MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';

export default function ManageAgents() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', newPassword: '', isActive: true });
  const [showPass, setShowPass] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/auth/register', d),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Agent created'); closeModal(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Agent updated'); closeModal(); }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Agent deactivated'); }
  });

  const reactivateMutation = useMutation({
    mutationFn: ({ id }) => api.put(`/users/${id}`, { isActive: true }),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Agent reactivated'); }
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditAgent(null);
    setForm({ name: '', email: '', password: '', newPassword: '', isActive: true });
    setShowPass(false);
  };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setForm({ name: agent.name, email: agent.email, password: '', newPassword: '', isActive: agent.isActive });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editAgent && !form.password) return toast.error('Password is required for new agents');
    if (editAgent) {
      const updateData = { name: form.name, email: form.email, isActive: form.isActive };
      if (form.newPassword) {
        if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
        updateData.password = form.newPassword;
      }
      updateMutation.mutate({ id: editAgent._id, data: updateData });
    } else {
      if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
      createMutation.mutate({ name: form.name, email: form.email, password: form.password, role: 'agent' });
    }
  };

  if (isLoading) return <Loader text="Loading agents..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.count || 0} agents registered</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<MdAdd size={20} />}>Add Agent</Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Agent', 'Email', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.users?.map(agent => (
              <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <MdPerson size={18} className="text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{agent.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{agent.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {agent.lastLogin ? new Date(agent.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon={<MdEdit size={15} />} onClick={() => openEdit(agent)}>Edit</Button>
                    {agent.isActive ? (
                      <Button variant="danger" size="sm" icon={<MdBlock size={15} />}
                        loading={deactivateMutation.isPending}
                        onClick={() => { if (window.confirm('Deactivate this agent?')) deactivateMutation.mutate(agent._id); }}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" icon={<MdCheckCircle size={15} />}
                        loading={reactivateMutation.isPending}
                        onClick={() => reactivateMutation.mutate({ id: agent._id })}>
                        Reactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.users || data.users.length === 0) && (
          <p className="text-center py-12 text-gray-400 text-sm">No agents yet. Add one to get started.</p>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editAgent ? 'Edit Agent' : 'Add New Agent'}>
        <div className="flex flex-col gap-4">
          <Input label="Full Name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Agent full name" />

          <Input label="Email *" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="agent@company.com" />

          {/* Password field — different for create vs edit */}
          {!editAgent ? (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Enter new password or leave blank"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Active/Inactive toggle — only show in edit mode */}
          {editAgent && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Account Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: true }))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: `1.5px solid ${form.isActive ? '#10b981' : '#E5E7EB'}`,
                    background: form.isActive ? '#f0fdf4' : '#fff',
                    color: form.isActive ? '#10b981' : '#9CA3AF',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <MdCheckCircle size={16} /> Active
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: false }))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: `1.5px solid ${!form.isActive ? '#ef4444' : '#E5E7EB'}`,
                    background: !form.isActive ? '#fef2f2' : '#fff',
                    color: !form.isActive ? '#ef4444' : '#9CA3AF',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <MdBlock size={16} /> Inactive
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editAgent ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}