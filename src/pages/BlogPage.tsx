import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Search, Tag, Clock, Star, BookOpen, X, Video, Play, ExternalLink } from 'lucide-react';
import AdSlot from '../components/AdSlot';
import AnnouncementSlot from '../components/AnnouncementSlot';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { getBlogPostImage, handleImageError } from '../utils/blogImageUtils';
import { extractYouTubeId, getYouTubeEmbedUrl, normalizeYouTubeUrl, getYouTubeThumbnailUrl } from '../utils/youtubeUtils';

interface BlogPageProps {
  onBack: () => void;
}

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
  slug?: string;
}

const BlogPage: React.FC<BlogPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12; // 1 main + 3 side + 8 below = 12 posts per page
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  
  // Determine if user should see ads or announcements
  const isFree = !profile || (profile as any)?.account_tier === 'free';
  const isAdmin = profile && ((profile as any)?.is_admin === true || (profile as any)?.is_admin === 1 || (profile as any)?.role === 'admin');
  const showAds = isFree || isAdmin;

  const handleReadPost = (postId: number) => {
    const post = blogPosts.find(p => p.id === postId);
    navigate(`/arion/${post?.slug || postId}`);
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Fetch categories and initial posts (optimized - single call with reasonable limit)
  useEffect(() => {
    (async () => {
      try {
        // Fetch posts with a reasonable limit (30 is enough for initial display)
        const res = await apiService.get('/blog', { status: 'published', limit: 30, offset: 0 });
        
        // Extract categories from posts
        const postCategories = new Set<string>();
        (res.posts || []).forEach((p: any) => {
          const cat = p.category_name || p.category;
          if (cat && cat.trim() !== '') {
            postCategories.add(cat.trim());
          }
        });
        
        // Try to fetch categories from API (only if we need more categories)
        let catList: string[] = [];
        try {
          const catRes = await apiService.get('/blog/categories');
          catList = (catRes.categories || [])
            .map((c: any) => c.name)
            .filter((name: string) => name && name.trim() !== '');
        } catch (catError) {
          console.warn('Could not fetch categories from API, using post categories:', catError);
        }
        
        // Filter to only show specific categories
        const allowedCategories = ['Deals', 'Financing', 'Clinical Trials', 'Policy', 'Interview'];
        const allCategories = new Set(['All', ...catList, ...Array.from(postCategories)]);
        
        // Filter to only allowed categories
        const filteredCats = Array.from(allCategories).filter(cat => 
          cat === 'All' || allowedCategories.includes(cat)
        );
        
        // Sort: "All" first, then in the order specified
        const sortedCats = ['All', ...allowedCategories.filter(cat => filteredCats.includes(cat))];
        
        setCategories(sortedCats);
        
        // Set initial blog posts
        const api = (res.posts || []).map((p: any) => ({
          id: Number(p.id),
          title: String(p.title || ''),
          excerpt: String(p.excerpt || ''),
          content: String(p.content || ''),
          author: String(p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.author_name || 'Medarion'),
          date: String(p.published_at || p.created_at || ''),
          category: String(p.category_name || p.category || 'General'),
          readTime: String(p.read_time || '5 min read'),
          image: String(p.featured_image || ''),
          featured: Boolean(p.featured || false),
          slug: String(p.slug || '')
        }));
        setBlogPosts(api);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setBlogPosts([]);
      }
    })();
  }, []);

  // Fetch videos
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingVideos(true);
        const res = await apiService.get('/blog/videos');
        if (res.success && res.videos) {
          setVideos(res.videos);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    })();
  }, []);

  // Client-side filtering (no API call needed for category/search changes)
  // Only fetch from API if we need more posts or server-side search is required
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  
  useEffect(() => {
    // If no filters, use all posts
    if (!searchTerm.trim() && selectedCategory === 'All') {
      setFilteredPosts([]);
      setIsLoading(false);
      return;
    }
    
    // For search, we need server-side search, so make API call
    if (searchTerm.trim()) {
      setIsLoading(true);
      (async () => {
        try {
          const params: any = { 
            status: 'published', 
            limit: 30, 
            offset: 0,
            search: searchTerm.trim()
          };
          
          if (selectedCategory !== 'All') {
            params.category = selectedCategory;
          }
          
          const res = await apiService.get('/blog', params);
          const api = (res.posts || []).map((p: any) => ({
            id: Number(p.id),
            title: String(p.title || ''),
            excerpt: String(p.excerpt || ''),
            content: String(p.content || ''),
            author: String(p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.author_name || 'Medarion'),
            date: String(p.published_at || p.created_at || ''),
            category: String(p.category_name || p.category || 'General'),
            readTime: String(p.read_time || '5 min read'),
            image: String(p.featured_image || ''),
            featured: Boolean(p.featured || false),
            slug: String(p.slug || '')
          }));
          setFilteredPosts(api);
        } catch (error) {
          console.error('Error fetching filtered blog posts:', error);
          setFilteredPosts([]);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      // For category filter only, use client-side filtering (faster)
      setIsLoading(true);
      setTimeout(() => {
        const filtered = blogPosts.filter(post => 
          selectedCategory === 'All' || post.category === selectedCategory
        );
        setFilteredPosts(filtered);
        setIsLoading(false);
      }, 50); // Small delay for smooth UI
    }
  }, [selectedCategory, searchTerm, blogPosts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchTerm]);

  // Determine which posts to display
  const displayPosts = (searchTerm.trim() || selectedCategory !== 'All') ? filteredPosts : blogPosts;
  
  // Sort by date (newest first)
  const sortedPosts = [...displayPosts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  
  // Separate featured post
  const featuredPost = sortedPosts.find(p => p.featured);
  const regularPosts = sortedPosts.filter(p => !p.featured || p.id !== featuredPost?.id);
  
  // Pagination
  const totalPages = Math.max(1, Math.ceil(regularPosts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedPosts = regularPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Hero background image
  const _sp = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
  const blogHeroParam = _sp?.get('blogHero');
  const blogHeroUrl = (blogHeroParam ? `/images/${blogHeroParam}` : (import.meta as any).env?.VITE_BLOG_HERO_URL) || '/images/page hero section.jpeg';

  const hasActiveFilters = selectedCategory !== 'All' || searchTerm.trim() !== '';

  return (
    <div className="min-h-screen bg-[var(--color-background-default)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]" style={{ 
        marginTop: '-100px',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        left: '50%',
        right: '50%',
        width: '100vw',
        paddingTop: '120px',
        paddingBottom: '48px',
        position: 'relative',
      }}>
        <div aria-hidden className="absolute inset-0 z-0">
          <img
            src={blogHeroUrl}
            alt=""
            className="w-full h-full object-cover blur-[2px] scale-105 opacity-90"
            style={{ filter: 'brightness(0.4) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ background: 'linear-gradient(90deg, var(--color-primary-teal) 0%, var(--color-accent-sky) 100%)' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mx-auto w-16 h-1 rounded-full bg-[var(--color-primary-teal)] mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              Healthcare Insights
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              Discover the latest trends, innovations, and opportunities in African healthcare markets
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search articles, topics, or authors..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-14 pr-12 py-4 rounded-2xl border-2 border-white/50 bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-transparent shadow-lg text-lg"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Content - Full Width */}
          <main className="space-y-8">
              {/* Categories Section */}
              <div className="bg-[var(--color-background-surface)] rounded-xl shadow-sm p-5 border border-[var(--color-divider-gray)] mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[var(--color-primary-teal)]" />
                    Categories
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchTerm('');
                      }}
                      className="text-xs text-[var(--color-primary-teal)] hover:underline flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                {/* Mobile Dropdown */}
                <div className="lg:hidden mb-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Desktop Category Buttons - Split into 2 rows */}
                <div className="hidden lg:grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-[var(--color-primary-teal)] text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {hasActiveFilters && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-divider-gray)]">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Showing <span className="font-semibold text-[var(--color-primary-teal)]">{displayPosts.length}</span> {displayPosts.length === 1 ? 'article' : 'articles'}
                    </p>
                  </div>
                )}
              </div>

              {/* Blog Posts Section - Featured Large + Smaller Posts */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                    <span className="w-1 h-8 bg-[var(--color-primary-teal)] rounded-full"></span>
                    {hasActiveFilters ? 'Search Results' : 'Latest Articles'}
                  </h3>
                </div>

                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-primary-teal)] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-[var(--color-text-secondary)] text-lg">Loading articles...</p>
                  </div>
                ) : paginatedPosts.length === 0 ? (
                  <div className="text-center py-20 bg-[var(--color-background-surface)] rounded-2xl border border-[var(--color-divider-gray)]">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-[var(--color-text-secondary)] text-xl mb-2">
                      No articles found
                      {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                      {searchTerm.trim() !== '' && ` matching "${searchTerm}"`}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchTerm('');
                      }}
                      className="mt-4 px-6 py-3 bg-[var(--color-primary-teal)] text-white rounded-full hover:opacity-90 transition-opacity font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Featured Large Post + 3 Equal-Sized Posts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 items-start">
                      {/* Large Featured Post - Left Side (2 columns) */}
                      <article 
                        className="lg:col-span-2 bg-[var(--color-background-surface)] rounded-2xl shadow-lg overflow-hidden border border-[var(--color-divider-gray)] group cursor-pointer flex flex-col h-full"
                        onClick={() => handleReadPost(paginatedPosts[0]?.id || featuredPost?.id || 0)}
                      >
                        {(() => {
                          const mainPost = paginatedPosts[0] || featuredPost;
                          if (!mainPost) return null;
                          return (
                            <>
                              <div className="relative aspect-[4/3] overflow-hidden">
                                <img 
                                  src={getBlogPostImage(mainPost.image, mainPost.id, mainPost.category)} 
                                  alt={mainPost.title} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => handleImageError(e, mainPost.id, mainPost.category)}
                                />
                                <div className="absolute top-4 left-4 z-10">
                                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-800 rounded-full text-xs font-semibold shadow-lg">
                                    <Tag className="h-3 w-3" />
                                    {mainPost.category}
                                  </span>
                                </div>
                                {mainPost.featured && (
                                  <div className="absolute top-4 right-4 z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-secondary-gold)] text-white rounded-full text-xs font-semibold shadow-lg">
                                      <Star className="h-3 w-3 fill-current" />
                                      Featured
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Content moved to white section below */}
                              <div className="p-6 bg-white dark:bg-[var(--color-background-surface)] flex-1 flex flex-col">
                                <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-3 leading-tight line-clamp-2">
                                  {mainPost.title}
                                </h2>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed line-clamp-2 flex-1">
                                  {mainPost.excerpt}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)] mt-auto">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(mainPost.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3" />
                                    <span>{mainPost.author}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    <span>{mainPost.readTime}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </article>

                      {/* Small Compact Posts - Right Side (Stacked Vertically to Match Height) */}
                      <div className="lg:col-span-2 flex flex-col gap-3 h-full">
                        {paginatedPosts.slice(1, 6).map((post) => (
                          <article 
                            key={post.id} 
                            className="group bg-[var(--color-background-surface)] rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer border border-[var(--color-divider-gray)] flex gap-3 p-3 flex-1"
                            onClick={() => handleReadPost(post.id)}
                          >
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                              <img 
                                src={getBlogPostImage(post.image, post.id, post.category)} 
                                alt={post.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                onError={(e) => handleImageError(e, post.id, post.category)}
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="font-semibold text-[var(--color-text-primary)] text-sm leading-tight group-hover:text-[var(--color-primary-teal)] transition-colors mb-1 line-clamp-2">
                                {post.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(post.date)}</span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    {/* Two Rows of Blog Posts Below */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {paginatedPosts.slice(6, 14).map((post, idx) => (
                        <article 
                          key={post.id} 
                          className="group bg-[var(--color-background-surface)] rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-[var(--color-divider-gray)]"
                          onClick={() => handleReadPost(post.id)}
                        >
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <img 
                              src={getBlogPostImage(post.image, post.id, post.category)} 
                              alt={post.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => handleImageError(e, post.id, post.category)}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-white/95 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-800 border border-white/40">
                                {post.category}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-semibold text-[var(--color-text-primary)] text-sm leading-snug group-hover:text-[var(--color-primary-teal)] transition-colors mb-2 line-clamp-2">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-auto">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(post.date)}</span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                      className="px-4 py-2 rounded-lg border border-[var(--color-divider-gray)] hover:bg-[var(--color-background-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                      disabled={safePage <= 1} 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setPage(i + 1)} 
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          safePage === i + 1
                            ? 'bg-[var(--color-primary-teal)] text-white border-[var(--color-primary-teal)]'
                            : 'border-[var(--color-divider-gray)] hover:bg-[var(--color-background-surface)]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      className="px-4 py-2 rounded-lg border border-[var(--color-divider-gray)] hover:bg-[var(--color-background-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                      disabled={safePage >= totalPages} 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </section>

              {/* Ad Section Between Blog and Videos */}
              <div className="mt-8 bg-[var(--color-background-surface)] rounded-2xl p-6 border border-[var(--color-divider-gray)]">
                <AdSlot placement="blog_sidebar" category="blog_general" />
              </div>

              {/* Videos Section - Featured Large + Smaller Videos */}
              <section className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                    <span className="w-1 h-8 bg-[var(--color-primary-teal)] rounded-full"></span>
                    <Video className="h-6 w-6 text-[var(--color-primary-teal)]" />
                    Videos
                  </h3>
                </div>

                {isLoadingVideos ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-primary-teal)] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-[var(--color-text-secondary)] text-lg">Loading videos...</p>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-20 bg-[var(--color-background-surface)] rounded-2xl border border-[var(--color-divider-gray)]">
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-[var(--color-text-secondary)] text-xl mb-2">No videos available</p>
                    <p className="text-[var(--color-text-secondary)] text-sm">Check back later for new video content</p>
                  </div>
                ) : (
                  <>
                    {/* Featured Large Video + 3 Equal-Sized Videos Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 items-start">
                      {/* Large Featured Video - Left Side (2 columns) */}
                      {videos[0] && (() => {
                        const mainVideo = videos[0];
                        const videoId = extractYouTubeId(mainVideo.video_url);
                        const embedUrl = videoId ? getYouTubeEmbedUrl(mainVideo.video_url, {
                          rel: 0,
                          modestbranding: 1,
                          controls: 1
                        }) : null;
                        const normalizedUrl = normalizeYouTubeUrl(mainVideo.video_url) || mainVideo.video_url;
                        
                        return (
                          <article 
                            className="lg:col-span-2 bg-[var(--color-background-surface)] rounded-2xl shadow-lg overflow-hidden border border-[var(--color-divider-gray)] group cursor-pointer flex flex-col h-full"
                          >
                            <div className="relative aspect-[4/3] overflow-hidden bg-black">
                              {embedUrl ? (
                                <iframe
                                  className="w-full h-full"
                                  src={embedUrl}
                                  title={mainVideo.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              ) : (() => {
                                const mainThumbnailUrl = mainVideo.thumbnail_url || (videoId ? getYouTubeThumbnailUrl(mainVideo.video_url, 'maxresdefault') : null);
                                return mainThumbnailUrl ? (
                                  <a
                                    href={normalizedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full h-full relative"
                                  >
                                    <img 
                                      src={mainThumbnailUrl} 
                                      alt={mainVideo.title}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                      loading="eager"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors">
                                        <Play className="h-8 w-8 text-white ml-1" />
                                      </div>
                                    </div>
                                  </a>
                                ) : (
                                  <a
                                    href={normalizedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
                                  >
                                    <Play className="h-16 w-16 text-white/50" />
                                  </a>
                                );
                              })()}
                              <div className="absolute top-4 left-4 z-10">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-800 rounded-full text-xs font-semibold shadow-lg">
                                  <Video className="h-3 w-3" />
                                  Video
                                </span>
                              </div>
                            </div>
                            {/* Content moved to white section below */}
                            <div className="p-6 bg-white dark:bg-[var(--color-background-surface)] flex-1 flex flex-col">
                              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-3 leading-tight line-clamp-2">
                                {mainVideo.title}
                              </h2>
                              {mainVideo.description && (
                                <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed line-clamp-2 flex-1">
                                  {mainVideo.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)] mt-auto">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(mainVideo.created_at)}</span>
                                </div>
                                <a
                                  href={normalizedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 hover:gap-2 transition-all text-[var(--color-primary-teal)] hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>Watch on YouTube</span>
                                </a>
                              </div>
                            </div>
                          </article>
                        );
                      })()}

                      {/* Small Compact Videos - Right Side (Stacked Vertically to Match Height) */}
                      <div className="lg:col-span-2 flex flex-col gap-3 h-full">
                        {videos.slice(1, 6).map((video) => {
                          const videoId = extractYouTubeId(video.video_url);
                          const embedUrl = videoId ? getYouTubeEmbedUrl(video.video_url, {
                            rel: 0,
                            modestbranding: 1,
                            controls: 1
                          }) : null;
                          const normalizedUrl = normalizeYouTubeUrl(video.video_url) || video.video_url;
                          
                          return (
                            <article 
                              key={video.id} 
                              className="group bg-[var(--color-background-surface)] rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 border border-[var(--color-divider-gray)] flex gap-3 p-3 flex-1"
                            >
                              <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-black">
                                {(() => {
                                  const thumbnailUrl = video.thumbnail_url || (videoId ? getYouTubeThumbnailUrl(video.video_url, 'hqdefault') : null);
                                  return thumbnailUrl ? (
                                    <a
                                      href={normalizedUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full h-full relative"
                                    >
                                      <img 
                                        src={thumbnailUrl} 
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                                          <Play className="h-2.5 w-2.5 text-white ml-0.5" />
                                        </div>
                                      </div>
                                    </a>
                                  ) : (
                                    <a
                                      href={normalizedUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
                                    >
                                      <Play className="h-4 w-4 text-white/50" />
                                    </a>
                                  );
                                })()}
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm leading-tight group-hover:text-[var(--color-primary-teal)] transition-colors mb-1 line-clamp-2">
                                  {video.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(video.created_at)}</span>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>

                    {/* Two Rows of Videos Below */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {videos.slice(6, 14).map((video) => {
                        const videoId = extractYouTubeId(video.video_url);
                        const embedUrl = videoId ? getYouTubeEmbedUrl(video.video_url, {
                          rel: 0,
                          modestbranding: 1,
                          controls: 1
                        }) : null;
                        const normalizedUrl = normalizeYouTubeUrl(video.video_url) || video.video_url;
                        
                        return (
                          <article 
                            key={video.id} 
                            className="group bg-[var(--color-background-surface)] rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-[var(--color-divider-gray)] flex flex-col h-full"
                          >
                            <div className="relative aspect-video overflow-hidden bg-black">
                              {(() => {
                                const thumbnailUrl = video.thumbnail_url || (videoId ? getYouTubeThumbnailUrl(video.video_url, 'hqdefault') : null);
                                return thumbnailUrl ? (
                                  <a
                                    href={normalizedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full h-full"
                                  >
                                    <img 
                                      src={thumbnailUrl} 
                                      alt={video.title}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                        <Play className="h-6 w-6 text-white ml-1" />
                                      </div>
                                    </div>
                                  </a>
                                ) : (
                                  <a
                                    href={normalizedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
                                  >
                                    <Play className="h-12 w-12 text-white/50" />
                                  </a>
                                );
                              })()}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              <h4 className="font-semibold text-[var(--color-text-primary)] text-sm leading-snug group-hover:text-[var(--color-primary-teal)] transition-colors mb-2 line-clamp-2">
                                {video.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-auto">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(video.created_at)}</span>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Ad Section Below Videos */}
                <div className="mt-8 bg-[var(--color-background-surface)] rounded-2xl p-6 border border-[var(--color-divider-gray)]">
                  <AdSlot placement="blog_bottom" category="blog_general" />
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
  );
};

export default BlogPage;
