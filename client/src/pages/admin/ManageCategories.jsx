import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdDelete, MdFolder } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';

const CategoryRow = ({ cat, depth, flat, onEdit, onDelete, deleting }) => (
  <>
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
          <MdFolder size={18} className="text-indigo-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-800">{cat.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {flat.find(c => c._id === String(cat.parentId))?.name || '— Root'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{cat.children?.length || 0} sub-categories</td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<MdEdit size={15} />} onClick={() => onEdit(cat)}>Edit</Button>
          <Button variant="danger" size="sm" icon={<MdDelete size={15} />} loading={deleting}
            onClick={() => { if (window.confirm('Delete category?')) onDelete(cat._id); }}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
    {(cat.children || []).map(child => (
      <CategoryRow key={child._id} cat={child} depth={depth + 1} flat={flat} onEdit={onEdit} onDelete={onDelete} deleting={deleting} />
    ))}
  </>
);

export default function ManageCategories() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', parentId: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  });

  const categories = Array.isArray(rawData) ? rawData : (rawData?.categories || []);

  const flatCats = (cats, prefix = '') =>
    Array.isArray(cats) ? cats.flatMap(c => [
      { _id: String(c._id), name: prefix + c.name },
      ...flatCats(c.children || [], prefix + c.name + ' › ')
    ]) : [];

  const flat = flatCats(categories);

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category created'); closeModal(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category updated'); closeModal(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category deleted'); }
  });

 const closeModal = () => {
    setModalOpen(false); setEditCat(null);
    setForm({ name: '', parentId: '' });
    setCoverFile(null); setCoverPreview(null);
  };

 const openEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name, parentId: String(cat.parentId || '') });
    setCoverPreview(cat.coverUrl || null);
    setCoverFile(null);
    setModalOpen(true);
  };
  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Category name is required');
    const fd = new FormData();
    fd.append('name', form.name);
    if (form.parentId) fd.append('parentId', form.parentId);
    if (coverFile) fd.append('cover', coverFile);
    if (editCat) updateMutation.mutate({ id: editCat._id, data: fd });
    else createMutation.mutate(fd);
  };

  if (isLoading) return <Loader text="Loading categories..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Organise your book catalog</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<MdAdd size={20} />}>Add Category</Button>
      </div>

     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Parent', 'Children', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map(cat => (
              <CategoryRow key={cat._id} cat={cat} depth={0} flat={flat}
                onEdit={openEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                deleting={deleteMutation.isPending} />
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="text-center py-12 text-gray-400 text-sm">No categories yet. Create one to get started.</p>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editCat ? 'Edit Category' : 'New Category'}>
        <div className="flex flex-col gap-4">
          <Input label="Category Name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Primary School Books" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Parent Category (optional)</label>
            <select value={form.parentId}
              onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Root (no parent)</option>
              {flat.filter(c => !editCat || c._id !== String(editCat._id)).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          {/* Cover image upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Cover Image <span className="text-gray-400 font-normal">(optional — shows on catalog)</span>
            </label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', border: '2px dashed #E5E7EB',
              borderRadius: 12, padding: 16, cursor: 'pointer',
              background: '#FAFAFA', transition: 'border-color 0.2s',
              position: 'relative', overflow: 'hidden',
              minHeight: coverPreview ? 140 : 90
            }}>
              {coverPreview ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img
                    src={coverPreview}
                    alt="cover preview"
                    style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Click to change</span>
                  </div>
                </div>
              ) : (
                <>
                  <MdFolder size={28} style={{ color: '#9CA3AF', marginBottom: 6 }} />
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>Click to upload cover image</span>
                  <span style={{ fontSize: 11, color: '#D1D5DB', marginTop: 3 }}>JPG, PNG up to 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setCoverFile(file);
                  const reader = new FileReader();
                  reader.onload = ev => setCoverPreview(ev.target.result);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {coverFile && (
              <button
                type="button"
                onClick={() => { setCoverFile(null); setCoverPreview(editCat?.coverUrl || null); }}
                style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                ✕ Remove new image
              </button>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editCat ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}