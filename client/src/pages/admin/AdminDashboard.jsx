import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MdBook, MdFolder, MdPeople, MdAdd } from 'react-icons/md';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Card from '../../components/common/Card';

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-3xl font-bold text-gray-800">{value ?? '–'}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function AdminDashboard() {
  const { data: books } = useQuery({ queryKey: ['books', 'all'], queryFn: () => api.get('/books').then(r => r.data) });
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) });

  const stats = [
    { icon: <MdBook size={28} className="text-indigo-600" />, label: 'Total Books', value: books?.total, color: 'bg-indigo-50', delay: 0 },
    { icon: <MdFolder size={28} className="text-emerald-600" />, label: 'Categories', value: cats?.categories?.length, color: 'bg-emerald-50', delay: 0.05 },
    { icon: <MdPeople size={28} className="text-blue-600" />, label: 'Agents', value: users?.count, color: 'bg-blue-50', delay: 0.1 }
  ];

  const quickLinks = [
    { to: '/admin/books', icon: <MdBook size={20} className="text-indigo-600" />, label: 'Manage Books', desc: 'Upload, edit, delete books' },
    { to: '/admin/categories', icon: <MdFolder size={20} className="text-emerald-600" />, label: 'Manage Categories', desc: 'Organise your catalog tree' },
    { to: '/admin/agents', icon: <MdPeople size={20} className="text-blue-600" />, label: 'Manage Agents', desc: 'Add and manage agent accounts' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your digital book catalog</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link, i) => (
          <motion.div key={link.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={link.to}>
              <Card hover className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{link.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{link.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{link.desc}</p>
                  </div>
                  <MdAdd size={20} className="text-gray-300 ml-auto flex-shrink-0 mt-0.5" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Processing books */}
      {books?.books?.filter(b => b.processingStatus === 'processing').length > 0 && (
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm font-medium text-amber-800">
            ⏳ {books.books.filter(b => b.processingStatus === 'processing').length} book(s) are still being processed...
          </p>
        </div>
      )}
    </div>
  );
}
