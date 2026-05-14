import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdDelete, MdUpload, MdBook } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';

export default function ManageBooks() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', categoryId: '' });
  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

 const { data, isLoading } = useQuery({
    queryKey: ['books', 'all'],
    queryFn: () => api.get('/books').then(r => r.data),
    refetchInterval: 3000
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.categories)
  });

  // Flatten category tree for select dropdown
  const flattenCats = (cats, prefix = '') =>
    Array.isArray(cats) ? cats.flatMap(c => [
      { _id: c._id, name: prefix + c.name },
      ...flattenCats(c.children || [], prefix + c.name + ' › ')
    ]) : [];
  const flatCats = flattenCats(catData?.categories || catData || []);

  const uploadMutation = useMutation({
    mutationFn: (fd) => api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
    onSuccess: () => { qc.invalidateQueries(['books']); toast.success('Book uploaded! Processing pages...'); closeModal(); },
    onError: () => {}
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/books/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['books']); toast.success('Book updated'); closeModal(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: () => { qc.invalidateQueries(['books']); toast.success('Book deleted'); }
  });

const closeModal = () => { setModalOpen(false); setEditBook(null); setForm({ title: '', description: '', categoryId: '' }); setFile(null); setCoverFile(null); };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({ title: book.title, description: book.description || '', categoryId: book.categoryId?._id || '' });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.categoryId) return toast.error('Title and category are required');
    if (!editBook) {
      if (!file) return toast.error('Please select a PDF file');
      const fd = new FormData();
      fd.append('pdf', file);
       if (coverFile) fd.append('cover', coverFile);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('categoryId', form.categoryId);
      uploadMutation.mutate(fd);
    } else {
      updateMutation.mutate({ id: editBook._id, data: form });
    }
  };

  const statusColors = { done: 'bg-green-100 text-green-700', processing: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700', pending: 'bg-gray-100 text-gray-600' };

  if (isLoading) return <Loader text="Loading books..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Books</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total books</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<MdAdd size={20} />}>Upload Book</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.books?.map(book => (
          <Card key={book._id} className="overflow-hidden">
            <div className="aspect-[3/2] bg-gradient-to-br from-indigo-50 to-blue-50 relative">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><MdBook size={40} className="text-indigo-200" /></div>
              )}
              <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-lg ${statusColors[book.processingStatus]}`}>
                {book.processingStatus}
              </span>
            </div>
            <div className="p-4">
              <p className="font-semibold text-gray-800 line-clamp-1">{book.title}</p>
              <p className="text-xs text-gray-400 mt-1">{book.categoryId?.name} · {book.totalPages} pages</p>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" icon={<MdEdit size={16} />} onClick={() => openEdit(book)}>Edit</Button>
                <Button variant="danger" size="sm" icon={<MdDelete size={16} />}
                  loading={deleteMutation.isPending}
                  onClick={() => { if (window.confirm('Delete this book?')) deleteMutation.mutate(book._id); }}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editBook ? 'Edit Book' : 'Upload New Book'}>
        <div className="flex flex-col gap-4">
          <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Book title" />
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description (optional)" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Category *</label>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select category</option>
              {flatCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {!editBook && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">PDF File *</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-indigo-400 transition-colors">
                  <MdUpload size={32} className="text-gray-300 mb-2" />
                  <span className="text-sm text-gray-500">{file ? file.name : 'Click to select PDF (max 100MB)'}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Cover Image <span className="text-gray-400 font-normal">(optional — auto-generated if not uploaded)</span></label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-400 transition-colors">
                  <MdUpload size={24} className="text-gray-300 mb-1" />
                  <span className="text-sm text-gray-500">{coverFile ? coverFile.name : 'Click to select image (JPG, PNG)'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files[0])} />
                </label>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={uploadMutation.isPending || updateMutation.isPending}>
              {editBook ? 'Save Changes' : 'Upload Book'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
