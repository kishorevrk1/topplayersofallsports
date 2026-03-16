import React from 'react';

const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2','#65a30d'];

function makeAvatarSvg(name) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0] || '')
    .join('')
    .toUpperCase() || '?';
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${color}"/>
    <text x="50" y="50" dy=".35em" text-anchor="middle" fill="white"
      font-size="36" font-family="sans-serif" font-weight="bold">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function Image({
  src,
  alt = "Image",
  className = "",
  ...props
}) {
  const fallback = makeAvatarSvg(alt);
  return (
    <img
      src={src || fallback}
      alt={alt}
      className={className}
      onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
      {...props}
    />
  );
}

export default Image;
