import { getInitials } from '../../utils/helpers';
import { useState, useEffect } from 'react';

const Avatar = ({ src, name, size = 'md', online = false, className = '' }) => {
  const [imageSrc, setImageSrc] = useState(src);

  // Update image src when src prop changes
  useEffect(() => {
    if (src) {
      // Add cache buster only when src changes
      const separator = src.includes('?') ? '&' : '?';
      setImageSrc(`${src}${separator}t=${Date.now()}`);
    } else {
      setImageSrc(null);
    }
  }, [src]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div className={`relative ${className}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold`}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
      )}
    </div>
  );
};

export default Avatar;