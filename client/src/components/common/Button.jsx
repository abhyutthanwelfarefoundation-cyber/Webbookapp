import clsx from 'clsx';
import { motion } from 'framer-motion';

const variants = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  danger:    'bg-red-500 text-white hover:bg-red-600',
  ghost:     'bg-transparent text-indigo-600 hover:bg-indigo-50'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base'
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading, disabled, className, icon, ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={clsx(
        'inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        variants[variant], sizes[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
        </svg>
      ) : icon}
      {children}
    </motion.button>
  );
}
