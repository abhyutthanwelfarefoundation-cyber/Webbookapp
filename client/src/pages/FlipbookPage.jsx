import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import { MdArrowBack, MdArrowForward, MdFullscreen, MdFullscreenExit, MdArrowBackIos } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const BookPage = forwardRef(({ imgSrc, width, height, pageNum }, ref) => (
  <div ref={ref} style={{
    width, height, background: '#fff', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    {imgSrc
      ? <img src={imgSrc} alt={`Page ${pageNum}`} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} draggable={false} />
      : <div style={{ width: '100%', height: '100%', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: '3px solid #e0e0e0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    }
  </div>
));

export default function FlipbookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const flipBook = useRef(null);
  const audioCtx = useRef(null);

  const [pages, setPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [status, setStatus] = useState('Loading PDF...');
  const [ready, setReady] = useState(false);

  const { data: book } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then(r => r.data.book)
  });

  const { data: pagesData } = useQuery({
    queryKey: ['bookPages', id],
    queryFn: () => api.get(`/books/${id}/pages`).then(r => r.data)
  });

  // Pre-render all pages to images
  useEffect(() => {
    if (!pagesData?.pdfUrl) return;
    const render = async () => {
      try {
        setStatus('Loading PDF...');
        const pdf = await pdfjsLib.getDocument({
          url: pagesData.pdfUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
          cMapPacked: true
        }).promise;

        const total = pdf.numPages;
        setTotalPages(total);
        setPages(new Array(total).fill(null));
        setStatus('Preparing pages...');

        // Render 2 pages at a time
        for (let i = 0; i < total; i += 2) {
          const batch = [];
          for (let j = i; j < Math.min(i + 2, total); j++) {
            batch.push((async (num) => {
              const page = await pdf.getPage(num);
              const scale = window.devicePixelRatio > 1 ? 1.8 : 1.5;
              const viewport = page.getViewport({ scale });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              const src = canvas.toDataURL('image/jpeg', 0.88);
              setPages(prev => { const u = [...prev]; u[num - 1] = src; return u; });
              setLoadedCount(c => c + 1);
            })(j + 1));
          }
          await Promise.all(batch);
          // Show flipbook after first 2 pages ready
          if (i === 0) setReady(true);
        }
        setStatus('');
      } catch (e) {
        setStatus('Failed to load. Please go back and try again.');
      }
    };
    render();
  }, [pagesData?.pdfUrl]);

  // Unlock audio on first touch/click
  useEffect(() => {
    const unlock = async () => {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      await audioCtx.current.resume();
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }, []);

  const playFlipSound = useCallback(async () => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      if (ctx.state !== 'running') await ctx.resume();
      const duration = 0.18;
      const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5) * 0.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const goNext = useCallback(() => {
    playFlipSound();
    flipBook.current?.pageFlip()?.flipNext();
  }, [playFlipSound]);

  const goPrev = useCallback(() => {
    playFlipSound();
    flipBook.current?.pageFlip()?.flipPrev();
  }, [playFlipSound]);

  const toggleFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(p => !p);
  };

  // Responsive page size
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const isPortrait = sw < 768;

  // On portrait mobile — single page fills screen
  // On landscape/tablet/desktop — double page
  const pageW = isPortrait
    ? sw - 16
    : Math.min(420, (sw - 80) / 2);
  const pageH = isPortrait
    ? Math.round(Math.min(sh - 150, pageW * 1.414))
    : Math.round(pageW * 1.414);

  return (
    <div
      className="flex flex-col min-h-screen select-none overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0f1e 0%, #1a1a35 50%, #0f0f1e 100%)' }}
      onClick={() => setShowControls(p => !p)}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .stf__parent { touch-action: none !important; }
      `}</style>

      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 flex items-center justify-between"
            style={{ height: 52, background: 'rgba(10,10,25,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white hover:text-indigo-300 transition-colors">
              <MdArrowBackIos size={17} />
              <span className="text-sm font-medium sm:block hidden truncate max-w-[160px]">{book?.title}</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-white text-xs font-semibold truncate max-w-[160px]">{book?.title}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {currentPage + 1} / {totalPages}
                {loadedCount < totalPages && ` · ${Math.round((loadedCount / totalPages) * 100)}%`}
              </span>
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-indigo-300 transition-colors p-1">
              {isFullscreen ? <MdFullscreenExit size={21} /> : <MdFullscreen size={21} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading screen */}
      {!ready && (
        <div className="flex flex-col items-center justify-center flex-1 gap-5">
          <div style={{ width: 52, height: 52, border: '4px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <div className="flex flex-col items-center gap-2">
            <p className="text-white text-sm font-medium">{status}</p>
            {totalPages > 0 && (
              <div style={{ width: 180, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius: 4 }}
                  animate={{ width: `${(loadedCount / totalPages) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
            {totalPages > 0 && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{loadedCount} of {totalPages} pages</p>
            )}
          </div>
        </div>
      )}

      {/* Flipbook — works on ALL devices */}
      {ready && (
        <div
          className="flex items-center justify-center"
          style={{ marginTop: 58, marginBottom: 72, minHeight: `calc(100vh - 130px)` }}
        >
          <HTMLFlipBook
            ref={flipBook}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={200}
            maxWidth={520}
            minHeight={280}
            maxHeight={800}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={e => { setCurrentPage(e.data); playFlipSound(); }}
            drawShadow={true}
            flippingTime={isPortrait ? 500 : 650}
            usePortrait={isPortrait}
            autoSize={false}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={isPortrait ? 20 : 30}
            showPageCorners={true}
            maxShadowOpacity={0.45}
            style={{
              filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.75))',
            }}
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
            initial={{ y: 72 }} animate={{ y: 0 }} exit={{ y: 72 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4"
            style={{ height: 64, background: 'rgba(10,10,25,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={goPrev} disabled={currentPage === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-25"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', minWidth: 76, justifyContent: 'center' }}>
              <MdArrowBack size={16} /> Prev
            </button>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.3)', minWidth: 12 }}>1</span>
              <input
                type="range" min={0} max={Math.max(0, totalPages - 1)}
                value={currentPage}
                onChange={e => {
                  const pg = Number(e.target.value);
                  flipBook.current?.pageFlip()?.turnToPage(pg);
                  setCurrentPage(pg);
                  playFlipSound();
                }}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.3)', minWidth: 24 }}>{totalPages}</span>
            </div>

            <button onClick={goNext} disabled={currentPage >= totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-25"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', minWidth: 76, justifyContent: 'center' }}>
              Next <MdArrowForward size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}