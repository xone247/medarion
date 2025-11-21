/**
 * Utility functions for handling YouTube video URLs
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID (without www)
 */
export const extractYouTubeId = (url: string | null | undefined): string | null => {
	if (!url || typeof url !== 'string') return null;
	
	const trimmed = url.trim();
	if (!trimmed) return null;
	
	// Patterns for different YouTube URL formats
	const patterns = [
		// Standard watch URL: youtube.com/watch?v=VIDEO_ID
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
		// Alternative watch URL formats
		/youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
		// Short URL: youtu.be/VIDEO_ID
		/youtu\.be\/([a-zA-Z0-9_-]{11})/,
		// Mobile URL: m.youtube.com/watch?v=VIDEO_ID
		/m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
	];
	
	for (const pattern of patterns) {
		const match = trimmed.match(pattern);
		if (match && match[1] && match[1].length === 11) {
			return match[1];
		}
	}
	
	return null;
};

/**
 * Normalize YouTube URL to standard format
 * Converts any YouTube URL format to: https://www.youtube.com/watch?v=VIDEO_ID
 */
export const normalizeYouTubeUrl = (url: string | null | undefined): string | null => {
	if (!url || typeof url !== 'string') return null;
	
	const trimmed = url.trim();
	if (!trimmed) return null;
	
	const videoId = extractYouTubeId(trimmed);
	if (!videoId) return null;
	
	return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Validate if a URL is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url: string | null | undefined): boolean => {
	if (!url || typeof url !== 'string') return false;
	
	const trimmed = url.trim();
	if (!trimmed) return false;
	
	// Check if it contains YouTube domain
	const youtubeDomains = [
		'youtube.com',
		'youtu.be',
		'm.youtube.com',
		'www.youtube.com',
	];
	
	const hasYouTubeDomain = youtubeDomains.some(domain => trimmed.includes(domain));
	if (!hasYouTubeDomain) return false;
	
	// Check if we can extract a valid video ID
	return extractYouTubeId(trimmed) !== null;
};

/**
 * Get embed URL from YouTube URL
 * Returns: https://www.youtube.com/embed/VIDEO_ID
 */
export const getYouTubeEmbedUrl = (url: string | null | undefined, options?: {
	autoplay?: boolean;
	rel?: number;
	modestbranding?: number;
	controls?: number;
}): string | null => {
	const videoId = extractYouTubeId(url);
	if (!videoId) return null;
	
	const params = new URLSearchParams();
	if (options?.autoplay) params.append('autoplay', '1');
	if (options?.rel !== undefined) params.append('rel', options.rel.toString());
	if (options?.modestbranding !== undefined) params.append('modestbranding', options.modestbranding.toString());
	if (options?.controls !== undefined) params.append('controls', options.controls.toString());
	
	const queryString = params.toString();
	return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Get YouTube thumbnail URL from video ID or URL
 * Quality options: 'maxresdefault' (highest), 'hqdefault' (high), 'mqdefault' (medium), 'sddefault' (standard)
 * Returns: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
 */
export const getYouTubeThumbnailUrl = (
	url: string | null | undefined,
	quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault' = 'hqdefault'
): string | null => {
	const videoId = extractYouTubeId(url);
	if (!videoId) return null;
	
	return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

