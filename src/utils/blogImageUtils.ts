/**
 * Utility functions for handling blog post images
 */

/**
 * Get the full image URL for a blog post
 * Handles both relative paths and full URLs
 */
export const getBlogPostImage = (imageUrl: string | null | undefined, postId: number, category: string = 'General'): string => {
  // If image exists and is not empty
  if (imageUrl && imageUrl.trim().length > 0) {
    let trimmed = imageUrl.trim();
    
    // Fix localhost URLs to use production URL
    if (trimmed.includes('localhost:3001') || trimmed.includes('127.0.0.1:3001')) {
      trimmed = trimmed.replace(/https?:\/\/[^\/]+/, 'https://medarion.africa');
    }
    
    // Fix old api.medarion.africa/uploads URLs to use medarion.africa/uploads
    if (trimmed.includes('api.medarion.africa/uploads')) {
      trimmed = trimmed.replace('api.medarion.africa', 'medarion.africa');
    }
    
    // If it's already a full URL (http:// or https://), return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // Ensure HTTPS in production (replace http:// with https:// for medarion.africa domains)
      if (trimmed.startsWith('http://') && trimmed.includes('medarion.africa')) {
        trimmed = trimmed.replace('http://', 'https://');
      }
      return trimmed;
    }
    
    // If it starts with /, it's a relative path - ensure it's served correctly
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    
    // If it doesn't start with /, assume it's relative to /images/
    return `/images/${trimmed}`;
  }
  
  // Fallback: Use seeded placeholder for consistency
  const seed = encodeURIComponent(`${category}-${postId}`);
  return `https://picsum.photos/seed/medarion-${seed}/1200/800`;
};

/**
 * Handle image load error by setting a fallback
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, postId: number, category: string = 'General'): void => {
  const img = e.currentTarget;
  // Hide image on error instead of showing fallback to prevent error loops
  img.style.display = 'none';
  img.onerror = null; // Prevent infinite loop
};

