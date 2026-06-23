import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdSchool, MdPerson, MdPhone, MdDelete, MdCameraAlt, MdClose, MdCheckCircle, MdLocationOn } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const OUTCOMES = [
  { value: 'pending',        label: 'Pending',        emoji: '⏳', color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
  { value: 'interested',     label: 'Interested',     emoji: '✅', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
  { value: 'follow_up',      label: 'Follow Up',      emoji: '📞', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'order_placed',   label: 'Order Placed',   emoji: '🎉', color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
  { value: 'not_interested', label: 'Not Interested', emoji: '❌', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
];

const inp = {
  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10,
  padding: '11px 12px', fontSize: 14, fontFamily: 'Inter,sans-serif',
  outline: 'none', color: '#1F2937', background: '#FAFAFA',
  boxSizing: 'border-box', transition: 'border-color 0.2s'
};

const inpIcon = { ...inp, paddingLeft: 38 };

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function IconInput({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex' }}>
        {icon}
      </span>
      <input style={inpIcon} {...props} />
    </div>
  );
}

export default function VisitLogPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editVisit, setEditVisit] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    schoolName: '', principalName: '', teacherName: '',
    designation: '', phoneNumber: '', notes: '',
    outcome: 'pending', visitDate: new Date().toISOString().split('T')[0]
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const { data, isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: () => api.get('/visits').then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/visits', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
    onSuccess: () => { qc.invalidateQueries(['visits']); toast.success('Visit logged!'); closeModal(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => api.put(`/visits/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
    onSuccess: () => { qc.invalidateQueries(['visits']); toast.success('Visit updated!'); closeModal(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/visits/${id}`),
    onSuccess: () => { qc.invalidateQueries(['visits']); toast.success('Visit deleted'); }
  });

  const closeModal = () => {
    setModalOpen(false); setSelfiePreview(null); setSelfieFile(null);
    setEditVisit(null); setLocation(null); setLocationError('');
    setForm({ schoolName: '', principalName: '', teacherName: '', designation: '', phoneNumber: '', notes: '', outcome: 'pending', visitDate: new Date().toISOString().split('T')[0] });
  };

  const openEdit = (visit) => {
    setEditVisit(visit);
    setForm({
      schoolName: visit.schoolName || '', principalName: visit.principalName || '',
      teacherName: visit.teacherName || '', designation: visit.designation || '',
      phoneNumber: visit.phoneNumber || '', notes: visit.notes || '',
      outcome: visit.outcome || 'pending',
      visitDate: visit.visitDate ? new Date(visit.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setSelfiePreview(visit.selfieUrl || null);
    setSelfieFile(null);
    if (visit.location?.latitude) setLocation(visit.location);
    setModalOpen(true);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setLocationError('GPS not supported on this device'); return; }
    setLocationLoading(true); setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          address = data.display_name || '';
        } catch {}
        setLocation({ latitude, longitude, address });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(
          err.code === 1 ? 'Permission denied. Please allow location access.' :
          err.code === 2 ? 'Location unavailable. Try again.' : 'Request timed out.'
        );
        setLocationLoading(false);
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = () => {
    if (!form.schoolName.trim()) return toast.error('School name is required');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (selfieFile) fd.append('selfie', selfieFile);
    if (location) {
      fd.append('latitude', location.latitude);
      fd.append('longitude', location.longitude);
      fd.append('address', location.address);
    }
    if (editVisit) updateMutation.mutate({ id: editVisit._id, fd });
    else createMutation.mutate(fd);
  };

  const handleSelfie = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = ev => setSelfiePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const getOutcome = (val) => OUTCOMES.find(o => o.value === val) || OUTCOMES[0];

  const mapsUrl = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', fontFamily: 'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Visit Log</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>Record your school visits</p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, padding: '10px 18px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          <MdAdd size={20} /> Log Visit
        </button>
      </div>

      {/* Stats */}
      {(data?.total || 0) > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total', value: data?.total, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Interested', value: data?.visits?.filter(v => v.outcome === 'interested').length || 0, color: '#10b981', bg: '#ecfdf5' },
            { label: 'Orders', value: data?.visits?.filter(v => v.outcome === 'order_placed').length || 0, color: '#8b5cf6', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Visit list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Loading...</div>
      ) : !data?.visits?.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
          <p style={{ color: '#9CA3AF', fontWeight: 500, margin: 0 }}>No visits logged yet</p>
          <p style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>Tap "Log Visit" after visiting a school</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.visits.map((visit, i) => {
            const out = getOutcome(visit.outcome);
            const expanded = expandedId === visit._id;
            return (
              <motion.div key={visit._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>

                {/* Card header */}
                <div onClick={() => setExpandedId(expanded ? null : visit._id)}
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {visit.selfieUrl
                      ? <img src={visit.selfieUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22 }}>🏫</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {visit.schoolName}
                      </p>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: out.bg, color: out.color, border: `1px solid ${out.border}`, flexShrink: 0 }}>
                        {out.emoji} {out.label}
                      </span>
                    </div>
                    {visit.teacherName && <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>👤 {visit.teacherName}</p>}
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                      {new Date(visit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ color: '#C4C9D4', fontSize: 12, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F9FAFB' }}>
                        {visit.selfieUrl && (
                          <img src={visit.selfieUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, margin: '12px 0' }} />
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                          {[
                            { label: 'Principal', value: visit.principalName },
                            { label: 'Phone', value: visit.phoneNumber },
                            { label: 'Designation', value: visit.designation },
                          ].filter(f => f.value).map(f => (
                            <div key={f.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px' }}>
                              <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>{f.value}</p>
                            </div>
                          ))}

                          {visit.notes && (
                            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', gridColumn: '1/-1' }}>
                              <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</p>
                              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{visit.notes}</p>
                            </div>
                          )}

                          {visit.location?.address && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px', gridColumn: '1/-1' }}>
                              <p style={{ margin: 0, fontSize: 10, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5 }}>📍 Location</p>
                              <p style={{ margin: '4px 0 4px', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{visit.location.address}</p>
                              {visit.location.latitude && (
                                <a href={mapsUrl(visit.location.latitude, visit.location.longitude)} target="_blank" rel="noreferrer"
                                  style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                                  View on Google Maps →
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button onClick={() => openEdit(visit)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '6px 12px', color: '#6366f1', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => { if (window.confirm('Delete?')) deleteMutation.mutate(visit._id); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <MdDelete size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', fontFamily: 'Inter,sans-serif' }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2 }} />
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                    {editVisit ? '✏️ Edit Visit' : '🏫 Log School Visit'}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                    {editVisit ? 'Update the visit details' : 'Fill in the details of your visit'}
                  </p>
                </div>
                <button onClick={closeModal} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
                  <MdClose size={18} />
                </button>
              </div>

              <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Selfie */}
                <div style={{ background: '#F9FAFB', borderRadius: 14, padding: 16, border: '1.5px dashed #E5E7EB' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    📸 Selfie <span style={{ color: '#9CA3AF', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                  </p>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleSelfie} />
                  {selfiePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={selfiePreview} alt="preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                      <button onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}
                        style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MdClose size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', color: '#374151', fontSize: 14, fontFamily: 'inherit', width: '100%' }}>
                      <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MdCameraAlt size={20} color="#fff" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Take or upload a selfie</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>JPG, PNG up to 10MB</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* School name */}
                <Field label="School Name" required>
                  <IconInput icon={<MdSchool size={17} />} value={form.schoolName} onChange={set('schoolName')} placeholder="e.g. Govt. Primary School, Raipur" />
                </Field>

                {/* Two col */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Teacher Name">
                    <IconInput icon={<MdPerson size={17} />} value={form.teacherName} onChange={set('teacherName')} placeholder="Teacher name" />
                  </Field>
                  <Field label="Principal Name">
                    <IconInput icon={<MdPerson size={17} />} value={form.principalName} onChange={set('principalName')} placeholder="Principal name" />
                  </Field>
                  <Field label="Designation">
                    <input style={inp} value={form.designation} onChange={set('designation')} placeholder="e.g. Head Teacher" />
                  </Field>
                  <Field label="Phone Number">
                    <IconInput icon={<MdPhone size={17} />} value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="Contact number" />
                  </Field>
                </div>

                {/* Date */}
                <Field label="Visit Date">
                  <input type="date" style={inp} value={form.visitDate} onChange={set('visitDate')} />
                </Field>

                {/* Location */}
                <Field label="Current Location">
                  {location ? (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Location captured ✓</p>
                        <p style={{ margin: '3px 0 4px', fontSize: 11, color: '#6B7280', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {location.address || `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}`}
                        </p>
                        <a href={mapsUrl(location.latitude, location.longitude)} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                          View on Google Maps →
                        </a>
                      </div>
                      <button onClick={() => setLocation(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, flexShrink: 0 }}>
                        <MdClose size={16} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={getLocation} disabled={locationLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: locationLoading ? '#F9FAFB' : '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', cursor: locationLoading ? 'not-allowed' : 'pointer', color: '#374151', fontSize: 14, fontFamily: 'inherit', width: '100%', transition: 'all 0.2s' }}>
                      <div style={{ width: 36, height: 36, background: locationLoading ? '#E5E7EB' : 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {locationLoading
                          ? <div style={{ width: 16, height: 16, border: '2px solid #9CA3AF', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          : <MdLocationOn size={20} color="#fff" />
                        }
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{locationLoading ? 'Getting location...' : 'Capture current location'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{locationLoading ? 'Please wait' : 'Uses GPS to record school location'}</p>
                      </div>
                    </button>
                  )}
                  {locationError && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444' }}>⚠️ {locationError}</p>}
                </Field>

                {/* Outcome */}
                <Field label="Outcome">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {OUTCOMES.map(o => (
                      <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, outcome: o.value }))}
                        style={{ padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: form.outcome === o.value ? o.bg : '#fff', color: form.outcome === o.value ? o.color : '#9CA3AF', border: `1.5px solid ${form.outcome === o.value ? o.border : '#E5E7EB'}` }}>
                        {o.emoji} {o.label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Notes */}
                <Field label="Notes">
                  <textarea value={form.notes} onChange={set('notes')} placeholder="What was discussed? Any follow-up needed?" rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
                </Field>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button onClick={closeModal}
                    style={{ flex: 1, background: '#F3F4F6', border: 'none', borderRadius: 12, padding: '13px 0', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                    style={{ flex: 2, background: (createMutation.isPending || updateMutation.isPending) ? '#A5B4FC' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, padding: '13px 0', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                    {(createMutation.isPending || updateMutation.isPending)
                      ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving...</>
                      : <><MdCheckCircle size={18} /> {editVisit ? 'Update Visit' : 'Save Visit'}</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}