import React from 'react';

// Inline circular spinner for buttons and form submissions
const Spinner = ({ size = 'sm', color = 'white' }) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const colorMap = {
    white: 'border-white border-t-transparent',
    purple: 'border-[#F97316] border-t-transparent',
    orange: 'border-[#F97316] border-t-transparent',
    gray: 'border-zinc-500 border-t-transparent',
  };

  return (
    <div
      className={`${sizeMap[size] || sizeMap.sm} ${colorMap[color] || colorMap.white} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
