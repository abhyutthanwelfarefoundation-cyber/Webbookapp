import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdHelp, MdCheckCircle, MdPending, MdHourglassEmpty } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';

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

export default function HelpPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'password_reset', subject: '', message: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/tickets').then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/tickets', d),
    onSuccess: () => {
      qc.invalidateQueries(['tickets']);
      toast.success('Ticket submitted! Admin will respond soon.');
      setModalOpen(false);
      setForm({ type: 'password_reset', subject: '', message: '' });
    }
  });

  const handleSubmit = () => {
    if (!form.subject.trim() || !form.message.trim()) return toast.error('All fields required');
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-500 text-sm mt-1">
            Raise a ticket and admin will help you
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<MdAdd size={20} />}>
          New Ticket
        </Button>
      </div>

      {/* Tickets list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : data?.tickets?.length === 0 ? (
        <div className="text-center py-20">
          <MdHelp size={56} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 font-medium">No tickets yet</p>
          <p className="text-gray-300 text-sm mt-1">
            Need help? Create a ticket and admin will assist you.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data?.tickets?.map((ticket, i) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-gray-400 font-medium">
                      {typeLabels[ticket.type]}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg ${statusConfig[ticket.status].color}`}>
                      {statusConfig[ticket.status].icon}
                      {statusConfig[ticket.status].label}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800">{ticket.subject}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {ticket.message}
              </p>

              {/* Admin reply */}
              {ticket.adminNote && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mt-2">
                  <p className="text-xs font-semibold text-indigo-600 mb-1">
                    Admin Response
                  </p>
                  <p className="text-sm text-indigo-800">{ticket.adminNote}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* New ticket modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Raise a Support Ticket">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Issue Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="password_reset">🔑 Forgot / Reset Password</option>
              <option value="account_issue">👤 Account Issue</option>
              <option value="book_issue">📚 Book Not Loading</option>
              <option value="other">💬 Other</option>
            </select>
          </div>

          <Input
            label="Subject *"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Brief description of your issue"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending}>
              Submit Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}