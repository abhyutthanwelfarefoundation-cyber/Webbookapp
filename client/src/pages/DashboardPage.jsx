import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdFolder, MdChevronRight, MdHome, MdSearch, MdMenuBook } from 'react-icons/md';
import { motion } from 'framer-motion';
import api from '../services/api';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import Input from '../components/common/Input';
import BookCard from '../components/agent/BookCard';

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [search, setSearch] = useState('');

const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    staleTime: 0,
    refetchOnWindowFocus: true
  });

 const { data: bookData, isLoading: bookLoading } = useQuery({
    queryKey: ['books', selectedCategory, search],
    queryFn: () => api.get('/books', {
      params: { categoryId: selectedCategory || undefined, search: search || undefined }
    }).then(r => r.data),
    enabled: !!selectedCategory || !!search,
    staleTime: 0,
    refetchOnWindowFocus: true
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
        <button onClick={() => handleBreadcrumb(-1)}
          className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
          <MdHome size={18} /> Home
        </button>
        {breadcrumb.map((cat, i) => (
          <span key={cat._id} className="flex items-center gap-1.5">
            <MdChevronRight size={16} className="text-gray-300" />
            <button onClick={() => handleBreadcrumb(i)}
              className={`font-medium transition-colors ${i === breadcrumb.length - 1 ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
              {cat.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Search */}
      <div className="mb-8 max-w-md">
        <Input
          placeholder="Search books by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<MdSearch size={18} />}
        />
      </div>

      {/* Sub-categories */}
      {currentChildren.length > 0 && !search && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {currentChildren.map((cat, i) => (
              <motion.div key={cat._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <Card hover onClick={() => handleCategoryClick(cat)}
                  className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <MdFolder size={24} className="text-indigo-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 leading-tight">{cat.name}</p>
                  {cat.children?.length > 0 && (
                    <span className="text-xs text-gray-400">{cat.children.length} sub</span>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Books */}
      {(selectedCategory || search) && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Books {bookData?.total ? `(${bookData.total})` : ''}
          </h2>

          {bookLoading ? <Loader text="Loading books..." /> :
            bookData?.books?.length === 0 ? (
              <div className="text-center py-20">
                <MdMenuBook size={56} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-medium">No books found</p>
                <p className="text-gray-300 text-sm mt-1">Try a different category or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {bookData?.books?.map((book, i) => (
                  <BookCard key={book._id} book={book} index={i} />
                ))}
              </div>
            )
          }
        </section>
      )}

      {/* Empty home state */}
      {!selectedCategory && !search && currentChildren.length === 0 && (
        <div className="text-center py-20">
          <MdMenuBook size={56} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 font-medium">No categories yet</p>
          <p className="text-gray-300 text-sm mt-1">Ask your admin to add categories and books</p>
        </div>
      )}
    </div>
  );
}