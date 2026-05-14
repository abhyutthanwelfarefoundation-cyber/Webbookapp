import { useState, useRef, forwardRef , useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import { MdArrowBack, MdArrowForward, MdFullscreen, MdFullscreenExit, MdArrowBackIos } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Loader from '../components/common/Loader';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const BookPage = forwardRef(({ pageNumber, pdfUrl, width, height }, ref) => (
  <div ref={ref} style={{ width, height, background: '#fff', overflow: 'hidden', boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.1)' }}>
    <Document file={pdfUrl} loading="">
      <Page pageNumber={pageNumber} width={width} renderTextLayer={false} renderAnnotationLayer={false} />
    </Document>
  </div>
));

export default function FlipbookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const flipBook = useRef(null);
  const audioCtx = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const { data: book } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then(r => r.data.book)
  });

  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['bookPages', id],
    queryFn: () => api.get(`/books/${id}/pages`).then(r => r.data)
  });

  // Realistic paper flip sound
  const playFlipSound = async () => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtx.current;

      // Always resume — browser suspends after idle
      if (ctx.state !== 'running') {
        await ctx.resume();
      }

      const duration = 0.2;
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(2, sr * duration, sr);

      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) {
          const t = i / d.length;
          const attack = t < 0.08 ? t / 0.08 : 1;
          const decay = Math.pow(1 - t, 2);
          d[i] = (Math.random() * 2 - 1) * attack * decay * 0.5;
        }
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 400;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      src.connect(hp);
      hp.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
      src.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(p => !p);
  };

    const goNext = async () => {
    await playFlipSound();
    flipBook.current?.pageFlip()?.flipNext();
  };

  const goPrev = async () => {
    await playFlipSound();
    flipBook.current?.pageFlip()?.flipPrev();
  };

  const isMobile = window.innerWidth < 768;
  const pageW = isMobile ? window.innerWidth - 32 : Math.min(440, (window.innerWidth - 120) / 2);
  const pageH = Math.round(pageW * 1.414);

// Unlock audio on first interaction
useEffect(() => {
  const unlock = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    audioCtx.current.resume();
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };
  document.addEventListener('touchstart', unlock);
  document.addEventListener('click', unlock);
  return () => {
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };
}, []);



  if (isLoading) return <Loader fullscreen text="Loading book..." />;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen select-none"
      style={{ background: 'radial-gradient(ellipse at center, #2d2d3a 0%, #111118 100%)' }}
      onClick={() => setShowControls(p => !p)}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -64 }} animate={{ y: 0 }} exit={{ y: -64 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white hover:text-indigo-300 transition-colors">
              <MdArrowBackIos size={18} />
              <span className="text-sm font-medium hidden sm:block truncate max-w-xs">{book?.title}</span>
            </button>
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button onClick={toggleFullscreen} className="text-white hover:text-indigo-300 transition-colors p-1">
              {isFullscreen ? <MdFullscreenExit size={22} /> : <MdFullscreen size={22} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book area */}
      <div className="mt-16 mb-24 flex items-center justify-center" style={{ perspective: '2000px' }}>
        {pagesData?.pdfUrl && (
          <>
            {/* Hidden PDF loader to get page count */}
            <div style={{ display: 'none' }}>
              <Document
                file={pagesData.pdfUrl}
                onLoadSuccess={({ numPages }) => { setTotalPages(numPages); setPdfLoaded(true); }}
              />
            </div>

            {pdfLoaded && totalPages > 0 ? (
              <HTMLFlipBook
                ref={flipBook}
                width={pageW}
                height={pageH}
                size="fixed"
                minWidth={200}
                maxWidth={500}
                minHeight={280}
                maxHeight={720}
                showCover={true}
                mobileScrollSupport={false}
                onFlip={e => { setCurrentPage(e.data); playFlipSound(); }}
                drawShadow={true}
                maxShadowOpacity={0.4}
                flippingTime={600}
                usePortrait={isMobile}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
                style={{ filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.8))' }}
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <BookPage
                    key={i}
                    pageNumber={i + 1}
                    pdfUrl={pagesData.pdfUrl}
                    width={pageW}
                    height={pageH}
                  />
                ))}
              </HTMLFlipBook>
            ) : (
              <Loader text="Preparing flipbook..." />
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 py-4 px-6 flex items-center justify-center gap-4"
            style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={goPrev} disabled={currentPage === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
              <MdArrowBack size={18} /> Prev
            </button>

            <div className="flex items-center gap-3 flex-1 max-w-sm">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', minWidth: 16 }}>1</span>
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
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', minWidth: 28 }}>{totalPages}</span>
            </div>

            <button onClick={goNext} disabled={currentPage >= totalPages - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
              Next <MdArrowForward size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}