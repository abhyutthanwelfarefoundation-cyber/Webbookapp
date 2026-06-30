import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdSchool, MdPerson, MdPhone, MdDelete, MdFilterList } from 'react-icons/md';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Loader from '../../components/common/Loader';

const OUTCOMES = [
  { value: 'all', label: 'All', color: '#6B7280', bg: '#F9FAFB' },
  { value: 'pending', label: 'Pending', color: '#9CA3AF', bg: '#F9FAFB' },
  { value: 'interested', label: 'Interested', color: '#10b981', bg: '#ecfdf5' },
  { value: 'follow_up', label: 'Follow Up', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'order_placed', label: 'Order Placed', color: '#6366f1', bg: '#eef2ff' },
  { value: 'not_interested', label: 'Not Interested', color: '#ef4444', bg: '#fef2f2' },
];

export default function ManageVisits() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
    const [searchSchool, setSearchSchool] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: statsData } = useQuery({
    queryKey: ['visitStats'],
    queryFn: () => api.get('/visits/stats').then(r => r.data),
    refetchInterval: 30000
  });

  const { data, isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: () => api.get('/visits').then(r => r.data),
    refetchInterval: 30000
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/visits/${id}`),
    onSuccess: () => { qc.invalidateQueries(['visits']); qc.invalidateQueries(['visitStats']); toast.success('Visit deleted'); }
  });

  const getOutcome = (val) => OUTCOMES.find(o => o.value === val) || OUTCOMES[1];

const filtered = (data?.visits || []).filter(v => {
    if (filter !== 'all' && v.outcome !== filter) return false;
    if (searchSchool && !v.schoolName?.toLowerCase().includes(searchSchool.toLowerCase())) return false;
    const vDate = new Date(v.visitDate);
    if (dateFrom && vDate < new Date(dateFrom)) return false;
    if (dateTo && vDate > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  if (isLoading) return <Loader text="Loading visits..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>School Visits</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
          All agent school visit reports
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Visits', value: statsData?.total || 0, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Today', value: statsData?.todayCount || 0, color: '#10b981', bg: '#ecfdf5' },
          { label: 'This Week', value: statsData?.weekCount || 0, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Orders', value: statsData?.outcomes?.find(o => o._id === 'order_placed')?.count || 0, color: '#8b5cf6', bg: '#f5f3ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>{s.label}</p>
          </div>
        ))}
      </div>

{/* Search + date filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="🔍 Search school name..."
          value={searchSchool}
          onChange={e => setSearchSchool(e.target.value)}
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          placeholder="From date"
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          placeholder="To date"
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
      {(searchSchool || dateFrom || dateTo) && (
        <button
          onClick={() => { setSearchSchool(''); setDateFrom(''); setDateTo(''); }}
          style={{ marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 12px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ✕ Clear filters
        </button>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {OUTCOMES.map(o => (
          <button key={o.value} onClick={() => setFilter(o.value)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              background: filter === o.value ? o.bg : '#fff',
              color: filter === o.value ? o.color : '#9CA3AF',
              border: `1.5px solid ${filter === o.value ? o.color + '44' : '#E5E7EB'}`
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Visits table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <MdSchool size={48} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: '#9CA3AF', fontWeight: 500, margin: 0 }}>No visits found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((visit, i) => {
            const outcome = getOutcome(visit.outcome);
            const isExpanded = expandedId === visit._id;

            return (
              <motion.div
                key={visit._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : visit._id)}
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {/* Selfie */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                    background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {visit.selfieUrl
                      ? <img src={visit.selfieUrl} alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <MdSchool size={26} color="#94a3b8" />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {visit.schoolName}
                      </p>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: outcome.bg, color: outcome.color, flexShrink: 0 }}>
                        {outcome.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
                      👤 {visit.agentId?.name} · {new Date(visit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {visit.teacherName && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                        Teacher: {visit.teacherName}
                      </p>
                    )}
                  </div>

                  <span style={{ color: '#9CA3AF', fontSize: 16, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F9FAFB' }}>
                    {visit.selfieUrl && (
                      <img src={visit.selfieUrl} alt="selfie"
                        style={{ width: '100%', maxHeight: 250, objectFit: 'cover', borderRadius: 12, margin: '12px 0' }} />
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                      {visit.principalName && (
                        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Principal</p>
                          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>{visit.principalName}</p>
                        </div>
                      )}
                      {visit.phoneNumber && (
                        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone</p>
                          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>{visit.phoneNumber}</p>
                        </div>
                      )}
                      {visit.notes && (
                        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', gridColumn: '1/-1' }}>
                          <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</p>
                          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{visit.notes}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { if (window.confirm('Delete this visit?')) deleteMutation.mutate(visit._id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'none', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <MdDelete size={15} /> Delete
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}