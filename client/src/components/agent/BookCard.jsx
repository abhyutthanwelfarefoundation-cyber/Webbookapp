import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
const isMobileView = window.innerWidth < 640;

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const SUPABASE_URL = 'https://adoiilauzxxffnwlnono.supabase.co/storage/v1/object/public/digital-books';

const GRADIENTS = [
  ['#1e3a5f','#2563eb'],['#3b1f5e','#7c3aed'],['#064e3b','#10b981'],
  ['#7f1d1d','#ef4444'],['#78350f','#f59e0b'],['#1e1b4b','#6366f1'],
  ['#831843','#ec4899'],['#134e4a','#14b8a6'],
];

// Special logo cover for Navbodh and Gyanbodh
function LogoCover({ name }) {
  const isNav = name?.toLowerCase().includes('navbodh');
  return (
    <div style={{
      width: '100%', height: '100%',
      background: isNav
        ? 'linear-gradient(160deg,#1e3a5f 0%,#1d4ed8 50%,#1e40af 100%)'
        : 'linear-gradient(160deg,#3b1f5e 0%,#7c3aed 50%,#5b21b6 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 12, gap: 8, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
        backgroundSize: '8px 8px'
      }} />

      {/* Logo circle */}
      <div style={{
        width: 56, height: 56,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, position: 'relative', zIndex: 1
      }}>
        {isNav ? '📘' : '✨'}
      </div>

      {/* Brand name */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 28, height: 1.5, background: 'rgba(255,255,255,0.4)', margin: '0 auto 6px' }} />
        <p style={{
          margin: 0, color: '#fff',
          fontSize: 13, fontWeight: 800,
          letterSpacing: 2, textTransform: 'uppercase'
        }}>
          {isNav ? 'NAVBODH' : 'GYANBODH'}
        </p>
        <p style={{
          margin: '3px 0 0', color: 'rgba(255,255,255,0.55)',
          fontSize: 8, letterSpacing: 2, textTransform: 'uppercase'
        }}>
          PRAKASHAN
        </p>
        <div style={{ width: 28, height: 1.5, background: 'rgba(255,255,255,0.4)', margin: '6px auto 0' }} />
      </div>
    </div>
  );
}

