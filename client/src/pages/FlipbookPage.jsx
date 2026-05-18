import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import { MdArrowBack, MdArrowForward, MdFullscreen, MdFullscreenExit, MdArrowBackIos } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const isMobile = () => window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);

// Each page is a pre-rendered canvas image
const BookPage = forwardRef(({ imgSrc, width, height, pageNum }, ref) => (
  <div ref={ref} style={{
    width, height,
    background: '#fff',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    {imgSrc
      ? <img src={imgSrc} alt={`Page ${pageNum}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      : <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 13 }}>Loading...</div>
    }
  </div>
));

export default function FlipbookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const flipBook = useRef(null);
  const audioCtx = useRef(null);
  const mobile = isMobile();

  const [pages, setPages] = useState([]); // array of image data URLs
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(mobile ? 1 : 0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [status, setStatus] = useState('Loading PDF...');

  const touchStart = useRef(null);

  const { data: book } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then(r => r.data.book)
  });

  const { data: pagesData } = useQuery({
    queryKey: ['bookPages', id],
    queryFn: () => api.get(`/books/${id}/pages`).then(r => r.data)
  });

  // Pre-render all PDF pages to images
  useEffect(() => {
    if (!pagesData?.pdfUrl) return;

    const renderAll = async () => {
      try {
        setStatus('Loading PDF...');
        const pdf = await pdfjsLib.getDocument({ url: pagesData.pdfUrl, cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/', cMapPacked: true }).promise;
        const total = pdf.numPages;
        setTotalPages(total);
        setPages(new Array(total).fill(null));
        setStatus(`Preparing pages...`);

        // Render pages in batches of 3 for smooth progressive loading
        const batchSize = 3;
        const scale = mobile ? 1.2 : 1.5;

        for (let i = 0; i < total; i += batchSize) {
          const batch = [];
          for (let j = i; j < Math.min(i + batchSize, total); j++) {
            batch.push((async (pageNum) => {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              await page.render({ canvasContext: ctx, viewport }).promise;
              const imgSrc = canvas.toDataURL('image/jpeg', 0.85);
              setPages(prev => {
                const updated = [...prev];
                updated[pageNum - 1] = imgSrc;
                return updated;
              });
              setLoadedCount(prev => prev + 1);
            })(j + 1));
          }
          await Promise.all(batch);
        }
        setStatus('');
      } catch (e) {
        setStatus('Failed to load PDF');
        console.error(e);
      }
    };

    renderAll();
  }, [pagesData?.pdfUrl, mobile]);

  // Audio unlock
  useEffect(() => {
    const unlock = async () => {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      await audioCtx.current.resume();
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }, []);

  const playFlipSound = useCallback(async () => {
    if (mobile) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      if (ctx.state !== 'running') await ctx.resume();

      const duration = 0.18;
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(1, sr * duration, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / d.length;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5) * 0.6;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2000;
      bp.Q.value = 1.2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + duration);
    } catch {}
  }, [mobile]);

  const goNext = useCallback(() => {
    if (mobile) setCurrentPage(p => Math.min(totalPages, p + 1));
    else { playFlipSound(); flipBook.current?.pageFlip()?.flipNext(); }
  }, [mobile, totalPages, playFlipSound]);

  const goPrev = useCallback(() => {
    if (mobile) setCurrentPage(p => Math.max(1, p - 1));
    else { playFlipSound(); flipBook.current?.pageFlip()?.flipPrev(); }
  }, [mobile, playFlipSound]);

  const toggleFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(p => !p);
  };

  // Touch swipe for mobile
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    touchStart.current = null;
  };

  const pageW = mobile ? window.innerWidth - 24 : Math.min(420, (window.innerWidth - 100) / 2);
  const pageH = Math.round(pageW * 1.414);

  const readyToShow = loadedCount >= Math.min(3, totalPages);

  return (
    <div
      className="flex flex-col min-h-screen select-none overflow-hidden"
      style={{ background: '#1a1a2e' }}
      onClick={() => setShowControls(p => !p)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(15,15,30,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white hover:text-indigo-300 transition-colors">
              <MdArrowBackIos size={18} />
              <span className="text-sm font-medium hidden sm:block truncate max-w-[200px]">{book?.title}</span>
            </button>

            <div className="flex flex-col items-center">
              <span className="text-white text-sm font-semibold">{book?.title?.substring(0, 20)}{book?.title?.length > 20 ? '...' : ''}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {mobile ? currentPage : currentPage + 1} / {totalPages}
                {loadedCount < totalPages && ` · Loading ${loadedCount}/${totalPages}`}
              </span>
            </div>

            <button onClick={toggleFullscreen} className="text-white hover:text-indigo-300 p-1 transition-colors">
              {isFullscreen ? <MdFullscreenExit size={22} /> : <MdFullscreen size={22} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {!readyToShow && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4" style={{ marginTop: 64 }}>
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">{status}</p>
          {totalPages > 0 && (
            <div className="w-48 h-1.5 bg-white bg-opacity-10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                animate={{ width: `${(loadedCount / totalPages) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile — slide animation */}
      {mobile && readyToShow && (
        <div className="flex items-center justify-center" style={{ marginTop: 70, marginBottom: 80, minHeight: 'calc(100vh - 150px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 60, rotateY: 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -60, rotateY: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                background: '#fff',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                width: pageW,
                minHeight: pageH
              }}
            >
              {pages[currentPage - 1]
                ? <img src={pages[currentPage - 1]} alt={`Page ${currentPage}`} style={{ width: '100%', display: 'block' }} />
                : <div style={{ width: pageW, height: pageH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="w-8 h-8 border-4 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                  </div>
              }
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Desktop — flipbook */}
      {!mobile && readyToShow && (
        <div className="flex items-center justify-center" style={{ marginTop: 72, marginBottom: 88, perspective: 2000 }}>
          <HTMLFlipBook
            ref={flipBook}
            width={pageW}
            height={pageH}
            size="fixed"
            showCover={true}
            mobileScrollSupport={false}
            onFlip={e => { setCurrentPage(e.data + 1); playFlipSound(); }}
            drawShadow={true}
            flippingTime={650}
            usePortrait={false}
            autoSize={false}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            maxShadowOpacity={0.5}
            style={{ filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.7))' }}
          >
            {pages.map((imgSrc, i) => (
              <BookPage key={i} imgSrc={imgSrc} pageNum={i + 1} width={pageW} height={pageH} />
            ))}
          </HTMLFlipBook>
        </div>
      )}

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 py-3 px-4 flex items-center gap-3"
            style={{ background: 'rgba(15,15,30,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={goPrev}
              disabled={mobile ? currentPage <= 1 : currentPage <= 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-25"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', minWidth: 80 }}>
              <MdArrowBack size={17} /> Prev
            </button>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.35)', minWidth: 14 }}>1</span>
              <input
                type="range" min={1} max={totalPages || 1}
                value={mobile ? currentPage : currentPage + 1}
                onChange={e => {
                  const pg = Number(e.target.value);
                  if (mobile) { setCurrentPage(pg); }
                  else { flipBook.current?.pageFlip()?.turnToPage(pg - 1); setCurrentPage(pg); playFlipSound(); }
                }}
                className="flex-1 accent-indigo-500"
                style={{ cursor: 'pointer' }}
              />
              <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.35)', minWidth: 28 }}>{totalPages}</span>
            </div>

            <button onClick={goNext}
              disabled={mobile ? currentPage >= totalPages : currentPage >= totalPages - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-25"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', minWidth: 80, justifyContent: 'center' }}>
              Next <MdArrowForward size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}