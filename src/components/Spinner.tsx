import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'purple' | 'blue' | 'gray' | 'white' | 'green';
  label?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-3',
};

const colorClasses = {
  purple: 'border-purple-200 border-t-purple-600',
  blue: 'border-blue-200 border-t-blue-600',
  gray: 'border-gray-200 border-t-gray-600',
  white: 'border-white/30 border-t-white',
  green: 'border-green-200 border-t-green-600',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'purple',
  label,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  transparent = false,
}) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-10 ${
        transparent ? 'bg-white/60' : 'bg-white/90'
      } backdrop-blur-sm`}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="purple" />
        <span className="text-sm font-medium text-gray-600">{message}</span>
      </div>
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" color={variant === 'primary' ? 'white' : 'purple'} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};

interface PulsingDotsProps {
  color?: 'purple' | 'gray' | 'blue';
  size?: 'sm' | 'md';
}

export const PulsingDots: React.FC<PulsingDotsProps> = ({
  color = 'purple',
  size = 'md',
}) => {
  const dotColorClasses = {
    purple: 'bg-purple-600',
    gray: 'bg-gray-400',
    blue: 'bg-blue-600',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <div className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSizeClasses[size]} ${dotColorClasses[color]} rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
};

// AsyncButton - handles loading state internally for async onClick handlers
interface AsyncButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick: () => void | Promise<void>;
  loadingText?: string;
  loadingDuration?: number; // Minimum loading duration in ms
  children: React.ReactNode;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  onClick,
  loadingText,
  loadingDuration = 800,
  children,
  icon,
  loadingIcon,
  className = '',
  disabled,
  ...props
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      await onClick();
    } finally {
      // Ensure minimum loading duration for better UX
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, loadingDuration - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  return (
    <button
      className={className}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <>
          {loadingIcon || <Loader2Icon className="w-4 h-4 animate-spin" />}
          {loadingText || children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

// Internal Loader2 icon to avoid circular dependency
const Loader2Icon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Spinner;