export default function BookCard({ book, index }) {
  const navigate = useNavigate();
  const [coverError, setCoverError] = useState(false);
  const [coverReady, setCoverReady] = useState(false);
  const [hovered, setHovered] = useState(false);

  const pdfUrl = book.pdfKey ? `${SUPABASE_URL}/${book.pdfKey}` : null;
  const canShowPdf = pdfUrl && !coverError && book.processingStatus === 'done';

  const isNav = book.title?.toLowerCase().includes('navbodh');
  const isGyan = book.title?.toLowerCase().includes('gyanbodh');
  const isLogoCover = isNav || isGyan;

  const gradIdx = (book.title?.charCodeAt(0) || 0) % GRADIENTS.length;
  const [c1, c2] = GRADIENTS[gradIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => book.processingStatus === 'done' && navigate(`/book/${book._id}`)}
      style={{ cursor: book.processingStatus === 'done' ? 'pointer' : 'default' }}
    >
      {/* Book with spine effect */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <motion.div
          animate={{
            rotateY: hovered ? -6 : 0,
            translateX: hovered ? 3 : 0,
            boxShadow: hovered
              ? '8px 16px 40px rgba(0,0,0,0.3),-2px 0 8px rgba(0,0,0,0.15)'
              : '3px 6px 16px rgba(0,0,0,0.18),-1px 0 3px rgba(0,0,0,0.08)'
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            aspectRatio: '3/4',
            borderRadius: '2px 8px 8px 2px',
            overflow: 'hidden',
            position: 'relative',
            transformOrigin: 'left center',
          }}
        >
          {/* Spine shadow */}
          <div style={{
            position: 'absolute', left: 0, top: 0,
            width: 12, height: '100%',
            background: 'linear-gradient(90deg,rgba(0,0,0,0.35),rgba(0,0,0,0.1),transparent)',
            zIndex: 5, pointerEvents: 'none'
          }} />
          {/* Spine highlight */}
          <div style={{
            position: 'absolute', left: 12, top: 0,
            width: 1, height: '100%',
            background: 'rgba(255,255,255,0.18)',
            zIndex: 5, pointerEvents: 'none'
          }} />

          {/* LOGO COVER for Navbodh/Gyanbodh */}
          {isLogoCover && <LogoCover name={book.title} />}

          {/* PDF COVER for real books */}
          {!isLogoCover && (
            <>
              {/* Gradient fallback — always shown until PDF loads */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(160deg,${c1} 0%,${c2} 55%,${c1} 100%)`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 12, gap: 6,
                opacity: coverReady ? 0 : 1,
                transition: 'opacity 0.4s'
              }}>
                <span style={{ fontSize: 24, opacity: 0.6 }}>📖</span>
                <p style={{
                  margin: 0, color: 'rgba(255,255,255,0.9)',
                  fontSize: 10, fontWeight: 600, textAlign: 'center',
                  lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {book.title}
                </p>
                {book.processingStatus !== 'done' && (
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', animation: 'blink 1.5s infinite' }}>
                    {book.processingStatus}...
                  </span>
                )}
              </div>

              {/* PDF first page */}
              {canShowPdf && (
                <div style={{
                  position: 'absolute', inset: 0,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                  opacity: coverReady ? 1 : 0,
                  transition: 'opacity 0.4s'
                }}>
                  <Document
                    file={{ url: pdfUrl }}
                    loading="" error=""
                    onLoadError={() => setCoverError(true)}
                  >
                    <Page
                        pageNumber={1}
                        width={isMobileView ? 140 : 220}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onRenderSuccess={() => setCoverReady(true)}
                      onRenderError={() => setCoverError(true)}
                    />
                  </Document>
                </div>
              )}
            </>
          )}

          {/* Hover overlay */}
          <motion.div
            animate={{ opacity: hovered && book.processingStatus === 'done' ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 6,
              background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: 10, pointerEvents: 'none'
            }}
          >
            <span style={{
              background: '#fff', color: '#1e1b4b',
              fontSize: 10, fontWeight: 700,
              padding: '4px 12px', borderRadius: 20,    
              letterSpacing: 0.5, textTransform: 'uppercase'
            }}>
              Open →
            </span>
          </motion.div>

          {/* Status badge */}
          {book.processingStatus !== 'done' && (
            <div style={{
              position: 'absolute', top: 6, right: 6, zIndex: 7,
              background: book.processingStatus === 'processing'
                ? 'rgba(245,158,11,0.92)' : 'rgba(239,68,68,0.92)',
              color: '#fff', fontSize: 8, fontWeight: 700,
              padding: '2px 6px', borderRadius: 5,
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>
              {book.processingStatus}
            </div>
          )}
        </motion.div>

        {/* Page edge effect */}
        <div style={{ position: 'absolute', right: -3, top: 3, bottom: 3, width: 5, background: 'linear-gradient(90deg,#e2e8f0,#f8fafc)', borderRadius: '0 2px 2px 0', zIndex: -1 }} />
        <div style={{ position: 'absolute', right: -5, top: 5, bottom: 5, width: 4, background: 'linear-gradient(90deg,#cbd5e1,#e2e8f0)', borderRadius: '0 2px 2px 0', zIndex: -2 }} />
        <div style={{ position: 'absolute', right: -7, top: 7, bottom: 7, width: 3, background: '#e2e8f0', borderRadius: '0 2px 2px 0', zIndex: -3 }} />
      </div>

      {/* Info */}
      <div>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 600, color: '#1F2937',
          lineHeight: 1.35, marginBottom: 2,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {book.title}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
          {book.totalPages ? `${book.totalPages} pages` : '—'}
        </p>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
    </motion.div>
  );
}