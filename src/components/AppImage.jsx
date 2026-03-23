import React from 'react';

const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2','#65a30d'];

function makeAvatarSvg(name) {
  const safeName = (name == null || typeof name !== 'string') ? 'Image' : name;
  // Strip non-ASCII (emoji etc.) to avoid encodeURIComponent failures
  const ascii = safeName.replace(/[^\x20-\x7E]/g, '').trim() || 'Image';
  const initials = ascii
    .split(' ')
    .slice(0, 2)
    .map(n => n[0] || '')
    .join('')
    .toUpperCase() || '?';
  const color = AVATAR_COLORS[(safeName.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${color}"/>
    <text x="50" y="50" dy=".35em" text-anchor="middle" fill="white"
      font-size="36" font-family="sans-serif" font-weight="bold">${initials}</text>
  </svg>`;
  try {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    // Fallback if encodeURIComponent fails on malformed Unicode
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><text x="50" y="50" dy=".35em" text-anchor="middle" fill="white" font-size="36" font-family="sans-serif" font-weight="bold">?</text></svg>')}`;
  }
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
