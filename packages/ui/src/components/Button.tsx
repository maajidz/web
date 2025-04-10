import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-focus',
    secondary: 'bg-secondary text-white hover:bg-secondary-focus',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  const classes = `
    rounded-md font-medium transition-colors
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}; 