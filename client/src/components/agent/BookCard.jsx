import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { MdMenuBook } from 'react-icons/md';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const SUPABASE_URL = 'https://adoiilauzxxffnwlnono.supabase.co/storage/v1/object/public/digital-books';

export default function BookCard({ book, index }) {
  const navigate = useNavigate();
  const [coverError, setCoverError] = useState(false);
  const [coverReady, setCoverReady] = useState(false);

  const pdfUrl = book.pdfKey ? `${SUPABASE_URL}/${book.pdfKey}` : null;
  const canShowCover = pdfUrl && !coverError && book.processingStatus === 'done';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/book/${book._id}`)}
      className="cursor-pointer group"
    >
      {/* Cover container */}
      <div className="relative rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-indigo-50 to-blue-100"
        style={{ aspectRatio: '3/4' }}>

        {/* Placeholder icon always visible until cover loads */}
        {!coverReady && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
            <MdMenuBook size={40} className="text-indigo-300" />
            {book.processingStatus === 'processing' && (
              <span className="text-xs text-indigo-400 animate-pulse font-medium">Processing...</span>
            )}
            {book.processingStatus === 'pending' && (
              <span className="text-xs text-gray-400 animate-pulse font-medium">Uploading...</span>
            )}
          </div>
        )}

       {/* PDF cover */}
        {canShowCover && (
          <div
            className="absolute inset-0 overflow-hidden flex items-start justify-center"
            style={{ opacity: coverReady ? 1 : 0, transition: 'opacity 0.4s' }}
          >
            <Document
              file={{ url: pdfUrl }}
              loading=""
              error=""
              onLoadError={() => setCoverError(true)}
            >
              <Page
                pageNumber={1}
                width={220}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={() => setCoverReady(true)}
                onRenderError={() => setCoverError(true)}
              />
            </Document>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-indigo-600 bg-opacity-0 group-hover:bg-opacity-25 transition-all duration-300 flex items-center justify-center">
          <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-indigo-600 px-4 py-2 rounded-xl shadow-lg">
            Open Book
          </span>
        </div>

        {/* Status badge — only show non-done */}
        {book.processingStatus !== 'done' && (
          <div className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-lg ${
            book.processingStatus === 'processing' ? 'bg-amber-100 text-amber-700' :
            book.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {book.processingStatus}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {book.title}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {book.categoryId?.name} · {book.totalPages || '—'} pages
        </p>
      </div>
    </motion.div>
  );
}