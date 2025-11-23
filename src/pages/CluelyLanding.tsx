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
				<div className={`page-container h-16 flex items-center justify-between ${isMobile ? 'hidden' : 'flex'}`} style={{ flexWrap: 'nowrap', minWidth: 0 }}>
					{/* Logo */}
					<a href="/" className="flex items-center gap-2 flex-shrink-0">
						<img 
							src="/images/logo-light.png" 
							alt="Medarion" 
							className="h-8"
							style={{
								filter: 'brightness(0) invert(1)', // Always white for header over dark hero background
							}}
						/>
					</a>
					
					{/* Navigation - Center */}
					<nav className="flex items-center gap-4 text-sm text-white flex-shrink-0" style={{ fontSize: '14px' }}>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap" href="/about">About</a>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap" href="/arion">Arion</a>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap" href="/m-index">M-Index</a>
                        <a className="hover:opacity-80 transition-opacity whitespace-nowrap" href="#">Ergon</a>
					</nav>
					
					{/* Right side actions */}
					<div className="flex items-center gap-3 flex-shrink-0">
						<a 
							className="text-sm text-white hover:opacity-80 transition-opacity" 
							href="/auth" 
							onClick={handleSignInClick}
						>
							{user && profile ? 'Dashboard' : 'Sign in'}
						</a>
						<a 
							className="px-4 py-2 text-sm text-white border border-white/30 rounded-md hover:bg-white/10 transition-colors" 
							href="/auth" 
							onClick={handleSignInClick}
						>
							Talk to us
						</a>
					</div>
				</div>

				{/* Mobile Header */}
				<div className={`page-container ${isMobile ? 'flex' : 'hidden'} flex-col gap-2`} style={{ paddingTop: '8px', paddingBottom: '8px' }}>
					{/* Mobile Header Row 1: Hamburger + Logo + Actions */}
					<div className="flex items-center justify-between gap-2 w-full" style={{ flexWrap: 'nowrap' }}>
						{/* Left: Hamburger + Logo */}
						<div className="flex items-center gap-2 flex-shrink-0">
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
						<div className="flex items-center gap-2 flex-shrink-0">
							<a 
								className="px-3 py-1.5 text-sm text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
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
					<div className="text-center max-w-5xl mx-auto px-4 sm:px-6">
						{/* Small rounded badge - Giga.ai style */}
						<div className="inline-flex items-center justify-center mb-6 sm:mb-8">
							<div className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
								<span className="text-xs sm:text-sm text-white/90 font-medium" style={{ 
									fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									letterSpacing: '0.02em'
								}}>
									Your AI Gateway to Africa
								</span>
							</div>
						</div>
						
						{/* Main heading - Large like Giga.ai, two lines */}
						<h1 className="text-white mb-8 sm:mb-10 font-normal" style={{ 
							fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
							fontSize: 'clamp(2rem, 6vw, 4rem)',
							letterSpacing: '-0.02em',
							lineHeight: '1.2',
							fontWeight: 400,
							maxWidth: '900px',
							marginLeft: 'auto',
							marginRight: 'auto'
						}}>
							Gain a deeper understanding of Africa's ecosystem and transformation
						</h1>
						
						{/* CTA Buttons - Giga.ai style */}
						<div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
							<button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-3.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} onClick={onGetStarted}>
								Get started <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
							<a className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-3.5 border-2 border-white/40 text-white rounded-full font-medium hover:bg-white/10 hover:border-white/60 transition-all backdrop-blur-sm inline-flex items-center justify-center text-base sm:text-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} href="/pricing" onClick={(e)=>{ e.preventDefault(); window.location.replace('/pricing'); }}>See pricing</a>
						</div>
					</div>
				</div>
			</section>

			{/* Section 01 - AI Co-pilot for Deals & Funding - Large spacious style */}
			<section className="py-20 sm:py-28 md:py-36 lg:py-40">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 sm:gap-16 md:gap-20 lg:gap-24">
						{/* Left: Text Content */}
						<div className="lg:col-span-2 space-y-4 sm:space-y-5">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">01</div>
							<h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								AI Co-pilot for Deals & Funding
							</h3>
							<p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">
								Our AI co-pilot helps you gain a deeper understanding of deals and funding across Africa, with clear insights and executive-level summaries.
							</p>
							<div className="flex flex-wrap gap-2 sm:gap-3 pt-3">
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Due Diligence</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Valuation</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Pitch Deck</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Investor Matching</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Market Risk</span>
							</div>
						</div>
						{/* Right: Overlapping Cards Design */}
						<div className="relative lg:col-span-3 min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
							<div className="relative w-full h-full" style={{
								background: 'linear-gradient(180deg, #f0f9f4 0%, #e0f2e9 100%)'
							}}>
								{/* Card 1 - Front */}
								<div className="absolute top-0 left-0 w-64 sm:w-72 md:w-80 bg-white rounded-lg shadow-lg p-6 transform rotate-[-3deg] z-10">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center">
												<Shield className="w-5 h-5 text-white" />
											</div>
											<h4 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base">Due Diligence</h4>
										</div>
										<div className="px-2 py-1 bg-[var(--color-primary-teal)] text-white text-xs font-medium rounded">70</div>
									</div>
									<p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
										A comprehensive overview of your current financial standing and future projections.
									</p>
									<button className="w-full px-4 py-2 bg-[var(--color-primary-teal)] text-white rounded-md text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
										Launch <ChevronRight className="w-4 h-4" />
									</button>
								</div>

								{/* Card 2 - Behind */}
								<div className="absolute top-8 left-8 sm:left-12 md:left-16 w-64 sm:w-72 md:w-80 bg-white rounded-lg shadow-lg p-6 transform rotate-[2deg] z-9">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center">
												<LineChart className="w-5 h-5 text-white" />
											</div>
											<h4 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base">Valuation</h4>
										</div>
										<div className="px-2 py-1 bg-[var(--color-primary-teal)] text-white text-xs font-medium rounded">80</div>
									</div>
									<p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
										Provides real-time insights into market trends and investment opportunities.
									</p>
									<button className="w-full px-4 py-2 bg-[var(--color-primary-teal)] text-white rounded-md text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
										Launch <ChevronRight className="w-4 h-4" />
									</button>
								</div>

								{/* Card 3 - Further Behind */}
								<div className="absolute top-16 left-16 sm:left-24 md:left-32 w-64 sm:w-72 md:w-80 bg-white rounded-lg shadow-lg p-6 transform rotate-[-1deg] z-8">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center">
												<Database className="w-5 h-5 text-white" />
											</div>
											<h4 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base">Pitch Deck</h4>
										</div>
										<div className="px-2 py-1 bg-[var(--color-primary-teal)] text-white text-xs font-medium rounded">90</div>
									</div>
									<p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
										Advanced analytics and reporting tools for data-driven decision making.
									</p>
									<div className="flex gap-2">
										<button className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
											Edit
										</button>
										<button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
											View
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 02 - Macro Insights Across Africa - Large spacious style */}
			<section className="py-20 sm:py-28 md:py-36 lg:py-40">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 sm:gap-16 md:gap-20 lg:gap-24">
						{/* Left: Visual Placeholder */}
						<div className="relative order-1 lg:order-1 lg:col-span-3">
							<div className="aspect-[4/3] flex items-center justify-center min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-6xl sm:text-7xl md:text-8xl mb-4">📈</div>
									<p className="text-base sm:text-lg md:text-xl">Economic Growth Visual</p>
								</div>
							</div>
						</div>
						{/* Right: Text Content */}
						<div className="space-y-4 sm:space-y-5 order-2 lg:order-2 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">02</div>
							<h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Macro Insights Across Africa
							</h3>
							<p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">
								Clear macro insights across Africa compare countries and uncover investment opportunities.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Section 03 - Clinical Trial Ecosystem - Large spacious style */}
			<section className="py-20 sm:py-28 md:py-36 lg:py-40">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 sm:gap-16 md:gap-20 lg:gap-24">
						{/* Left: Text Content */}
						<div className="lg:col-span-2 space-y-4 sm:space-y-5">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">03</div>
							<h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Clinical Trial Ecosystem
							</h3>
							<p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">
								Explore Africa's clinical trial ecosystem with precision, map trial sites, assess regulatory pathways, and identify key investigators.
							</p>
							<div className="flex flex-wrap gap-2 sm:gap-3 pt-3">
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Country</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Phase</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Indication</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Sponsor</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Site</span>
								<span className="px-3 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">Investigator</span>
							</div>
						</div>
						{/* Right: Visual Placeholder */}
						<div className="relative lg:col-span-3">
							<div className="aspect-[4/3] flex items-center justify-center min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-6xl sm:text-7xl md:text-8xl mb-4">🔬</div>
									<p className="text-base sm:text-lg md:text-xl">Clinical Trial Filters</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 04 - Real-time Epidemiology - Large spacious style */}
			<section className="py-20 sm:py-28 md:py-36 lg:py-40">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 sm:gap-16 md:gap-20 lg:gap-24">
						{/* Left: Visual Placeholder */}
						<div className="relative order-1 lg:order-1 lg:col-span-3">
							<div className="aspect-[4/3] flex items-center justify-center min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-6xl sm:text-7xl md:text-8xl mb-4">🌍</div>
									<p className="text-base sm:text-lg md:text-xl">Epidemiology Visual</p>
								</div>
							</div>
						</div>
						{/* Right: Text Content */}
						<div className="space-y-4 sm:space-y-5 order-2 lg:order-2 lg:col-span-2">
							<div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">04</div>
							<h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
								Real-time Epidemiology
							</h3>
							<p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">
								AI for real-time epidemiology, unlocking Africa's disease intelligence.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Section 05 - M-Index & Ergon Side by Side */}
			<section className="py-20 sm:py-28 md:py-36 lg:py-40 relative overflow-hidden">
				<div className="max-w-7xl mx-auto relative z-10 px-6 sm:px-8 md:px-12 lg:px-16">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 md:gap-20 lg:gap-24">
						{/* Left: Ergon */}
						<div className="space-y-8">
							<div className="p-8 sm:p-12 md:p-16 min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex flex-col">
								<div className="flex-1 flex items-center justify-center mb-8">
									<div className="text-center text-[var(--color-text-secondary)]">
										<div className="text-7xl sm:text-8xl md:text-9xl mb-6">💼</div>
										<p className="text-base sm:text-lg md:text-xl font-medium">Ergon Screenshot</p>
										<p className="text-sm sm:text-base mt-2 opacity-60">Image placeholder</p>
									</div>
								</div>
								<div className="space-y-6">
									<h3 className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text-primary)] tracking-tight">Ergon</h3>
									<p className="text-lg sm:text-xl md:text-2xl text-[var(--color-text-secondary)] leading-relaxed">
										AI-driven recruitment copilot to help you hire the best talent across Africa.
									</p>
								</div>
							</div>
						</div>
						{/* Right: M-Index */}
						<div className="space-y-8">
							<div className="p-8 sm:p-12 md:p-16 min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex flex-col">
								<div className="flex-1 flex items-center justify-center mb-8">
									<div className="text-center text-[var(--color-text-secondary)]">
										<div className="text-7xl sm:text-8xl md:text-9xl mb-6">📚</div>
										<p className="text-base sm:text-lg md:text-xl font-medium">M-Index Screenshot</p>
										<p className="text-sm sm:text-base mt-2 opacity-60">Image placeholder</p>
									</div>
								</div>
								<div className="space-y-6">
									<h3 className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text-primary)] tracking-tight">M-Index</h3>
									<p className="text-lg sm:text-xl md:text-2xl text-[var(--color-text-secondary)] leading-relaxed">
										Master the Terms. Maximize the Impact
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

            {/* Blog Preview */}
            <section className="page-container section py-12 sm:py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
                        <h2 className="text-2xl sm:text-3xl font-semibold">From Arion</h2>
                        <a className="btn-outline btn-sm inline-flex items-center justify-center" href="/arion" onClick={(e)=>{ e.preventDefault(); window.location.replace('/arion'); }}>View all</a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {(blogPreview && blogPreview.length ? blogPreview : []).map((p) => (
                        <div 
                            key={p.id} 
                            className="p-4 cursor-pointer transition-opacity duration-200 hover:opacity-80"
                            onClick={() => navigate(`/arion/${p.slug || p.id}`)}
                        >
                            <div className="aspect-[16/9] rounded-md bg-[var(--color-background-default)] mb-3 overflow-hidden">
                                <img
                                    src={getBlogPostImage(p.featuredImage, p.id, p.category || 'General')}
                                    alt={p.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => handleImageError(e, p.id, p.category || 'General')}
                                />
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}</div>
                            <div className="mt-1 font-semibold line-clamp-2 text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)] transition-colors">{p.title}</div>
                            {p.excerpt ? <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-3">{p.excerpt}</p> : null}
                            <div className="mt-3">
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
			{withFooter && (<footer className="relative border-t border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
				<div className="page-container py-12 sm:py-16 md:py-20">
					<div className="footer-grid">
						{/* Brand Section - Widest */}
						<div className="space-y-6">
							<div className="flex items-center gap-3">
								<img 
									src="/images/logo-light.png" 
									alt="Medarion" 
									className="h-10 sm:h-12"
									style={{
										filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
									}}
								/>
							</div>
							<p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
								African healthcare market data and AI assistance to keep you prepared on every call.
							</p>
							
							{/* Social Links */}
							<div className="flex items-center gap-3">
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
						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Data</h4>
							<ul className="space-y-3">
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
						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Resources</h4>
							<ul className="space-y-3">
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
						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Company</h4>
							<ul className="space-y-3">
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
						<div className="space-y-4">
							<h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Stay updated</h4>
							<p className="text-sm text-[var(--color-text-secondary)]">
								Get the latest updates and insights delivered to your inbox.
							</p>
							<form 
								className="flex flex-col gap-2" 
								onSubmit={(e)=>{
									e.preventDefault();
									const form = e.target as HTMLFormElement;
									const input = form.querySelector('input[type="email"]') as HTMLInputElement;
									if (input && input.value) {
										// TODO: Integrate with newsletter API
										alert('Thank you for subscribing!');
										input.value = '';
									}
								}}
							>
								<input 
									type="email" 
									className="w-full px-4 py-2.5 border border-[var(--color-divider-gray)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] text-sm rounded" 
									placeholder="Enter your email" 
									aria-label="Email" 
									required
								/>
								<button 
									type="submit"
									className="w-full px-6 py-2.5 bg-[var(--color-primary-teal)] text-white rounded font-medium hover:opacity-90 transition-opacity text-sm"
								>
									Subscribe
								</button>
							</form>
							<p className="text-xs text-[var(--color-text-secondary)]">
								We'll email occasional updates. Unsubscribe anytime.
							</p>
						</div>
					</div>

					{/* Bottom bar */}
					<div className="mt-12 pt-8 border-t border-[var(--color-divider-gray)]">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
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


