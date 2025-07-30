import React from 'react';

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const renderSpinner = () => (
    <svg className={`animate-spin ${sizeClasses[size]}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`}></div>
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse-slow`}></div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3">
        {renderVariant()}
        {text && (
          <span className="text-secondary-600 font-medium">{text}</span>
        )}
      </div>
    </div>
  );
};

export default Loading; 