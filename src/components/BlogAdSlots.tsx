import React from 'react';
import AdSlot from './AdSlot';

function useConfig() {
  try {
    const raw = localStorage.getItem('medarionConfig');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const BlogAdSlots: React.FC = () => {
  const cfg = useConfig();
  const hidden = cfg?.adsEnabled === false;
  return (
    <div className="space-y-3">
      <AdSlot placement="blog_top" category="blog_general" hidden={hidden} />
      <AdSlot placement="blog_inline" category="blog_general" hidden={hidden} />
    </div>
  );
};

export default BlogAdSlots; 