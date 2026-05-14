import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdBlock, MdPerson } from 'react-icons/md';
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
  const [form, setForm] = useState({ name: '', email: '', password: '' });

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

  const closeModal = () => { setModalOpen(false); setEditAgent(null); setForm({ name: '', email: '', password: '' }); };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setForm({ name: agent.name, email: agent.email, password: '' });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editAgent && !form.password) return toast.error('Password is required for new agents');
    if (editAgent) updateMutation.mutate({ id: editAgent._id, data: { name: form.name, email: form.email } });
    else createMutation.mutate({ ...form, role: 'agent' });
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
                    {agent.isActive && (
                      <Button variant="danger" size="sm" icon={<MdBlock size={15} />}
                        loading={deactivateMutation.isPending}
                        onClick={() => { if (window.confirm('Deactivate this agent?')) deactivateMutation.mutate(agent._id); }}>
                        Deactivate
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
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Agent full name" />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="agent@company.com" />
          {!editAgent && (
            <Input label="Password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
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
