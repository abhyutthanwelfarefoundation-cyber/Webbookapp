import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjsLib from 'pdfjs-dist';
import { MdArrowBack, MdArrowForward, MdFullscreen, MdFullscreenExit, MdArrowBackIos } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Desktop flipbook page
const BookPage = forwardRef(({ imgSrc, width, height, pageNum }, ref) => (
  <div ref={ref} style={{ width, height, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {imgSrc
      ? <img src={imgSrc} alt={`Page ${pageNum}`} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} draggable={false} />
      : <div style={{ width: '100%', height: '100%', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    }
  </div>
));

// Mobile CSS 3D flip card
function MobileFlipPage({ frontSrc, backSrc, width, height, flipping, direction }) {
  return (
    <div style={{ width, height, position: 'relative', perspective: 1200 }}>
      <motion.div
        style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transformOrigin: direction === 'next' ? 'left center' : 'right center',
          borderRadius: 4,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}
        animate={{
          rotateY: flipping
            ? (direction === 'next' ? -180 : 180)
            : 0
        }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden', background: '#fff',
          borderRadius: 4, overflow: 'hidden'
        }}>
          {frontSrc
            ? <img src={frontSrc} style={{ width: '100%', height: '100%', objectFit: 'fill' }} draggable={false} alt="page" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-8 h-8 border-3 border-gray-100 border-t-indigo-400 rounded-full animate-spin" />
              </div>
          }
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden', background: '#fff',
          transform: 'rotateY(180deg)',
          borderRadius: 4, overflow: 'hidden'
        }}>
          {backSrc
            ? <img src={backSrc} style={{ width: '100%', height: '100%', objectFit: 'fill' }} draggable={false} alt="next page" />
            : <div style={{ width: '100%', height: '100%', background: '#f9f9f9' }} />
          }
        </div>
      </motion.div>
    </div>
  );
}

