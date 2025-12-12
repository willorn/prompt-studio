import React from 'react';

interface MinimalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const MinimalButton: React.FC<MinimalButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'rounded-lg transition-all duration-100 active:scale-95';

  const variantClasses = {
    primary: 'bg-surface/80 text-onSurface hover:bg-surface',
    secondary: 'bg-surface-container/80 text-onSurface hover:bg-surface-container',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};