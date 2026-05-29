import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdChevronRight, MdHome, MdSearch, MdMenuBook, MdKeyboardArrowRight } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Loader from '../components/common/Loader';
import BookCard from '../components/agent/BookCard';

const FOLDER_COLORS = [
  { bg: '#eef2ff', icon: '#6366f1' },
  { bg: '#ecfdf5', icon: '#10b981' },
  { bg: '#eff6ff', icon: '#3b82f6' },
  { bg: '#fffbeb', icon: '#f59e0b' },
  { bg: '#fdf2f8', icon: '#ec4899' },
  { bg: '#f0fdf4', icon: '#22c55e' },
];

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    staleTime: 0, refetchOnWindowFocus: true
  });

  const { data: bookData, isLoading: bookLoading } = useQuery({
    queryKey: ['books', selectedCategory, search],
    queryFn: () => api.get('/books', {
      params: { categoryId: selectedCategory || undefined, search: search || undefined }
    }).then(r => r.data),
    enabled: !!selectedCategory || !!search,
    staleTime: 0
  });

  const categories = catData?.categories || [];

  const currentChildren = selectedCategory
    ? findChildren(categories, selectedCategory)
    : categories.filter(c => !c.parentId);

  function findChildren(tree, parentId) {
    const nodes = Array.isArray(tree) ? tree : [];
    for (const node of nodes) {
      if (String(node._id) === String(parentId)) return node.children || [];
      const found = findChildren(node.children || [], parentId);
      if (found.length) return found;
    }
    return [];
  }

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat._id);
    setBreadcrumb(prev => [...prev, cat]);
    setSearch('');
  };

  const handleBreadcrumb = (index) => {
    if (index === -1) { setSelectedCategory(null); setBreadcrumb([]); }
    else {
      const newCrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newCrumb);
      setSelectedCategory(newCrumb[newCrumb.length - 1]._id);
    }
  };

  if (catLoading) return <Loader text="Loading catalog..." />;

  return (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: window.innerWidth < 640 ? '16px 12px' : '24px 20px', fontFamily: 'Inter,sans-serif' }}>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff',
        border: `1.5px solid ${searchFocused ? '#6366f1' : '#E5E7EB'}`,
        borderRadius: 14,
        padding: '11px 16px',
        marginBottom: 20,
        boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.2s'
      }}>
        <MdSearch size={20} color={searchFocused ? '#6366f1' : '#9CA3AF'} />
        <input
          placeholder="Search books by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            border: 'none', outline: 'none', fontSize: 14,
            color: '#1F2937', flex: 1, fontFamily: 'inherit',
            background: 'transparent'
          }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>
            ×
          </button>
        )}
      </div>

     {/* Breadcrumb + Back button */}
      <div style={{ marginBottom: 20 }}>
        {/* Back button — only show when inside a category */}
        {selectedCategory && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              if (breadcrumb.length <= 1) {
                setSelectedCategory(null);
                setBreadcrumb([]);
              } else {
                handleBreadcrumb(breadcrumb.length - 2);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff',
              border: '1.5px solid #E5E7EB',
              borderRadius: 10, padding: '8px 16px',
              cursor: 'pointer', fontFamily: 'inherit',
              color: '#374151', fontSize: 13, fontWeight: 500,
              marginBottom: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s'
            }}
            whileHover={{ borderColor: '#6366f1', color: '#6366f1' }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
            Back to {breadcrumb.length <= 1 ? 'Home' : breadcrumb[breadcrumb.length - 2]?.name}
          </motion.button>
        )}

        {/* Breadcrumb trail */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleBreadcrumb(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none',
              cursor: 'pointer', color: '#9CA3AF',
              fontSize: 13, fontFamily: 'inherit', padding: '2px 4px'
            }}
          >
            <MdHome size={14} /> Home
          </button>
          {breadcrumb.map((cat, i) => (
            <span key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MdKeyboardArrowRight size={16} color="#D1D5DB" />
              <button
                onClick={() => handleBreadcrumb(i)}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, padding: '2px 4px',
                  color: i === breadcrumb.length - 1 ? '#6366f1' : '#9CA3AF',
                  fontWeight: i === breadcrumb.length - 1 ? 600 : 400
                }}
              >
                {cat.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      {/* Categories */}
      <AnimatePresence mode="wait">
        {currentChildren.length > 0 && !search && (
          <motion.section
            key={selectedCategory || 'root'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ marginBottom: 32 }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              Categories
            </p>
           <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 400
                ? 'repeat(2, 1fr)'
                : window.innerWidth < 768
                ? 'repeat(3, 1fr)'
                : 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10
            }}>
            {currentChildren.map((cat, i) => {
                const color = FOLDER_COLORS[i % FOLDER_COLORS.length];
                const isNav = cat.name?.toLowerCase().includes('navbodh');
                const isGyan = cat.name?.toLowerCase().includes('gyanbodh');
                const isRoot = isNav || isGyan;

                return (
                  <motion.div
                    key={cat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
                    onClick={() => handleCategoryClick(cat)}
                    style={{
                      background: '#fff',
                      border: '1px solid #F3F4F6',
                      borderRadius: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                   {/* Cover — uploaded image ALWAYS wins */}
                    <div style={{
                      height: 110,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: cat.coverUrl
                        ? '#f8fafc'
                        : isRoot
                          ? isNav
                            ? 'linear-gradient(160deg,#1e3a5f,#1d4ed8)'
                            : 'linear-gradient(160deg,#3b1f5e,#7c3aed)'
                          : color.bg,
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      {cat.coverUrl ? (
                        <img
                          src={cat.coverUrl}
                          alt={cat.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: 6
                          }}
                        />
                      ) : isRoot ? (
                        <>
                          <span style={{ fontSize: 24 }}>{isNav ? '📘' : '✨'}</span>
                          <p style={{ margin: 0, color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: 1.5 }}>
                            {isNav ? 'NAVBODH' : 'GYANBODH'}
                          </p>
                        </>
                      ) : (
                        <span style={{ fontSize: 32 }}>📁</span>
                      )}
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1F2937' }}>
                        {cat.name}
                      </p>
                      {cat.children?.length > 0 && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                          {cat.children.length} sub-categories
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Books */}
      {(selectedCategory || search) && (
        <section>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
            Books {bookData?.total ? `(${bookData.total})` : ''}
          </p>

          {bookLoading ? <Loader text="Loading books..." /> :
            bookData?.books?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <MdMenuBook size={52} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 12px' }} />
                <p style={{ color: '#9CA3AF', fontWeight: 500, margin: 0 }}>No books found</p>
                <p style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>Try a different category or search term</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 400
                  ? 'repeat(2, 1fr)'
                  : window.innerWidth < 768
                  ? 'repeat(3, 1fr)'
                  : 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: window.innerWidth < 640 ? 12 : 20
              }}>
                {bookData?.books?.map((book, i) => (
                  <BookCard key={book._id} book={book} index={i} />
                ))}
              </div>
            )
          }
        </section>
      )}

      {/* Empty home */}
      {!selectedCategory && !search && currentChildren.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <MdMenuBook size={52} color="#E5E7EB" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: '#9CA3AF', fontWeight: 500, margin: 0 }}>No categories yet</p>
          <p style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>Ask your admin to add categories and books</p>
        </div>
      )}
    </div>
  );
}


