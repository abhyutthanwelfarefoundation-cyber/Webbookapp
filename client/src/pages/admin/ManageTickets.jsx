import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdCheckCircle, MdPending, MdHourglassEmpty, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

const statusConfig = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-700',   icon: <MdPending size={14} /> },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: <MdHourglassEmpty size={14} /> },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-700', icon: <MdCheckCircle size={14} /> }
};

const typeLabels = {
  password_reset: '🔑 Password Reset',
  account_issue:  '👤 Account Issue',
  book_issue:     '📚 Book Issue',
  other:          '💬 Other'
};

export default function ManageTickets() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/tickets').then(r => r.data),
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/tickets/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['tickets']);
      toast.success('Ticket updated');
      setSelected(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tickets/${id}`),
    onSuccess: () => { qc.invalidateQueries(['tickets']); toast.success('Ticket deleted'); }
  });

  const openTicket = (ticket) => {
    setSelected(ticket);
    setAdminNote(ticket.adminNote || '');
    setNewStatus(ticket.status);
  };

  const handleUpdate = () => {
    if (!newStatus) return;
    updateMutation.mutate({ id: selected._id, data: { status: newStatus, adminNote } });
  };

  const filtered = data?.tickets?.filter(t => filter === 'all' || t.status === filter) || [];
  const openCount = data?.tickets?.filter(t => t.status === 'open').length || 0;

  if (isLoading) return <Loader text="Loading tickets..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">
            {openCount > 0
              ? <span className="text-red-500 font-medium">{openCount} open ticket{openCount > 1 ? 's' : ''} need attention</span>
              : 'All tickets resolved ✅'
            }
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? `All (${data?.count || 0})` : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No tickets found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ticket, i) => (
            <div
              key={ticket._id}
              onClick={() => openTicket(ticket)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-gray-400">{typeLabels[ticket.type]}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg ${statusConfig[ticket.status].color}`}>
                      {statusConfig[ticket.status].icon}
                      {statusConfig[ticket.status].label}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800">{ticket.subject}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xs font-medium text-indigo-600">
                    {ticket.agentId?.name}
                  </span>
                </div>
              </div>
              {ticket.adminNote && (
                <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-green-700 line-clamp-1">✅ {ticket.adminNote}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Respond to Ticket" size="md">
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Ticket info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">{typeLabels[selected.type]}</span>
                <span className="text-xs font-medium text-indigo-600">{selected.agentId?.name} ({selected.agentId?.email})</span>
              </div>
              <p className="font-semibold text-gray-800 mb-2">{selected.subject}</p>
              <p className="text-sm text-gray-600">{selected.message}</p>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Update Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Admin note */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Your Response <span className="text-gray-400 font-normal">(visible to agent)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="e.g. Your password has been reset to Admin@1234. Please login and change it."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-between mt-2">
              <Button
                variant="danger"
                size="sm"
                icon={<MdDelete size={16} />}
                loading={deleteMutation.isPending}
                onClick={() => { if (window.confirm('Delete ticket?')) deleteMutation.mutate(selected._id); }}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={handleUpdate} loading={updateMutation.isPending}>
                  Save Response
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}