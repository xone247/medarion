import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Clock, Eye, Share2, Tag, ArrowRight, ExternalLink, Play } from 'lucide-react';
import AdSlot from '../components/AdSlot';
import AnnouncementSlot from '../components/AnnouncementSlot';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { getBlogPostImage, handleImageError } from '../utils/blogImageUtils';
import { extractYouTubeId, getYouTubeEmbedUrl, normalizeYouTubeUrl } from '../utils/youtubeUtils';

interface BlogPost {
	id: number;
	title: string;
	excerpt: string;
	content: string;
	author: string;
	date: string;
	category: string;
	readTime: string;
	image: string;
	featured: boolean;
	views?: number;
	video_url?: string;
}

const BlogDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { profile } = useAuth();
	const [post, setPost] = useState<BlogPost | null>(null);
	const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isNumericId = id ? !isNaN(Number(id)) && Number(id) > 0 : false;
	const postId = isNumericId ? Number(id) : null;
	const slug = !isNumericId ? id : null;
	
	// Determine if user should see ads or announcements
	const isFree = !profile || (profile as any)?.account_tier === 'free';
	const isAdmin = profile && ((profile as any)?.is_admin === true || (profile as any)?.is_admin === 1 || (profile as any)?.role === 'admin');
	const showAds = isFree || isAdmin;
	const [progress, setProgress] = useState(0);

	// Update document title when post loads
	useEffect(() => {
		if (post && post.title) {
			document.title = `${post.title} | Medarion Arion`;
		} else {
			document.title = 'Medarion - African Healthcare Data Platform';
		}
	}, [post]);

	// Reading progress
	useEffect(() => {
		const onScroll = () => {
			const el = document.getElementById('blog-article');
			if (!el) { setProgress(0); return; }
			const totalScrollable = el.scrollHeight - window.innerHeight;
			const scrolled = Math.min(Math.max(window.scrollY - (el.offsetTop - 80), 0), totalScrollable);
			const pct = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
			setProgress(Math.max(0, Math.min(100, pct)));
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			alert('Link copied to clipboard');
		} catch {
			// no-op
		}
	};

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				
				// Validate id - wait for it to be available
				if (!id) {
					if (!cancelled) {
						setLoading(false);
					}
					return;
				}
				
				// Fetch the specific post by slug or ID - use unified endpoint
				// The backend route /blog/:id handles both numeric IDs and slugs
				const endpoint = `/blog/${id}`;
				const res: any = await apiService.get(endpoint);
				const p = res?.post || res;
				
				if (!cancelled && p) {
					const authorName = p.first_name && p.last_name 
						? `${p.first_name} ${p.last_name}` 
						: p.author_name || 'Medarion';
					
					const postData: BlogPost = {
						id: Number(p.id),
						title: String(p.title || ''),
						excerpt: String(p.excerpt || ''),
						content: String(p.content || ''),
						author: String(authorName),
						date: String(p.published_at || p.created_at || ''),
						category: String(p.category || 'General'),
						readTime: String(p.read_time || '5 min read'),
						image: String(p.featured_image || ''),
						featured: Boolean(p.featured || false),
						views: Number(p.views || 0),
						video_url: String(p.video_url || '')
					};
					
					setPost(postData);
					
					// Update URL to use slug if we accessed via ID
					if (postId && p.slug && window.location.pathname.includes(`/arion/${postId}`)) {
						const newPath = `/arion/${p.slug}`;
						window.history.replaceState({}, '', newPath);
					}
					
					// Fetch related posts (optimized - only fetch 6 posts, we only need 4)
					try {
						const allPostsRes = await apiService.get('/blog', { status: 'published', limit: 6, offset: 0 });
						const allPosts = (allPostsRes.posts || []).map((p: any) => ({
							id: Number(p.id),
							title: String(p.title || ''),
							excerpt: String(p.excerpt || ''),
							content: String(p.content || ''),
							author: String(p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.author_name || 'Medarion'),
							date: String(p.published_at || p.created_at || ''),
							category: String(p.category || 'General'),
							readTime: String(p.read_time || '5 min read'),
							image: String(p.featured_image || ''),
							featured: Boolean(p.featured || false),
							slug: String(p.slug || '')
						}));
						
						const currentPostId = postData.id;
						const sameCategory = allPosts.filter((p: BlogPost) => p.id !== currentPostId && p.category === postData.category);
						const otherPosts = allPosts.filter((p: BlogPost) => p.id !== currentPostId && p.category !== postData.category);
						const related = [...sameCategory, ...otherPosts].slice(0, 4);
						setRelatedPosts(related);
					} catch (err) {
						console.error('Error fetching related posts:', err);
					}
					
					setLoading(false);
				} else if (!cancelled) {
					setError('Post not found');
					setLoading(false);
				}
			} catch (error) {
				console.error('Error fetching blog post:', error);
				if (!cancelled) {
					setError('Failed to load blog post');
					setLoading(false);
				}
			}
		})();
		return () => { cancelled = true; };
	}, [id]); // Simplified dependency - only depend on id from useParams

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-4xl mx-auto">
						<div className="animate-pulse">
							<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
							<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
							<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
							<div className="space-y-3">
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error && !post) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-4xl mx-auto text-center">
						<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
							<div className="text-red-500 text-6xl mb-4">⚠️</div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h1>
							<p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
							<button
								onClick={() => navigate('/arion')}
								className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<ArrowLeft className="h-4 w-4" />
								Back to Blog
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-4xl mx-auto text-center">
						<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
							<div className="text-gray-400 text-6xl mb-4">📝</div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h1>
							<p className="text-gray-600 dark:text-gray-400 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
							<button
								onClick={() => navigate('/arion')}
								className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<ArrowLeft className="h-4 w-4" />
								Back to Blog
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--color-background-default)]" style={{ marginTop: 0, paddingTop: 0 }}>
			{/* Reading progress bar */}
			<div aria-hidden className="fixed top-0 left-0 right-0 h-1 z-[100]">
				<div className="h-full bg-[var(--color-primary-teal)] transition-[width] duration-150 ease-linear" style={{ width: `${progress}%` }} />
			</div>
		{/* Hero Section with Featured Image */}
		<div className="relative overflow-hidden" style={{
			marginTop: '-100px',
			marginLeft: '-50vw',
			marginRight: '-50vw',
			left: '50%',
			right: '50%',
			width: '100vw',
			position: 'relative',
			zIndex: 1,
			paddingTop: 0,
		}}>
			{/* Featured Image */}
			<div className="relative h-[75vh] min-h-[650px] overflow-hidden" style={{
				marginTop: 0,
				paddingTop: 0,
			}}>
					<img 
						src={getBlogPostImage(post.image, post.id, post.category)}
						onError={(e) => handleImageError(e, post.id, post.category)} 
						alt={post.title} 
						className="w-full h-full object-cover"
						style={{
							marginTop: 0,
						}}
					/>
					<div className="absolute inset-0 bg-black/50" />
					
					{/* Back button removed per request */}

					{/* Title and Metadata Overlay */}
					<div className="absolute left-0 right-0 p-8 lg:p-12" style={{
						top: '160px',
						paddingBottom: '2rem',
						paddingLeft: '2rem',
						paddingRight: '2rem',
					} as React.CSSProperties}>
						<div className="container mx-auto px-4">
							<div className="max-w-6xl mx-auto">
							{/* Category and Featured Badges - Modern horizontal layout */}
							<div className="flex items-center gap-3 mb-6 flex-wrap">
								{post.featured && (
									<div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-secondary-gold)] to-yellow-500 text-white rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm border border-yellow-400/30">
										<span className="text-base">⭐</span>
										<span>Featured</span>
									</div>
								)}
								<span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-gray-800/30 backdrop-blur-md text-white rounded-full text-sm font-medium shadow-lg border border-white/20">
									<Tag className="h-3.5 w-3.5" />
									{post.category}
								</span>
							</div>
							
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
								{post.title}
							</h1>
							
							{/* Excerpt */}
							{post.excerpt && (
								<p className="text-lg md:text-xl text-white/95 mb-8 leading-relaxed max-w-3xl drop-shadow-md font-light">
									{post.excerpt}
								</p>
							)}

							{/* Metadata - Modern design */}
							<div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base mb-6">
								<div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
									<Calendar className="h-4 w-4" />
									<span className="font-medium">
										{post.date ? new Date(post.date).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										}) : 'Not published'}
									</span>
								</div>
								<div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
									<User className="h-4 w-4" />
									<span className="font-medium">{post.author || 'Admin'}</span>
								</div>
								<div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
									<Clock className="h-4 w-4" />
									<span className="font-medium">{post.readTime || '5 min read'}</span>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-4">
								<button onClick={copyLink} className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-200 border border-white/30">
									<Share2 className="h-5 w-5" />
									<span className="font-medium">Copy link</span>
								</button>
							</div>
							</div>
                            </div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-8" style={{ marginTop: '20px' }}>
				<div className="max-w-6xl mx-auto">
					{/* Breadcrumb + actions */}
					<div className="flex items-center justify-between mb-2">
						<nav className="text-sm" aria-label="Breadcrumb">
							<ol className="flex items-center gap-2 text-[var(--color-text-secondary)]">
								<li><a href="/" className="hover:text-[var(--color-primary-teal)]">Home</a></li>
								<li aria-hidden>/</li>
								<li><a href="/arion" className="hover:text-[var(--color-primary-teal)]">Arion</a></li>
								<li aria-hidden>/</li>
								<li className="text-[var(--color-text-primary)] font-medium line-clamp-1 max-w-[50vw]">{post?.title || '...'}</li>
							</ol>
						</nav>
						<div className="flex items-center gap-2">
							<button onClick={copyLink} className="btn-outline btn-sm flex items-center gap-2">
								<Share2 className="h-4 w-4" /><span className="text-sm">Copy link</span>
							</button>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-12">
						{/* Main Content */}
						<article className="lg:col-span-2 space-y-8" id="blog-article">
							{/* Content */}
							<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
								<div className="p-8 lg:p-12">
									<div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl prose-img:shadow-lg prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl">
										{post.content ? (
											<div dangerouslySetInnerHTML={{ __html: post.content }} />
										) : (
											<div className="text-center py-16">
												<div className="text-gray-400 text-8xl mb-6">📝</div>
												<h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-4">No Content Available</h3>
												<p className="text-gray-500 dark:text-gray-500 text-lg">This post doesn't have any content yet.</p>
											</div>
										)}
									</div>
								</div>
					</div>

							{/* Video Section - Moved below content */}
							{post.video_url && extractYouTubeId(post.video_url) && (() => {
								const normalizedUrl = normalizeYouTubeUrl(post.video_url) || post.video_url;
								const embedUrl = getYouTubeEmbedUrl(post.video_url, {
									rel: 0,
									modestbranding: 1,
									controls: 1
								});
								
								return embedUrl ? (
									<div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
										<div className="p-6 lg:p-8">
											{/* Video Header */}
											<div className="flex items-center justify-between mb-6">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
														<Play className="h-6 w-6 text-white ml-1" />
													</div>
													<div>
														<h3 className="text-xl font-bold text-gray-900 dark:text-white">Watch Video</h3>
														<p className="text-sm text-gray-600 dark:text-gray-400">Related video content</p>
													</div>
												</div>
												<a
													href={normalizedUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600"
												>
													<span className="text-sm font-medium">Watch on YouTube</span>
													<ExternalLink className="h-4 w-4" />
												</a>
											</div>
											
											{/* YouTube Embed */}
											<div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-black" style={{ paddingBottom: '56.25%' }}>
												<iframe
													className="absolute top-0 left-0 w-full h-full"
													src={embedUrl}
													title="YouTube video player"
													frameBorder="0"
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
													allowFullScreen
												/>
											</div>
										</div>
									</div>
								) : null;
							})()}

							{/* Related Articles */}
							{relatedPosts.length > 0 && (
							<div className="bg-[var(--color-background-surface)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider-gray)]">
								<div className="px-8 lg:px-12 py-8 border-b border-[var(--color-divider-gray)]">
									<h3 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
										<span className="w-1 h-8 bg-[var(--color-primary-teal)] rounded-full"></span>
										{relatedPosts.some(r => r.category === post?.category) ? 'Related Articles' : 'You Might Also Like'}
									</h3>
									</div>
									<div className="p-8 lg:p-12">
										<div className="grid grid-cols-2 gap-8">
                            {relatedPosts.map(r => (
												<article 
													key={r.id} 
													className="group cursor-pointer"
													onClick={() => navigate(`/arion/${r.id}`)}
												>
													<div className="bg-[var(--color-background-surface)] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] border border-[var(--color-divider-gray)]">
														<div className="relative h-56">
															<img 
																src={getBlogPostImage(r.image, r.id, r.category)}
																onError={(e) => handleImageError(e, r.id, r.category)} 
																alt={r.title} 
																className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
															/>
															<div className="absolute inset-0 bg-black/40" />
															<div className="absolute top-4 left-4">
																<span className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700 dark:text-gray-300">
																	{r.category}
																</span>
															</div>
														</div>
														<div className="p-6">
															<div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
																<span>{new Date(r.date).toLocaleDateString()}</span>
																<span>•</span>
																<span>{r.readTime}</span>
															</div>
															<h4 className="font-bold text-[var(--color-text-primary)] text-lg leading-snug group-hover:text-[var(--color-primary-teal)] transition-colors mb-2">
																	{r.title}
															</h4>
															<div className="flex items-center text-[var(--color-primary-teal)] text-sm font-medium group-hover:gap-2 transition-all">
																<span>Read more</span>
																<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
										</div>
									</div>
								</div>
							)}

						{/* Inline ad removed; bottom ad remains below */}

						{/* Bottom Ad Placement */}
						<div className="bg-[var(--color-background-surface)] rounded-3xl shadow-2xl p-8 lg:p-12 border border-[var(--color-divider-gray)]">
							<AdSlot placement="blog_bottom" category="blog_general" />
						</div>
						</article>

						{/* Sidebar */}
						<aside className="space-y-8">
							{/* Author Card */}
							<div className="bg-[var(--color-background-surface)] rounded-3xl shadow-2xl p-8 border border-[var(--color-divider-gray)]">
								<div className="text-center">
									<div className="w-20 h-20 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
										{post.author.charAt(0)}
									</div>
									<h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{post.author}</h4>
									<p className="text-sm text-[var(--color-text-secondary)] mb-4">Author & Healthcare Expert</p>
									<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
										Insights and analysis on African healthcare markets, startups, investment, and policy.
									</p>
                        </div>
                    </div>

							{/* Sponsored Content or Announcements */}
							<div className="bg-[var(--color-background-surface)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider-gray)]">
								<div className="px-8 py-6 border-b border-[var(--color-divider-gray)]">
									<h3 className="font-bold text-[var(--color-text-primary)] text-lg">
										{showAds ? 'Sponsored' : 'Announcements'}
									</h3>
								</div>
								<div className="p-8">
									{showAds ? (
										<AdSlot placement="blog_sidebar" category="blog_general" />
									) : (
										<AnnouncementSlot placement="blog_sidebar" />
									)}
								</div>
							</div>

							{/* About Medarion */}
							<div className="bg-[var(--color-background-surface)] rounded-3xl shadow-2xl p-8 border border-[var(--color-divider-gray)]">
								<h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-4">About Medarion</h3>
								<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
									Insights and analysis on African healthcare markets, startups, investment, and policy.
								</p>
								<button className="w-full btn-primary-elevated text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition-all duration-200 shadow-lg">
									Learn More
								</button>
							</div>
				</aside>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BlogDetailPage; 