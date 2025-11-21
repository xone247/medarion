import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../NotificationDropdown';

// Update favicon based on theme - pure black/white
const updateFavicon = (isDark: boolean) => {
	const favicon = document.getElementById('favicon') as HTMLLinkElement;
	if (favicon) {
		// Use pure black/white favicon files (fav.png = black, fav-dark.png = white)
		favicon.href = isDark ? '/images/fav-dark.png' : '/images/fav.png';
	}
};

interface SiteHeaderProps {
	currentPage?: string;
}

function nav(page: string) {
	const direct = new Set(['about','arion','pricing','documentation','privacy','contact','auth','m-index']);
	if (direct.has(page)) {
		window.location.href = `/${page}`;
	} else {
		window.location.href = `/module/${page}`;
	}
}

function getMobileAdminTitle(): string | null {
	if (typeof window === 'undefined') return null;
	const p = window.location.pathname || '';
	// Consider common admin/app routes
	const isAdminView = p.includes('/admin') || p.includes('/dashboard') || p.includes('/module');
	if (!isAdminView) return null;
	if (p.includes('/admin-dashboard')) return 'Admin Dashboard';
	if (p.includes('/nationpulse')) return 'Nation Pulse';
	if (p.includes('/ai-tools')) return 'AI Tools';
	if (p.includes('/arion')) return 'Arion';
	// Fallback to last path segment, title-cased
	const seg = p.split('/').filter(Boolean).pop() || '';
	if (!seg) return 'Dashboard';
	return seg.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ currentPage }) => {
	const { theme, toggleTheme } = useTheme();
	const { profile, user } = useAuth();
	const isActive = (name: string) => currentPage === name;
	const [open, setOpen] = useState(false);
	const toggleMenu = () => setOpen((v) => !v);
	const closeMenu = () => setOpen(false);
	const mobileAdminTitle = getMobileAdminTitle();
	const onHeroDark = false; // keep consistent readable colors in light mode while scrolling
	// Track scroll to switch header styling (solid at top, glass when scrolled)
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled((window.scrollY || 0) > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// Update favicon when theme changes
	useEffect(() => {
		updateFavicon(theme === 'dark');
	}, [theme]);

	// Handle sign in button click - redirect to dashboard if already signed in
	const handleSignInClick = () => {
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
			nav('auth')
		}
	}

	const accountTier = (profile as any)?.is_admin
		? 'Admin'
		: ((profile as any)?.account_tier || 'Free') as string;

	// Compute header style: transparent at top, glassy when scrolled
	const headerStyle: React.CSSProperties = scrolled
		? {
				// When scrolled: glassy white background
				background: 'rgba(255,255,255,0.90)',
				backdropFilter: 'blur(20px)',
				WebkitBackdropFilter: 'blur(20px)',
				borderBottom: '1px solid rgba(0,0,0,0.08)',
				transition: 'background 200ms ease, backdrop-filter 200ms ease'
		  }
		: {
				// At top: fully transparent to show hero background
				background: 'transparent',
				backdropFilter: 'none',
				WebkitBackdropFilter: 'none',
				borderBottom: 'none',
				transition: 'background 200ms ease, backdrop-filter 200ms ease'
		  };

	// Section style for rounded containers - black/white based on theme
	const sectionStyle: React.CSSProperties = scrolled
		? theme === 'dark'
			? {
					background: 'rgba(255,255,255,0.90)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					border: '1px solid rgba(0,0,0,0.08)',
					transition: 'background 200ms ease, backdrop-filter 200ms ease'
			  }
			: {
					// Light mode when scrolled: black background
					background: 'rgba(0,0,0,0.90)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					border: '1px solid rgba(255,255,255,0.20)',
					transition: 'background 200ms ease, backdrop-filter 200ms ease'
			  }
		: {
				background: 'rgba(255,255,255,0.10)',
				backdropFilter: 'blur(10px)',
				WebkitBackdropFilter: 'blur(10px)',
				border: '1px solid rgba(255,255,255,0.20)',
				transition: 'background 200ms ease, backdrop-filter 200ms ease'
		  };

	return (
		<header
			className="relative z-50"
			style={{
				padding: '0',
				background: 'transparent'
			}}
		>
			<div className="page-container flex items-center justify-center md:justify-between gap-3" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
				{/* Section 1: Logo (left) */}
				<div 
					className="hidden md:flex items-center px-4 h-12 rounded-xl transition-all"
					style={sectionStyle}
				>
					<a href="/" className="flex items-center gap-2">
						<img 
							src="/images/logo-light.png" 
							alt="Medarion" 
							className="h-8 transition-all"
							style={{
								filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
							}}
						/>
					</a>
				</div>

				{/* Mobile hamburger and logo */}
				<div className="md:hidden flex items-center gap-2">
					<button aria-label="Open menu" className="btn-outline btn-sm" onClick={toggleMenu}>
						<span className="block w-5 h-[2px] bg-current mb-1"></span>
						<span className="block w-5 h-[2px] bg-current mb-1"></span>
						<span className="block w-5 h-[2px] bg-current"></span>
					</button>
					<a href="/" className="flex items-center gap-2">
						<img 
							src="/images/logo-light.png" 
							alt="Medarion" 
							className="h-8 transition-all"
							style={{
								filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
							}}
						/>
					</a>
				</div>

				{/* Section 2: Navigation (center) - Desktop only */}
				<nav 
					className="hidden md:flex items-center gap-2 px-4 h-12 rounded-xl transition-all"
					style={sectionStyle}
				>
					<button
						className={`px-3 py-1.5 transition-all font-medium text-sm ${
							scrolled 
								? theme === 'dark' 
									? 'text-gray-900 hover:opacity-70' 
									: 'text-white hover:opacity-80' 
								: 'text-white hover:opacity-80'
						}`}
						onClick={() => nav('about')}
					>
						About
					</button>
					<button
						className={`px-3 py-1.5 transition-all font-medium text-sm ${
							scrolled 
								? theme === 'dark' 
									? 'text-gray-900 hover:opacity-70' 
									: 'text-white hover:opacity-80' 
								: 'text-white hover:opacity-80'
						}`}
						onClick={() => nav('arion')}
					>
						Arion
					</button>
					<button
						className={`px-3 py-1.5 transition-all font-medium text-sm ${
							scrolled 
								? theme === 'dark' 
									? 'text-gray-900 hover:opacity-70' 
									: 'text-white hover:opacity-80' 
								: 'text-white hover:opacity-80'
						}`}
						onClick={() => nav('m-index')}
					>
						M-Index
					</button>
					<button
						className={`px-3 py-1.5 transition-all font-medium text-sm ${
							scrolled 
								? theme === 'dark' 
									? 'text-gray-900 hover:opacity-70' 
									: 'text-white hover:opacity-80' 
								: 'text-white hover:opacity-80'
						}`}
						onClick={() => {}}
					>
						Ergon
					</button>
				</nav>

				{/* Section 3: Actions (right) */}
				<div 
					className="hidden md:flex items-center gap-2 px-4 h-12 rounded-xl transition-all"
					style={sectionStyle}
				>
					<button className={`px-3 py-1.5 transition-all font-medium text-sm ${
						scrolled 
							? theme === 'dark' 
								? 'text-gray-900 hover:opacity-70' 
								: 'text-white hover:opacity-80' 
							: 'text-white hover:opacity-80'
					}`} onClick={toggleTheme} aria-label="Toggle theme">
						{theme === 'dark' ? '☀️' : '🌙'}
					</button>
					<button className="px-4 py-1.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-background-default)] hover:opacity-90 transition-opacity font-medium text-sm" onClick={handleSignInClick}>
						{user && profile ? 'Dashboard' : 'Sign in'}
					</button>
				</div>

				{/* Mobile right-side content */}
				<div className="ml-auto md:hidden flex items-center gap-2 min-w-0">
					{mobileAdminTitle && (
						<span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[36vw] inline-block text-right">{mobileAdminTitle}</span>
					)}
					{accountTier && (
						<span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-100 truncate max-w-[20vw]">{accountTier}</span>
					)}
					<button
						className="btn-outline btn-icon btn-sm"
						onClick={toggleTheme}
						aria-label="Toggle theme"
					>
						{theme === 'dark' ? '☀️' : '🌙'}
					</button>
					<NotificationDropdown />
				</div>
			</div>
			{/* Mobile menu overlay */}
			{open && (
				<div className="md:hidden">
					<div className="fixed inset-0 z-40" onClick={closeMenu} />
					<div className="absolute top-12 left-0 right-0 z-50 px-3 pb-3">
						<div
							className={`rounded-xl shadow-xl hairline ${theme === 'light' ? 'text-white' : ''}`}
							style={{
								background: theme === 'light' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.85)',
								backdropFilter: 'blur(16px)',
								WebkitBackdropFilter: 'blur(16px)',
								border: theme === 'light' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.3)'
							}}
						>
							<div className="flex flex-col p-3">
								<button
									className={`text-left py-2 px-2 rounded ${theme === 'light' ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'} ${isActive('about') ? 'font-semibold' : ''}`}
									onClick={() => { nav('about'); closeMenu(); }}
								>
									About
								</button>
								<button
									className={`text-left py-2 px-2 rounded ${theme === 'light' ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'} ${isActive('arion') ? 'font-semibold' : ''}`}
									onClick={() => { nav('arion'); closeMenu(); }}
								>
									Arion
								</button>
								<button
									className={`text-left py-2 px-2 rounded ${theme === 'light' ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'} ${isActive('m-index') ? 'font-semibold' : ''}`}
									onClick={() => { nav('m-index'); closeMenu(); }}
								>
									M-Index
								</button>
								<button
									className={`text-left py-2 px-2 rounded ${theme === 'light' ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
									onClick={() => { closeMenu(); }}
								>
									Ergon
								</button>
								<div className={`h-px my-2 ${theme === 'light' ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'}`} />
								<button className="btn-outline w-full mb-2 flex items-center justify-center gap-2" onClick={() => { toggleTheme(); closeMenu(); }}>
									<span>{theme === 'dark' ? '☀️' : '🌙'}</span>
									<span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
								</button>
								<button className={`${theme === 'light' ? 'btn-primary-elevated' : 'btn-secondary'} w-full`} onClick={() => { handleSignInClick(); closeMenu(); }}>
									{user && profile ? 'Dashboard' : 'Sign in'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}

export default SiteHeader;


