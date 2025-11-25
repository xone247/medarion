import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { mockData } from '../data/mockData';
import { ArrowRight, Menu, X, Sun, Moon, CheckCircle2, Shield, Zap, LineChart, Users, Database, Play, Star, Lock, Monitor, Layers, ChevronRight, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import LogoWall from '../components/LogoWall';
import { apiService } from '../services/apiService';
import { getBlogPostImage, handleImageError } from '../utils/blogImageUtils';

interface CluelyLandingProps {
	onGetStarted: () => void;
	onShowAuth: () => void;
	onNavigate: (page: string) => void;
	currentPage?: string;
	/** When false, don't render the internal landing header; use SiteHeader instead */
	withHeader?: boolean;
	/** When false, don't render the internal landing footer; use SiteFooter instead */
	withFooter?: boolean;
}

// Helper to format big numbers nicely
function formatCurrencyUSD(value: number) {
	if (!Number.isFinite(value)) return '$0';
	const billions = value / 1_000_000_000;
	const millions = value / 1_000_000;
	if (billions >= 1) return `$${billions.toFixed(1)}B+`;
	if (millions >= 1) return `$${millions.toFixed(1)}M+`;
	return `$${value.toLocaleString()}`;
}

const CluelyLanding: React.FC<CluelyLandingProps> = ({ onGetStarted, onShowAuth, onNavigate, currentPage, withHeader = true, withFooter = true }) => {
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
	const { user, profile } = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const location = useLocation();
	const [newsletterStatus, setNewsletterStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
	const [isSubscribing, setIsSubscribing] = useState(false);

	// Detect mobile breakpoint
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Handle sign in button click - redirect to dashboard if already signed in
	const handleSignInClick = (e: React.MouseEvent) => {
		e.preventDefault();
		if (user && profile) {
			const isAdmin = (profile as any)?.is_admin || (profile as any)?.app_roles?.includes('super_admin')
			if (isAdmin) {
				window.location.href = '/admin-dashboard'
				return
			}
			
			const userType = (profile as any)?.user_type || (profile as any)?.role || 'startup'
			const redirectMap: Record<string, string> = {
				'startup': '/startup-dashboard',
				'investors_finance': '/investor-dashboard',
				'investor': '/investor-dashboard',
				'industry_executives': '/executive-dashboard',
				'executive': '/executive-dashboard',
				'health_science_experts': '/researcher-dashboard',
				'researcher': '/researcher-dashboard',
				'regulators': '/regulator-dashboard',
				'regulator': '/regulator-dashboard'
			}
			const targetPath = redirectMap[userType] || '/startup-dashboard'
			window.location.href = targetPath
		} else {
			onShowAuth();
			window.location.assign('/auth');
		}
	}

	// Configurable hero background image (brand-fitted).
	// Try order:
	// 1) ?hero=FILENAME (place file in /public/images/)
	// 2) VITE_HOME_BG_URL
	// 3) VITE_BLOG_HERO_URL (use same as blog hero for parity)
	// 4) Local default downloaded file
	const _sp = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
	const heroParam = _sp?.get('hero');
	const heroImageUrl =
		(heroParam ? `/images/${heroParam}` :
			((import.meta as any).env?.VITE_HOME_BG_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL))
		|| '/images/New hero section image.jpeg';
	// Allow quick testing of hero height via ?vh=56 (min-height in vh)
	const heroVh = Number(_sp?.get('vh') || (import.meta as any).env?.VITE_HOME_HERO_VH || 56);

	// Parallax state kept in refs for performance
	const scrollRef = useRef(0);
	const mouseRef = useRef({ x: 0, y: 0 });
	const rafRef = useRef<number | null>(null);
	const layer1Ref = useRef<HTMLDivElement | null>(null);
	const layer2Ref = useRef<HTMLDivElement | null>(null);
	const layer3Ref = useRef<HTMLDivElement | null>(null);
	const mediaBgRef = useRef<HTMLDivElement | null>(null);

	const kpis = mockData.kpis;

	// Blog preview (latest 3 from API) - optimized, limit already at 3
	const [blogPreview, setBlogPreview] = useState<Array<{id:number; title:string; excerpt?:string; featuredImage?:string; publishedAt?:string; category?:string; slug?:string;}>>([]);
	useEffect(() => {
		(async () => {
			try {
				const res = await apiService.get('/blog', { status: 'published', limit: 3, offset: 0 });
				const items = (res.posts || []).map((p: any) => ({
					id: Number(p.id),
					title: String(p.title || ''),
					excerpt: String(p.excerpt || ''),
					featuredImage: String(p.featured_image || ''),
					publishedAt: String(p.published_at || p.created_at || ''),
					category: String(p.category_name || p.category || 'General'),
					slug: String(p.slug || '')
				}));
				setBlogPreview(items);
			} catch (error: any) {
				console.error('Error fetching blog posts for landing page:', error);
				setBlogPreview([]);
			}
		})();
	}, []);

	useEffect(() => {
		const onScroll = () => { scrollRef.current = window.scrollY || 0; };
		const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('mousemove', onMove, { passive: true });

		const animate = () => {
			const sy = scrollRef.current;
			const mx = (mouseRef.current.x - window.innerWidth / 2) * 0.035;
			const my = (mouseRef.current.y - 300) * 0.02;
			const l1 = sy * 0.60;
			const l2 = sy * 1.15;
			const l3 = sy * 0.25;

			if (layer1Ref.current) layer1Ref.current.style.transform = `translate(${mx}px, ${l1}px)`;
			if (layer2Ref.current) layer2Ref.current.style.transform = `translate(${mx * -1}px, ${l2 * -1}px)`;
			if (layer3Ref.current) layer3Ref.current.style.transform = `translateY(${l3 * -1}px)`;
			if (mediaBgRef.current) mediaBgRef.current.style.transform = `translateY(${l3 * -1}px)`;

			rafRef.current = window.requestAnimationFrame(animate);
		};
		rafRef.current = window.requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('mousemove', onMove as any);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	const navClass = (name: string) => {
		const isActive = currentPage === name;
		return `hover:opacity-80 ${isActive ? 'text-[var(--color-primary-teal)] font-semibold' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]'}`;
	};

	return (
		<div className="min-h-screen bg-[var(--color-background-default)] text-[var(--color-text-primary)] relative">
			
			{/* Top nav (Giga.ai style - clean and minimal) */}
            {withHeader && (<header className="sticky top-0 z-40" style={{ 
              background: 'transparent',
            }}>
				{/* Desktop Header */}
				<div className={`max-w-screen-2xl mx-auto h-16 sm:h-20 flex items-center justify-between ${isMobile ? 'hidden' : 'flex'}`} style={{ flexWrap: 'nowrap', minWidth: 0, paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
					{/* Logo */}
					<a href="/" className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 'fit-content' }}>
						<img 
							src="/images/logo-light.png" 
							alt="Medarion" 
							className="h-8 sm:h-9"
							style={{
								filter: 'brightness(0) invert(1)', // Always white for header over dark hero background
							}}
						/>
					</a>
					
					{/* Navigation - Center */}
					<nav className="flex items-center gap-4 md:gap-6 lg:gap-8 text-sm text-white flex-shrink-0 mx-auto" style={{ fontSize: '14px', flex: '0 0 auto' }}>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap px-3 py-1.5" href="/about">About</a>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap px-3 py-1.5" href="/arion">Arion</a>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap px-3 py-1.5" href="/m-index">M-Index</a>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap px-3 py-1.5" href="#">Ergon</a>
					</nav>
					
					{/* Right side actions */}
					<div className="flex items-center gap-3 md:gap-4 flex-shrink-0" style={{ minWidth: 'fit-content' }}>
						<a 
							className="text-sm text-white hover:opacity-80 transition-opacity px-4 py-1.5 whitespace-nowrap" 
							href="/auth" 
							onClick={handleSignInClick}
						>
							{user && profile ? 'Dashboard' : 'Sign in'}
						</a>
						<a 
							className="px-5 sm:px-6 py-2 text-sm text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap" 
							href="/auth" 
							onClick={handleSignInClick}
						>
							Talk to us
						</a>
					</div>
				</div>

				{/* Mobile Header */}
				<div className={`max-w-screen-2xl mx-auto ${isMobile ? 'flex' : 'hidden'} flex-col gap-2`} style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '1rem', paddingRight: '1rem' }}>
					{/* Mobile Header Row 1: Hamburger + Logo + Actions */}
					<div className="flex items-center justify-between gap-2 w-full" style={{ flexWrap: 'nowrap' }}>
						{/* Left: Hamburger + Logo */}
						<div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 'fit-content' }}>
							<button 
								aria-label="Open menu" 
								className="flex items-center justify-center w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-colors"
								onClick={() => setMobileOpen(v => !v)}
							>
								{mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
							</button>
							<a href="/" className="flex items-center gap-2 flex-shrink-0">
								<img 
									src="/images/logo-light.png" 
									alt="Medarion" 
									className="h-7"
									style={{
										filter: 'brightness(0) invert(1)', // Always white for header over dark hero background
									}}
								/>
							</a>
						</div>

						{/* Right: Sign in */}
						<div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 'fit-content' }}>
							<a 
								className="px-3 py-1.5 text-sm text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 whitespace-nowrap"
								href="/auth" 
								onClick={handleSignInClick}
							>
								{user && profile ? 'Dashboard' : 'Sign in'}
							</a>
						</div>
					</div>

					{/* Mobile Breadcrumb */}
					{window.location.pathname !== '/' && (
						<div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ fontSize: '12px' }}>
							<a href="/" className="text-white/80 hover:opacity-80 transition-opacity whitespace-nowrap">Home</a>
							{window.location.pathname.split('/').filter(Boolean).map((seg, index, arr) => {
								const path = '/' + arr.slice(0, index + 1).join('/');
								const label = seg.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
								return (
									<React.Fragment key={path}>
										<span className="text-white/60 mx-1">/</span>
										{index === arr.length - 1 ? (
											<span className="text-white font-medium whitespace-nowrap">{label}</span>
										) : (
											<a href={path} className="text-white/80 hover:opacity-80 transition-opacity whitespace-nowrap">{label}</a>
										)}
									</React.Fragment>
								);
							})}
						</div>
					)}
				</div>

				{/* Mobile menu overlay - Cursor.com style */}
				{mobileOpen && isMobile && (
					<>
						<div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
						<div className="fixed top-16 left-3 right-3 z-50">
							<div
								className="rounded-2xl shadow-2xl"
								style={{
									background: 'rgba(0,0,0,0.95)',
									backdropFilter: 'blur(20px)',
									WebkitBackdropFilter: 'blur(20px)',
									border: '1px solid rgba(255,255,255,0.2)',
									boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
								}}
							>
								<div className="flex flex-col p-2">
									<a
										className="text-left py-3 px-4 rounded-xl transition-colors hover:bg-white/10 text-white font-normal"
										href="/about"
										onClick={(e) => { e.preventDefault(); setMobileOpen(false); window.location.replace('/about'); }}
										style={{ fontSize: '14px' }}
									>
										About
									</a>
									<a
										className="text-left py-3 px-4 rounded-xl transition-colors hover:bg-white/10 text-white font-normal"
										href="/arion"
										onClick={(e) => { e.preventDefault(); setMobileOpen(false); window.location.replace('/arion'); }}
										style={{ fontSize: '14px' }}
									>
										Arion
									</a>
									<a
										className="text-left py-3 px-4 rounded-xl transition-colors hover:bg-white/10 text-white font-normal"
										href="/m-index"
										onClick={(e) => { e.preventDefault(); setMobileOpen(false); window.location.replace('/m-index'); }}
										style={{ fontSize: '14px' }}
									>
										M-Index
									</a>
									<a
										className="text-left py-3 px-4 rounded-xl transition-colors hover:bg-white/10 text-white font-normal"
										href="#"
										onClick={(e) => { e.preventDefault(); setMobileOpen(false); }}
										style={{ fontSize: '14px' }}
									>
										Ergon
									</a>
									<div className="h-px my-1 mx-2 bg-white/20" />
									<a
										className="text-left py-3 px-4 rounded-xl transition-colors hover:bg-white/10 text-white font-medium"
										href="/auth"
										onClick={(e) => { e.preventDefault(); setMobileOpen(false); handleSignInClick(e); }}
										style={{ fontSize: '14px', fontWeight: 500 }}
									>
										{user && profile ? 'Dashboard' : 'Sign in'}
									</a>
								</div>
							</div>
						</div>
					</>
				)}
			</header>)}

			{/* Hero section - Giga.ai style */}
			<section
				className="relative overflow-hidden landing-hero"
				style={{
					backgroundImage: `url('${heroImageUrl}')`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
					backgroundAttachment: 'fixed',
				}}
			>
				{/* Dark overlay - Giga.ai style */}
				<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
				
				{/* Additional darkening filter */}
				<div className="absolute inset-0 bg-black/20" />
				
				{/* Bottom transition - Smooth blend */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.00) 60%, rgba(0,0,0,0.10) 75%, rgba(0,0,0,0.25) 85%, rgba(255,255,255,0.20) 92%, rgba(255,255,255,0.50) 96%, rgba(255,255,255,0.80) 98%, var(--color-background-default) 100%)'
					}}
				/>
				
				{/* Hero Content - Centered like Giga.ai */}
				<div className="relative z-10 w-full flex items-center justify-center landing-hero-content" style={{ minHeight: '100vh' }}>
					<div className="text-center max-w-5xl mx-auto px-6 md:px-8 lg:px-12 py-24 md:py-32 lg:py-40">
						{/* Small rounded badge - Giga.ai style */}
						<div className="inline-flex items-center justify-center mb-8 md:mb-10">
							<div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
								<span className="text-xs sm:text-sm text-white/90 font-medium" style={{ 
									fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									letterSpacing: '0.02em'
								}}>
									Your AI Gateway to Africa
								</span>
							</div>
						</div>
						
						{/* Main heading - Large like Giga.ai, two lines */}
						<h1 className="text-white mb-10 md:mb-12 lg:mb-16 font-normal" style={{ 
							fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
							fontSize: 'clamp(2rem, 6vw, 4rem)',
							letterSpacing: '-0.02em',
							lineHeight: '1.2',
							fontWeight: 400,
							maxWidth: '900px',
							marginLeft: 'auto',
							marginRight: 'auto',
							paddingLeft: '1rem',
							paddingRight: '1rem'
						}}>
							Gain a deeper understanding of Africa's ecosystem and transformation
						</h1>
						
						{/* CTA Buttons - Giga.ai style */}
						<div className="mt-10 md:mt-12 lg:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
							<button className="w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 text-base sm:text-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} onClick={onGetStarted}>
								Get started <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
							<a className="w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 border-2 border-white/40 text-white rounded-full font-medium hover:bg-white/10 hover:border-white/60 transition-all backdrop-blur-sm inline-flex items-center justify-center text-base sm:text-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} href="/pricing" onClick={(e)=>{ e.preventDefault(); window.location.replace('/pricing'); }}>See pricing</a>
						</div>
					</div>
				</div>
			</section>

			{/* Section 01 - AI Co-pilot for Deals & Funding */}
			<section 
				className="py-24 md:py-32 lg:py-40 border-t border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
				}}
			>
				<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
						{/* Left: Text Content */}
						<div className="space-y-6 md:space-y-7 order-1 lg:order-1 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">01</div>
							<h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								AI Co-pilot for Deals & Funding
							</h3>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
								Our AI co-pilot helps you gain a deeper understanding of deals and funding across Africa, with clear insights and executive-level summaries.
							</p>
							<div className="flex flex-wrap gap-2 sm:gap-2.5 pt-3 md:pt-5">
								<span className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md whitespace-nowrap">Due Diligence</span>
								<span className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md whitespace-nowrap">Valuation</span>
								<span className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md whitespace-nowrap">Pitch Deck</span>
								<span className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md whitespace-nowrap">Investor Matching</span>
								<span className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md whitespace-nowrap">Market Risk</span>
							</div>
						</div>
						{/* Right: Visual Placeholder */}
						<div className="relative order-2 lg:order-2 lg:col-span-3">
							<div className="aspect-[4/3] flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden rounded-2xl shadow-2xl border border-[var(--color-divider-gray)]/20">
								<img 
									src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80" 
									alt="AI Co-pilot for Deals & Funding - Data Analytics Dashboard"
									className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 02 - Macro Insights Across Africa */}
			<section 
				className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
				}}
			>
				<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
						{/* Left: Visual Placeholder */}
						<div className="relative order-1 lg:order-1 lg:col-span-3">
							<div className="aspect-[4/3] flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden rounded-2xl shadow-2xl border border-[var(--color-divider-gray)]/20">
								<img 
									src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop&q=80" 
									alt="Macro Insights - Economic Growth and Market Analysis Visualization"
									className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
						</div>
						{/* Right: Text Content */}
						<div className="space-y-6 md:space-y-7 order-2 lg:order-2 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">02</div>
							<h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Macro Insights Across Africa
							</h3>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
								Clear macro insights across Africa compare countries and uncover investment opportunities.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Section 03 - Clinical Trial Ecosystem */}
			<section 
				className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
				}}
			>
				<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
						{/* Left: Text Content */}
						<div className="space-y-6 md:space-y-7 order-1 lg:order-1 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">03</div>
							<h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Clinical Trial Ecosystem
							</h3>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
								Explore Africa's clinical trial ecosystem with precision, map trial sites, assess regulatory pathways, and identify key investigators.
							</p>
							<div className="flex flex-wrap gap-3 sm:gap-3.5 pt-3 md:pt-5">
								<span className="px-4 py-2 text-xs sm:text-sm text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md">Country</span>
								<span className="px-4 py-2 text-xs sm:text-sm text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md">Phase</span>
								<span className="px-4 py-2 text-xs sm:text-sm text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md">Indication</span>
								<span className="px-4 py-2 text-xs sm:text-sm text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md">Sponsor</span>
								<span className="px-4 py-2 text-xs sm:text-sm text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md">Site</span>
								<span className="px-4 py-2 text-xs sm:text-sm text-[var(--color-text-secondary)] bg-[var(--color-background-surface)] rounded-md">Investigator</span>
							</div>
						</div>
						{/* Right: Visual Placeholder */}
						<div className="relative order-2 lg:order-2 lg:col-span-3">
							<div className="aspect-[4/3] flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden rounded-2xl shadow-2xl border border-[var(--color-divider-gray)]/20">
								<img 
									src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80" 
									alt="Clinical Trial Ecosystem - Research and Medical Studies"
									className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 04 - Real-time Epidemiology */}
			<section 
				className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
				}}
			>
				<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
						{/* Left: Visual Placeholder (Hiring Module) */}
						<div className="relative order-1 lg:order-1 lg:col-span-3">
							<div className="relative aspect-[4/3] min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden rounded-2xl shadow-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
								<img 
									src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80" 
									alt="Real-time Epidemiology - Disease Intelligence and Health Monitoring"
									className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										const img = e.currentTarget;
										img.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
						</div>
						{/* Right: Text Content */}
						<div className="space-y-6 md:space-y-7 order-2 lg:order-2 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">04</div>
							<h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Real-time Epidemiology
							</h3>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
								AI for real-time epidemiology, unlocking Africa's disease intelligence.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Section 05 - Report & Advisory */}
			<section 
				className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
				}}
			>
				<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
						{/* Left: Text Content */}
						<div className="space-y-6 md:space-y-7 order-1 lg:order-1 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">05</div>
							<h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Report & Advisory
							</h3>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
								The Medarion team provides on-demand reports and advisory services across industries and countries covering topics ranging from funding and deals to clinical trials and much more.
							</p>
						</div>
						{/* Right: Report Thumbnails */}
						<div className="relative order-2 lg:order-2 lg:col-span-3">
							<div className="grid grid-cols-2 gap-4 md:gap-6">
								<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 relative group">
									<img 
										src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80" 
										alt="2024 Healthcare Series A Funding Trends" 
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
										loading="lazy"
										onError={handleImageError}
									/>
								</div>
								<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 relative group">
									<img 
										src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80" 
										alt="2023 Series C Trends Across Africa" 
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
										loading="lazy"
										onError={handleImageError}
									/>
								</div>
								<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 relative group">
									<img 
										src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80" 
										alt="2021 Deals in Africa: Fintech Insights & Trends" 
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
										loading="lazy"
										onError={handleImageError}
									/>
								</div>
								<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 relative group">
									<img 
										src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80" 
										alt="2023 Clinical Trial Insights in Nigeria" 
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
										loading="lazy"
										onError={handleImageError}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 06 - Arion, M-Index & Ergon */}
			<section 
				className="py-16 md:py-20 lg:py-24 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
				}}
			>
				<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
						{/* Arion */}
						<div className="p-0 cursor-pointer transition-opacity duration-200 hover:opacity-80 flex flex-col h-full" onClick={() => navigate('/arion')}>
							<div className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-xl shadow-lg aspect-[4/3] border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
								<img 
									src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=900&fit=crop&q=80" 
									alt="Arion - Healthcare Insights and Analysis"
									className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
									loading="lazy"
									onError={(e) => {
										const img = e.currentTarget;
										img.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
							<div className="mt-1 mb-3 sm:mb-4 font-semibold text-base sm:text-lg md:text-xl text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)] transition-colors">Arion</div>
							<p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 mb-4 sm:mb-5 leading-relaxed flex-grow min-h-[3.5rem]">
								Healthcare insights and analysis.
							</p>
						</div>
						{/* M-Index */}
						<div className="p-0 cursor-pointer transition-opacity duration-200 hover:opacity-80 flex flex-col h-full" onClick={() => navigate('/m-index')}>
							<div className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-xl shadow-lg aspect-[4/3] border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
								<img 
									src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80" 
									alt="M-Index - Healthcare Terms Database and Medical Glossary"
									className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
									loading="lazy"
									onError={(e) => {
										const img = e.currentTarget;
										img.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
							<div className="mt-1 mb-3 sm:mb-4 font-semibold text-base sm:text-lg md:text-xl text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)] transition-colors">M-Index</div>
							<p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 mb-4 sm:mb-5 leading-relaxed flex-grow min-h-[3.5rem]">
								Master the Terms. Maximize the Impact.
							</p>
						</div>
						{/* Ergon */}
						<div className="p-0 cursor-pointer transition-opacity duration-200 hover:opacity-80 flex flex-col h-full" onClick={() => navigate('/ergon')}>
							<div className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-xl shadow-lg aspect-[4/3] border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
								<img 
									src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80" 
									alt="Ergon - AI-Driven Recruitment Platform for African Talent"
									className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
									loading="lazy"
									onError={(e) => {
										const img = e.currentTarget;
										img.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80';
									}}
								/>
							</div>
							<div className="mt-1 mb-3 sm:mb-4 font-semibold text-base sm:text-lg md:text-xl text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)] transition-colors">Ergon</div>
							<p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 mb-4 sm:mb-5 leading-relaxed flex-grow min-h-[3.5rem]">
								AI-driven recruitment copilot to help you hire the best talent across Africa.
							</p>
						</div>
					</div>
				</div>
			</section>

            {/* Blog Preview */}
            <section 
				className="py-24 md:py-32 lg:py-40 transition-colors duration-500"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
				}}
			>
                <div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 md:mb-16 gap-4">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-text-primary)]">From Arion</h2>
                        <a className="btn-outline btn-sm inline-flex items-center justify-center" href="/arion" onClick={(e)=>{ e.preventDefault(); window.location.replace('/arion'); }}>View all</a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
                    {(blogPreview && blogPreview.length ? blogPreview : []).map((p) => (
                        <div 
                            key={p.id} 
                            className="p-0 cursor-pointer transition-opacity duration-200 hover:opacity-80 flex flex-col h-full"
                            onClick={() => navigate(`/arion/${p.slug || p.id}`)}
                        >
                            <div className="aspect-[16/9] rounded-xl bg-[var(--color-background-default)] mb-4 sm:mb-5 md:mb-6 overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20">
                                <img
                                    src={getBlogPostImage(p.featuredImage, p.id, p.category || 'General')}
                                    alt={p.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => handleImageError(e, p.id, p.category || 'General')}
                                />
                            </div>
                            <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-2 sm:mb-2.5">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}</div>
                            <div className="mt-1 mb-3 sm:mb-4 font-semibold line-clamp-2 text-base sm:text-lg text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)] transition-colors">{p.title}</div>
                            {p.excerpt ? <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 mb-4 sm:mb-5 line-clamp-3 leading-relaxed flex-grow">{p.excerpt}</p> : <div className="flex-grow"></div>}
                            <div className="mt-auto pt-3">
                                <button 
                                    className="btn-outline btn-sm inline-flex items-center justify-center" 
                                    onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); navigate(`/arion/${p.slug || p.id}`); }}
                                >
                                    Read more
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!blogPreview || blogPreview.length === 0) && (
                      <div className="text-sm text-[var(--color-text-secondary)]">No blog posts yet.</div>
                    )}
                    </div>
                </div>
            </section>

			{/* Professional Footer */}
			{withFooter && (<footer 
				className="relative border-t transition-colors duration-500 rounded-t-3xl"
				style={{ 
					backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4',
					borderColor: theme === 'dark' 
						? 'var(--color-divider-gray)' 
						: 'rgba(0, 0, 0, 0.2)'
				}}
			>
				<div className="w-full px-6 md:px-8 lg:px-12 xl:px-16 py-16 md:py-20 lg:py-24">
					<div className="footer-grid gap-4 sm:gap-5 md:gap-6 lg:gap-8 items-start">
						{/* Brand Section - Widest */}
						<div className="space-y-5 md:space-y-6 flex flex-col h-full items-center text-center">
							<div>
								<img 
									src="/images/logo-light.png" 
									alt="Medarion" 
									className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto mx-auto"
									style={{
										filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
									}}
								/>
							</div>
							<h3 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-text-primary)] leading-tight max-w-md">
								Africa's Most Advanced AI Insight Platform
							</h3>
							<p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-md">
								Empowering African healthcare innovation through comprehensive data intelligence.
							</p>
							
							{/* Social Links */}
							<div className="flex items-center justify-center gap-3 pt-2 mt-auto">
								<a 
									href="#" 
									aria-label="Twitter" 
									className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
								>
									<Twitter className="w-5 h-5"/>
								</a>
								<a 
									href="#" 
									aria-label="LinkedIn" 
									className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
								>
									<Linkedin className="w-5 h-5"/>
								</a>
								<a 
									href="#" 
									aria-label="GitHub" 
									className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
								>
									<Github className="w-5 h-5"/>
								</a>
							</div>
						</div>

						{/* Data */}
						<div className="space-y-4 pt-0 md:pt-1 flex flex-col h-full">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Data</h4>
							<ul className="space-y-3 flex-grow">
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('companies')}
									>
										Companies
									</button>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('deals')}
									>
										Deals
									</button>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('grants')}
									>
										Grants
									</button>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('clinical-trials')}
									>
										Clinical Trials
									</button>
								</li>
							</ul>
						</div>

						{/* Resources */}
						<div className="space-y-4 pt-0 md:pt-1 flex flex-col h-full">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Resources</h4>
							<ul className="space-y-3 flex-grow">
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('blog')}
									>
										Blog
									</button>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('glossary')}
									>
										Glossary
									</button>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('nationpulse')}
									>
										Nation Pulse
									</button>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('ergon')}
									>
										Ergon
									</button>
								</li>
								<li>
									<a 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										href="#"
									>
										Help Center
									</a>
								</li>
							</ul>
						</div>

						{/* Company */}
						<div className="space-y-4 pt-0 md:pt-1 flex flex-col h-full">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Company</h4>
							<ul className="space-y-3 flex-grow">
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('about')}
									>
										About
									</button>
								</li>
								<li>
									<a 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										href="#"
									>
										Careers
									</a>
								</li>
								<li>
									<button 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										onClick={() => onNavigate('contact')}
									>
										Contact
									</button>
								</li>
								<li>
									<a 
										className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
										href="#"
									>
										Press
									</a>
								</li>
							</ul>
						</div>

						{/* Newsletter Section - Last Column, Biggest */}
						<div className="space-y-4 pt-0 md:pt-1 flex flex-col h-full">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Stay Updated</h4>
							<p className="text-sm text-[var(--color-text-secondary)]">
								Get weekly insights on African healthcare markets delivered to your inbox.
							</p>
							<form 
								className="flex flex-col gap-2 flex-grow" 
								onSubmit={async (e)=>{
									e.preventDefault();
									const form = e.target as HTMLFormElement;
									const input = form.querySelector('input[type="email"]') as HTMLInputElement;
									if (input && input.value && !isSubscribing) {
										const email = input.value.trim();
										setIsSubscribing(true);
										setNewsletterStatus({ type: null, message: '' });
										
										try {
											const response = await apiService.post('/newsletter/subscribe', {
												email: email,
												source: 'landing_page'
											});
											
											if (response.success) {
												setNewsletterStatus({ 
													type: 'success', 
													message: response.message || 'Successfully subscribed to newsletter!' 
												});
												input.value = '';
												// Clear success message after 5 seconds
												setTimeout(() => {
													setNewsletterStatus({ type: null, message: '' });
												}, 5000);
											} else {
												throw new Error(response.error || 'Failed to subscribe');
											}
										} catch (error: any) {
											setNewsletterStatus({ 
												type: 'error', 
												message: error.message || 'Failed to subscribe. Please try again.' 
											});
											// Clear error message after 5 seconds
											setTimeout(() => {
												setNewsletterStatus({ type: null, message: '' });
											}, 5000);
										} finally {
											setIsSubscribing(false);
										}
									}
								}}
							>
								<input 
									type="email" 
									className="w-full px-4 py-2.5 border border-[var(--color-divider-gray)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed" 
									placeholder="Enter your email" 
									aria-label="Email" 
									required
									disabled={isSubscribing}
								/>
								{newsletterStatus.type && (
									<div className={`p-3 rounded text-sm ${
										newsletterStatus.type === 'success'
											? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
											: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
									}`}>
										{newsletterStatus.message}
									</div>
								)}
								<button 
									type="submit"
									className="w-full px-6 py-2.5 rounded font-medium transition-all text-sm newsletter-subscribe-btn disabled:opacity-50 disabled:cursor-not-allowed"
									style={{
										backgroundColor: 'var(--color-primary-teal)',
										color: theme === 'dark' ? '#000000' : '#FFFFFF',
										WebkitTextFillColor: theme === 'dark' ? '#000000' : '#FFFFFF',
										caretColor: theme === 'dark' ? '#000000' : '#FFFFFF'
									} as React.CSSProperties}
									disabled={isSubscribing}
								>
									{isSubscribing ? 'Subscribing...' : 'Subscribe'}
								</button>
							</form>
							<p className="text-xs text-[var(--color-text-secondary)] mt-auto">
								Your data will be processed in accordance with our Privacy Policy and Terms of Service. You may opt out of receiving communications at any time.
							</p>
						</div>
					</div>

					{/* Bottom bar */}
					<div 
						className="mt-12 md:mt-14 lg:mt-16 pt-6 md:pt-8 lg:pt-10 border-t"
						style={{
							borderColor: theme === 'dark' 
								? 'var(--color-divider-gray)' 
								: 'rgba(0, 0, 0, 0.2)'
						}}
					>
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-5 lg:gap-6">
							<div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
								<CheckCircle2 className="w-4 h-4 text-green-500"/>
								<span>All systems operational</span>
							</div>
							<div className="flex flex-wrap items-center gap-4 text-xs">
								<button 
									onClick={() => onNavigate('privacy')} 
									className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
								>
									Privacy
								</button>
								<a 
									className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
									href="#"
								>
									Terms
								</a>
								<a 
									className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
									href="#"
								>
									DPA
								</a>
								<a 
									className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" 
									href="#"
								>
									Subprocessors
								</a>
							</div>
							<div className="text-xs text-[var(--color-text-secondary)]">
								© {new Date().getFullYear()} Medarion. All rights reserved.
							</div>
						</div>
					</div>
				</div>
			</footer>)}
		</div>
	);
};

export default CluelyLanding;