export default function FlipbookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const flipBook = useRef(null);
  const audioCtx = useRef(null);
  const pdfRenderRef = useRef(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [pages, setPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Mobile flip state
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState('next');
  const [displayPage, setDisplayPage] = useState(0);

  const isPortrait = window.innerWidth < 768;

  const { data: book } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then(r => r.data.book)
  });

  const { data: pagesData } = useQuery({
    queryKey: ['bookPages', id],
    queryFn: () => api.get(`/books/${id}/pages`).then(r => r.data)
  });

  // Render PDF pages progressively
  useEffect(() => {
    if (!pagesData?.pdfUrl || pdfRenderRef.current) return;
    pdfRenderRef.current = true;

    const run = async () => {
      try {
        const pdf = await pdfjsLib.getDocument({
          url: pagesData.pdfUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
          cMapPacked: true,
        }).promise;

        const total = pdf.numPages;
        setTotalPages(total);
        setPages(new Array(total).fill(null));

        // Lower scale on mobile = less memory = no crash
        const scale = isPortrait ? 0.9 : 1.4;

        for (let i = 1; i <= total; i++) {
          await new Promise(r => setTimeout(r, 20));
          try {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext('2d', { alpha: false });
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
            const src = canvas.toDataURL('image/jpeg', 0.8);
            canvas.width = 0; canvas.height = 0; // free memory
            setPages(prev => { const u = [...prev]; u[i - 1] = src; return u; });
            setLoadProgress(Math.round((i / total) * 100));
            if (i === 2) setReady(true);
          } catch {}
        }
        if (total === 1) setReady(true);
      } catch (e) { console.error(e); }
    };
    run();
  }, [pagesData?.pdfUrl, isPortrait]);

  // Audio
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
      const dur = 0.15;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * 0.5;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 1.2;
      const g = ctx.createGain(); g.gain.setValueAtTime(1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      src.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + dur);
    } catch {}
  }, []);

  // Mobile flip with CSS 3D
  const mobileFlip = useCallback((dir) => {
    if (flipping) return;
    if (dir === 'next' && displayPage >= totalPages - 1) return;
    if (dir === 'prev' && displayPage <= 0) return;

    playFlipSound();
    setFlipDir(dir);
    setFlipping(true);

    setTimeout(() => {
      setDisplayPage(p => dir === 'next' ? p + 1 : p - 1);
      setCurrentPage(p => dir === 'next' ? p + 1 : p - 1);
      setFlipping(false);
    }, 500);
  }, [flipping, displayPage, totalPages, playFlipSound]);

  // Desktop flip
  const desktopNext = useCallback(() => {
    playFlipSound();
    flipBook.current?.pageFlip()?.flipNext();
  }, [playFlipSound]);

  const desktopPrev = useCallback(() => {
    playFlipSound();
    flipBook.current?.pageFlip()?.flipPrev();
  }, [playFlipSound]);

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 40 && dy < 80) {
      dx > 0 ? mobileFlip('next') : mobileFlip('prev');
    }
    touchStartX.current = null;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(p => !p);
  };

  const pageW = isPortrait ? window.innerWidth - 16 : Math.min(400, (window.innerWidth - 80) / 2);
  const pageH = Math.round(pageW * 1.415);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0d0d1a 0%,#1a1030 50%,#0d0d1a 100%)', userSelect: 'none' }}
      onClick={() => setShowControls(p => !p)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .stf__parent { touch-action: none !important; }
      `}</style>

      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -52 }} animate={{ y: 0 }} exit={{ y: -52 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
            style={{ height: 52, background: 'rgba(8,8,20,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white hover:text-indigo-300 transition-colors">
              <MdArrowBackIos size={17} />
              <span className="text-sm hidden sm:block truncate max-w-[120px]">{book?.title}</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-white text-xs font-semibold truncate max-w-[160px]">{book?.title}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {currentPage + 1} / {totalPages}
                {loadProgress < 100 && ` · ${loadProgress}%`}
              </span>
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-indigo-300 p-1">
              {isFullscreen ? <MdFullscreenExit size={20} /> : <MdFullscreen size={20} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {!ready && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4" style={{ marginTop: 52 }}>
          <div style={{ width: 44, height: 44, border: '4px solid rgba(99,102,241,0.15)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
          <p className="text-white text-sm opacity-80">Preparing book...</p>
          <div style={{ width: 150, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: '#6366f1', borderRadius: 3 }} animate={{ width: `${loadProgress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{loadProgress}%</span>
        </div>
      )}

      {/* Mobile — CSS 3D flip */}
      {ready && isPortrait && (
        <div
          className="flex items-center justify-center"
          style={{ marginTop: 60, marginBottom: 68, minHeight: `calc(100vh - 128px)` }}
        >
          <MobileFlipPage
            frontSrc={pages[displayPage]}
            backSrc={pages[flipDir === 'next' ? displayPage + 1 : displayPage - 1]}
            width={pageW}
            height={pageH}
            flipping={flipping}
            direction={flipDir}
          />
        </div>
      )}

      {/* Desktop — react-pageflip */}
      {ready && !isPortrait && (
        <div className="flex items-center justify-center" style={{ marginTop: 56, marginBottom: 68, perspective: 2000 }}>
          <HTMLFlipBook
            ref={flipBook}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={180} maxWidth={500}
            minHeight={250} maxHeight={750}
            showCover={true}
            mobileScrollSupport={false}
            onFlip={e => { setCurrentPage(e.data); playFlipSound(); }}
            drawShadow={true}
            flippingTime={600}
            usePortrait={false}
            autoSize={false}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            maxShadowOpacity={0.4}
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))' }}
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
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-3"
            style={{ height: 60, background: 'rgba(8,8,20,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => isPortrait ? mobileFlip('prev') : desktopPrev()}
              disabled={currentPage === 0}
              className="flex items-center gap-1 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-20"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 14px', minWidth: 72, justifyContent: 'center' }}
            >
              <MdArrowBack size={16} /> Prev
            </button>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', minWidth: 10 }}>1</span>
              <input
                type="range" min={0} max={Math.max(0, totalPages - 1)}
                value={currentPage}
                onChange={e => {
                  const pg = Number(e.target.value);
                  setCurrentPage(pg);
                  setDisplayPage(pg);
                  if (!isPortrait) {
                    flipBook.current?.pageFlip()?.turnToPage(pg);
                    playFlipSound();
                  }
                }}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', minWidth: 22 }}>{totalPages}</span>
            </div>

            <button
              onClick={() => isPortrait ? mobileFlip('next') : desktopNext()}
              disabled={currentPage >= totalPages - 1}
              className="flex items-center gap-1 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-20"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 14px', minWidth: 72, justifyContent: 'center' }}
            >
              Next <MdArrowForward size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}