import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
				<div className="page-container h-16 flex items-center justify-between">
					{/* Logo */}
					<a href="/" className="flex items-center gap-2">
						<img 
							src="/images/logo-light.png" 
							alt="Medarion" 
							className="h-8"
							style={{
								filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
							}}
						/>
					</a>
					
					{/* Navigation - Center */}
					<nav className="flex items-center gap-8 text-sm text-white">
                        <a className="hover:opacity-80 transition-opacity" href="/about">About</a>
                        <a className="hover:opacity-80 transition-opacity" href="/arion">Arion</a>
                        <a className="hover:opacity-80 transition-opacity" href="/m-index">M-Index</a>
                        <a className="hover:opacity-80 transition-opacity" href="#">Ergon</a>
					</nav>
					
					{/* Right side actions */}
					<div className="flex items-center gap-3">
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
						<button 
							className="md:hidden text-white" 
							onClick={() => setMobileOpen(v => !v)}
						>
							{mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
						</button>
					</div>
				</div>
				{/* Mobile menu */}
				{mobileOpen && (
					<div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10">
						<div className="page-container py-4 flex flex-col gap-3 text-sm text-white">
                            <a className="hover:opacity-80" href="/about" onClick={(e)=>{ e.preventDefault(); setMobileOpen(false); window.location.replace('/about'); }}>About</a>
                            <a className="hover:opacity-80" href="/arion" onClick={(e)=>{ e.preventDefault(); setMobileOpen(false); window.location.replace('/arion'); }}>Arion</a>
                            <a className="hover:opacity-80" href="/m-index" onClick={(e)=>{ e.preventDefault(); setMobileOpen(false); window.location.replace('/m-index'); }}>M-Index</a>
                            <a className="hover:opacity-80" href="#" onClick={(e)=>{ e.preventDefault(); setMobileOpen(false); }}>Ergon</a>
							<div className="pt-3 border-t border-white/10 flex flex-col gap-2">
								<a className="hover:opacity-80" href="/auth" onClick={(e)=>{ e.preventDefault(); setMobileOpen(false); handleSignInClick(e); }}>Sign in</a>
								<a className="px-4 py-2 text-center border border-white/30 rounded-md hover:bg-white/10" href="/auth" onClick={(e)=>{ e.preventDefault(); setMobileOpen(false); handleSignInClick(e); }}>Talk to us</a>
							</div>
						</div>
					</div>
				)}
			</header>)}

			{/* Hero section - with background image */}
			<section
				className="relative overflow-hidden"
				style={{
					minHeight: `min(100vh, ${Math.max(32, Math.min(90, heroVh))}vh)`,
					backgroundImage: `url('${heroImageUrl}')`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
					marginTop: '-100px',
					marginLeft: '-50vw',
					marginRight: '-50vw',
					left: '50%',
					right: '50%',
					width: '100vw',
					paddingTop: '220px',
					position: 'relative',
				}}
			>
				{/* Subtle dark overlay */}
				<div className="absolute inset-0 bg-black/8" />
				
				{/* Bottom transition */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.00) 75%, rgba(255,255,255,0.20) 85%, rgba(255,255,255,0.60) 95%, var(--color-background-default) 100%)'
					}}
				/>
				
				{/* Hero Content */}
				<div className="relative z-10 page-container flex items-center justify-center min-h-[70vh] pb-32 md:pb-40">
					<div className="text-center max-w-5xl mx-auto px-4">
						{/* Main heading - Bold at top per feedback */}
						<h1 className="text-imagine-h1 text-white mb-6 font-bold" style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
							Your AI Gateway to Africa
						</h1>
						
						{/* Supporting sub-text */}
						<p className="text-2xl text-white/90 mb-8 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
							Gain a deeper understanding of Africa's ecosystem and transformation
						</p>
						
						{/* CTA Buttons */}
						<div className="mt-12 flex flex-row items-center justify-center gap-4">
							<button className="px-8 py-3 bg-[var(--color-text-primary)] text-[var(--color-background-default)] rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md hover:shadow-lg flex items-center gap-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} onClick={onGetStarted}>
								Get started <ArrowRight className="w-4 h-4" />
							</button>
							<a className="px-8 py-3 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-all backdrop-blur-sm inline-flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }} href="/pricing" onClick={(e)=>{ e.preventDefault(); window.location.replace('/pricing'); }}>See pricing</a>
						</div>
					</div>
				</div>
			</section>

			{/* Section 01 - AI Co-pilot for Deals & Funding - Matching ImagineAI.me structure */}
			<section className="page-container py-24">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-2 gap-12 items-center">
						{/* Left: Text Content */}
						<div className="space-y-4">
							<div className="text-2xl font-normal text-[var(--color-text-primary)]">01</div>
							<h3 className="text-imagine-h3 text-[var(--color-text-primary)] tracking-tight">
								AI Co-pilot for Deals & Funding
							</h3>
							<p className="text-imagine-body text-[var(--color-text-secondary)]">
								Our AI co-pilot helps you gain a deeper understanding of deals and funding across Africa, with clear insights and executive-level summaries.
							</p>
							<div className="flex flex-wrap gap-2 pt-2">
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Due Diligence</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Valuation</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Pitch Deck</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Investor Matching</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Market Risk</span>
							</div>
						</div>
						{/* Right: Visual Placeholder */}
						<div className="relative">
							<div className="bg-[var(--color-background-default)] border border-[var(--color-divider-gray)] rounded-lg aspect-[4/3] flex items-center justify-center">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-4xl mb-3">🤖</div>
									<p className="text-sm">AI Tools Visual</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 02 - Macro Insights Across Africa - Matching ImagineAI.me structure */}
			<section className="page-container py-24">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-2 gap-12 items-center">
						{/* Left: Visual Placeholder */}
						<div className="relative order-1">
							<div className="bg-[var(--color-background-default)] border border-[var(--color-divider-gray)] rounded-lg aspect-[4/3] flex items-center justify-center">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-4xl mb-3">📈</div>
									<p className="text-sm">Economic Growth Visual</p>
								</div>
							</div>
						</div>
						{/* Right: Text Content */}
						<div className="space-y-4 order-2">
							<div className="text-2xl font-normal text-[var(--color-text-primary)]">02</div>
							<h3 className="text-imagine-h3 text-[var(--color-text-primary)] tracking-tight">
								Macro Insights Across Africa
							</h3>
							<p className="text-imagine-body text-[var(--color-text-secondary)]">
								Clear macro insights across Africa compare countries and uncover investment opportunities.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Section 03 - Clinical Trial Ecosystem - Matching ImagineAI.me structure */}
			<section className="page-container py-24">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-2 gap-12 items-center">
						{/* Left: Text Content */}
						<div className="space-y-4">
							<div className="text-2xl font-normal text-[var(--color-text-primary)]">03</div>
							<h3 className="text-imagine-h3 text-[var(--color-text-primary)] tracking-tight">
								Clinical Trial Ecosystem
							</h3>
							<p className="text-imagine-body text-[var(--color-text-secondary)]">
								Explore Africa's clinical trial ecosystem with precision, map trial sites, assess regulatory pathways, and identify key investigators.
							</p>
							<div className="flex flex-wrap gap-2 pt-2">
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Country</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Phase</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Indication</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Sponsor</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Site</span>
								<span className="px-3 py-1 rounded-md bg-[var(--color-background-surface)] text-xs text-[var(--color-text-primary)] border border-[var(--color-divider-gray)]">Investigator</span>
							</div>
						</div>
						{/* Right: Visual Placeholder */}
						<div className="relative">
							<div className="bg-[var(--color-background-default)] border border-[var(--color-divider-gray)] rounded-lg aspect-[4/3] flex items-center justify-center">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-4xl mb-3">🔬</div>
									<p className="text-sm">Clinical Trial Filters</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Section 04 - Real-time Epidemiology - Matching ImagineAI.me structure */}
			<section className="page-container py-24">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-2 gap-12 items-center">
						{/* Left: Visual Placeholder */}
						<div className="relative order-1">
							<div className="bg-[var(--color-background-default)] border border-[var(--color-divider-gray)] rounded-lg aspect-[4/3] flex items-center justify-center">
								<div className="text-center text-[var(--color-text-secondary)]">
									<div className="text-4xl mb-3">🌍</div>
									<p className="text-sm">Epidemiology Visual</p>
								</div>
							</div>
						</div>
						{/* Right: Text Content */}
						<div className="space-y-4 order-2">
							<div className="text-2xl font-normal text-[var(--color-text-primary)]">04</div>
							<h3 className="text-imagine-h3 text-[var(--color-text-primary)] tracking-tight">
								Real-time Epidemiology
							</h3>
							<p className="text-imagine-body text-[var(--color-text-secondary)]">
								AI for real-time epidemiology, unlocking Africa's disease intelligence.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Section 05 - M-Index & Ergon Side by Side */}
			<section className="page-container py-32 relative overflow-hidden">
				<div className="max-w-7xl mx-auto relative z-10">
					<div className="grid grid-cols-2 gap-12">
						{/* Left: Ergon */}
						<div className="space-y-6">
							<div className="bg-gradient-to-br from-[var(--color-primary-teal)]/5 to-[var(--color-accent-sky)]/5 rounded-3xl p-8 shadow-2xl min-h-[400px] flex flex-col border border-[var(--color-divider-gray)]">
								<div className="flex-1 flex items-center justify-center mb-6">
									<div className="text-center text-[var(--color-text-secondary)]">
										<div className="text-6xl mb-4">💼</div>
										<p className="text-sm font-medium">Ergon Screenshot</p>
										<p className="text-xs mt-2 opacity-60">Image placeholder</p>
									</div>
								</div>
								<div className="space-y-4">
									<h3 className="text-imagine-h3 text-[var(--color-text-primary)]">Ergon</h3>
									<p className="text-imagine-body text-[var(--color-text-secondary)]">
										AI-driven recruitment copilot to help you hire the best talent across Africa.
									</p>
								</div>
							</div>
						</div>
						{/* Right: M-Index */}
						<div className="space-y-6">
							<div className="bg-gradient-to-br from-[var(--color-primary-teal)]/5 to-[var(--color-accent-sky)]/5 rounded-3xl p-8 shadow-2xl min-h-[400px] flex flex-col border border-[var(--color-divider-gray)]">
								<div className="flex-1 flex items-center justify-center mb-6">
									<div className="text-center text-[var(--color-text-secondary)]">
										<div className="text-6xl mb-4">📚</div>
										<p className="text-sm font-medium">M-Index Screenshot</p>
										<p className="text-xs mt-2 opacity-60">Image placeholder</p>
									</div>
								</div>
								<div className="space-y-4">
									<h3 className="text-imagine-h3 text-[var(--color-text-primary)]">M-Index</h3>
									<p className="text-imagine-body text-[var(--color-text-secondary)]">
										Master the Terms. Maximize the Impact
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

            {/* Blog Preview */}
            <section className="page-container section">
                <div className="flex items-end justify-between mb-4">
                    <h2 className="text-3xl font-semibold">From Arion</h2>
                    <a className="btn-outline btn-sm inline-flex items-center justify-center" href="/arion" onClick={(e)=>{ e.preventDefault(); window.location.replace('/arion'); }}>View all</a>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {(blogPreview && blogPreview.length ? blogPreview : []).map((p) => (
                        <div 
                            key={p.id} 
                            className="card-glass p-4 shadow-soft cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
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
            </section>

			{/* Professional Footer */}
			{withFooter && (<footer className="relative overflow-hidden glass-strong backdrop-blur-xl hairline sheen noise-overlay shadow-elevated rounded-t-2xl md:rounded-t-3xl border-t border-[var(--color-divider-gray)]" style={{ background: 'color-mix(in srgb, var(--color-background-surface), transparent 30%)' }}>
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/0 dark:to-transparent" />
                <div aria-hidden className="absolute -top-6 left-1/2 -translate-x-1/2 w-[88%] h-8 pointer-events-none">
                    <div className="block dark:hidden w-full h-full rounded-b-[40px]" style={{background: 'radial-gradient(120% 120% at 50% 0%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.00) 70%)'}} />
                    <div className="hidden dark:block w-full h-full rounded-b-[40px]" style={{background: 'radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.00) 70%)'}} />
                </div>
                <div className="page-container py-14">
					<div className="grid grid-cols-6 gap-8 text-sm">
						{/* Brand */}
						<div className="col-span-2">
							<div className="flex items-center gap-2">
								<img 
									src="/images/logo-light.png" 
									alt="Medarion" 
									className="h-7"
									style={{
										filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
									}}
								/>
							</div>
							<p className="mt-3 text-[var(--color-text-secondary)] max-w-md">African healthcare market data and AI assistance to keep you prepared on every call.</p>
                            <form className="mt-5 flex items-stretch gap-2" onSubmit={(e)=>e.preventDefault()}>
                                <input className="input" placeholder="Enter your email" aria-label="Email" />
                                <button className="btn-primary-elevated btn-lg">Subscribe</button>
                            </form>
                            <div className="mt-3 text-xs text-[var(--color-text-secondary)]">We’ll email occasional updates. Unsubscribe anytime.</div>
						<div className="mt-4 flex items-center gap-2">
							<a href="#" aria-label="Twitter" className="btn-outline btn-sm flex items-center gap-1 text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)]"><Twitter className="w-4 h-4"/>Twitter</a>
							<a href="#" aria-label="LinkedIn" className="btn-outline btn-sm flex items-center gap-1 text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)]"><Linkedin className="w-4 h-4"/>LinkedIn</a>
							<a href="#" aria-label="GitHub" className="btn-outline btn-sm flex items-center gap-1 text-[var(--color-text-primary)] hover:text-[var(--color-primary-teal)]"><Github className="w-4 h-4"/>GitHub</a>
						</div>
						</div>

						{/* Product */}
                        <div>
                            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">Product</h4>
                            <ul className="space-y-2 leading-7">
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('about')}>Overview</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('pricing')}>Pricing</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('documentation')}>Documentation</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('arion')}>Release notes</button></li>
							</ul>
						</div>

						{/* Data */}
                        <div>
                            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">Data</h4>
                            <ul className="space-y-2 leading-7">
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('companies')}>Companies</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('deals')}>Deals</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('grants')}>Grants</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('clinical-trials')}>Clinical Trials</button></li>
							</ul>
						</div>

						{/* Resources */}
                        <div>
                            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">Resources</h4>
                            <ul className="space-y-2 leading-7">
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('blog')}>Blog</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('glossary')}>Glossary</button></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('nationpulse')}>Nation Pulse</button></li>
								<li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" href="#">Help Center</a></li>
							</ul>
						</div>

						{/* Company */}
                        <div>
                            <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">Company</h4>
                            <ul className="space-y-2 leading-7">
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('about')}>About</button></li>
								<li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" href="#">Careers</a></li>
								<li><button className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" onClick={() => onNavigate('contact')}>Contact</button></li>
								<li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" href="#">Press</a></li>
							</ul>
						</div>
					</div>

					{/* Bottom bar */}
                    <div className="mt-12 pt-6 border-t border-[var(--color-divider-gray)] flex flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-secondary)]">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4"/>
							<span>All systems operational</span>
						</div>
						<div className="flex items-center gap-4">
							<button onClick={() => onNavigate('privacy')} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]">Privacy</button>
							<a className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" href="#">Terms</a>
							<a className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" href="#">DPA</a>
							<a className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]" href="#">Subprocessors</a>
						</div>
						<div className="text-[var(--color-text-secondary)]">© {new Date().getFullYear()} Medarion. All rights reserved.</div>
					</div>
				</div>
			</footer>)}
		</div>
	);
};

export default CluelyLanding;


