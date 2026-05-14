import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlineFolder, HiOutlineChevronRight, HiOutlineChevronLeft, HiOutlineBookOpen } from 'react-icons/hi';
import Layout from '../components/common/Layout';
import api from '../services/api';

const COLORS = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];

export default function CategoryPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const { data: category } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data.find(c => c._id === id);
    }
  });

  const { data: children, isLoading } = useQuery({
    queryKey: ['children', id],
    queryFn: async () => {
      const res = await api.get(`/categories/${id}/children`);
      return res.data.data;
    }
  });

  const { data: books } = useQuery({
    queryKey: ['books', id],
    queryFn: async () => {
      const res = await api.get(`/books?categoryId=${id}`);
      return res.data.data;
    }
  });

  const hasChildren = children?.length > 0;
  const hasBooks    = books?.length > 0;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
        <HiOutlineChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{category?.name || 'Loading...'}</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
          <HiOutlineChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{category?.name}</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* Sub-categories */}
          {hasChildren && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sub-categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {children.map((cat, i) => (
                  <motion.button key={cat._id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/category/${cat._id}`)}
                    className="card p-4 text-left hover:shadow-md active:scale-[0.98] transition-all group">
                    <div className={`w-9 h-9 ${COLORS[i % COLORS.length]} rounded-xl flex items-center justify-center mb-3`}>
                      <HiOutlineFolder className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-medium text-gray-900 text-sm leading-tight">{cat.name}</p>
                    <HiOutlineChevronRight className="w-4 h-4 text-gray-400 mt-2 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Books in this category */}
          {hasBooks && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Books</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {books.map((book, i) => (
                  <motion.button key={book._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/book/${book._id}/read`)}
                    className="card overflow-hidden text-left hover:shadow-md active:scale-[0.98] transition-all group">
                    {/* Cover */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title}
                          className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlineBookOpen className="w-10 h-10 text-blue-400" />
                        </div>
                      )}
                      {!book.isProcessed && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-full">Processing…</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{book.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{book.totalPages} pages</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {!hasChildren && !hasBooks && (
            <div className="text-center py-16 text-gray-400">
              <HiOutlineFolder className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>This category is empty.</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
