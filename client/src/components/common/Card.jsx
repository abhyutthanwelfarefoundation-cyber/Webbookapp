import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function Card({ children, className, hover = false, onClick }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 10px 40px rgba(0,0,0,.12)' } : {}}
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        hover && 'cursor-pointer transition-all duration-200',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
