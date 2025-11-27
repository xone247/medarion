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
	// Track mobile breakpoint (768px)
	const [isMobile, setIsMobile] = useState(false);
	
	useEffect(() => {
		const onScroll = () => setScrolled((window.scrollY || 0) > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// Detect mobile breakpoint
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
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
				window.location.href = '/admin'
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

	// Check if current page has white background in light mode (auth, signup pages)
	const isWhiteBackgroundPage = currentPage === 'auth' || currentPage === 'signup' || window.location.pathname === '/auth' || window.location.pathname === '/signup';

	// Compute header style: transparent at top, glassy when scrolled
	const headerStyle: React.CSSProperties = scrolled || (isWhiteBackgroundPage && theme === 'light')
		? {
				// When scrolled or on white background pages (light mode only): black background
				// Dark mode keeps original behavior (only scrolled matters)
				background: isWhiteBackgroundPage && theme === 'light'
					? 'rgba(0,0,0,0.95)'
					: theme === 'dark' 
						? 'rgba(18, 18, 18, 0.90)'
						: 'rgba(255,255,255,0.95)',
				backdropFilter: 'blur(20px)',
				WebkitBackdropFilter: 'blur(20px)',
				borderBottom: theme === 'dark' 
					? '1px solid rgba(255,255,255,0.08)'
					: '1px solid rgba(0,0,0,0.08)',
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
	const sectionStyle: React.CSSProperties = scrolled || (isWhiteBackgroundPage && theme === 'light')
		? theme === 'dark'
			? {
					// Dark mode: original behavior - white background when scrolled
					background: 'rgba(255,255,255,0.90)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					border: '1px solid rgba(0,0,0,0.08)',
					transition: 'background 200ms ease, backdrop-filter 200ms ease'
			  }
			: {
					// Light mode when scrolled or on white background pages: black background with white text
					background: 'rgba(0,0,0,0.90)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					border: '1px solid rgba(255,255,255,0.20)',
					transition: 'background 200ms ease, backdrop-filter 200ms ease'
			  }
		: {
				// At top: transparent glassy effect
				background: 'rgba(255,255,255,0.10)',
				backdropFilter: 'blur(10px)',
				WebkitBackdropFilter: 'blur(10px)',
				border: '1px solid rgba(255,255,255,0.20)',
				transition: 'background 200ms ease, backdrop-filter 200ms ease'
		  };

	// Get breadcrumb path
	const getBreadcrumb = () => {
		if (typeof window === 'undefined') return [];
		const path = window.location.pathname;
		const segments = path.split('/').filter(Boolean);
		const breadcrumbs = [{ label: 'Home', path: '/' }];
		
		segments.forEach((seg, index) => {
			const path = '/' + segments.slice(0, index + 1).join('/');
			const label = seg.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
			breadcrumbs.push({ label, path });
		});
		
		return breadcrumbs;
	};

	const breadcrumbs = getBreadcrumb();

	return (
		<header
			className="relative z-50"
			style={{
				padding: '0',
				background: 'transparent'
			}}
		>
			{/* Desktop Header - Hidden on mobile */}
			<div className={`page-container flex items-center justify-between gap-2 ${isMobile ? 'hidden' : 'flex'}`} style={{ paddingTop: '8px', paddingBottom: '8px', flexWrap: 'nowrap', minWidth: 0 }}>
				{/* Section 1: Logo (left) */}
				<div 
					className="flex items-center px-4 h-12 rounded-xl transition-all flex-shrink-0"
					style={sectionStyle}
				>
					<a href="/" className="flex items-center gap-2">
						<img 
							src="/images/logo-light.png" 
							alt="Medarion" 
							className="h-8 transition-all"
							style={{
								filter: (scrolled || (isWhiteBackgroundPage && theme === 'light'))
									? (theme === 'dark' ? 'brightness(0)' : 'brightness(0) invert(1)')
									: 'brightness(0) invert(1)', // White logo when transparent
							}}
						/>
					</a>
				</div>

				{/* Section 2: Navigation (center) - Desktop only */}
				<nav 
					className="flex items-center gap-1 px-4 h-12 rounded-xl transition-all flex-shrink-0"
					style={sectionStyle}
				>
					<button
						className={`px-3 py-1.5 transition-all font-medium text-sm ${
							(scrolled || (isWhiteBackgroundPage && theme === 'light'))
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
							(scrolled || (isWhiteBackgroundPage && theme === 'light'))
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
							(scrolled || (isWhiteBackgroundPage && theme === 'light'))
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
							(scrolled || (isWhiteBackgroundPage && theme === 'light'))
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
					className="flex items-center gap-2 px-4 h-12 rounded-xl transition-all flex-shrink-0"
					style={sectionStyle}
				>
					<button className={`px-3 py-1.5 transition-all font-medium text-sm ${
						(scrolled || (isWhiteBackgroundPage && theme === 'light'))
							? theme === 'dark' 
								? 'text-gray-900 hover:opacity-70' 
								: 'text-white hover:opacity-80' 
							: 'text-white hover:opacity-80'
					}`} onClick={toggleTheme} aria-label="Toggle theme">
						{theme === 'dark' ? '☀️' : '🌙'}
					</button>
					<button className={`px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm ${
						(scrolled || (isWhiteBackgroundPage && theme === 'light')) && theme === 'light'
							? 'bg-white text-black'
							: 'bg-[var(--color-text-primary)] text-[var(--color-background-default)]'
					}`} onClick={handleSignInClick}>
						{user && profile ? 'Dashboard' : 'Sign in'}
					</button>
				</div>
			</div>

			{/* Mobile Header - Shown on mobile (< 768px) */}
			<div className={`page-container ${isMobile ? 'flex' : 'hidden'} flex-col gap-2`} style={{ paddingTop: '8px', paddingBottom: '8px' }}>
				{/* Mobile Header Row 1: Hamburger + Logo + Actions */}
				<div className="flex items-center justify-between gap-2 w-full" style={{ flexWrap: 'nowrap' }}>
					{/* Left: Hamburger + Logo */}
					<div className="flex items-center gap-2 flex-shrink-0">
						<button 
							aria-label="Open menu" 
							className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
							style={sectionStyle}
							onClick={toggleMenu}
						>
							<div className="flex flex-col gap-1">
								<span className="block w-5 h-[2px] bg-current" style={{ 
									color: (scrolled || (isWhiteBackgroundPage && theme === 'light'))
										? (theme === 'dark' ? 'rgb(17, 24, 39)' : 'white')
										: 'white'
								}}></span>
								<span className="block w-5 h-[2px] bg-current" style={{ 
									color: (scrolled || (isWhiteBackgroundPage && theme === 'light'))
										? (theme === 'dark' ? 'rgb(17, 24, 39)' : 'white')
										: 'white'
								}}></span>
								<span className="block w-5 h-[2px] bg-current" style={{ 
									color: (scrolled || (isWhiteBackgroundPage && theme === 'light'))
										? (theme === 'dark' ? 'rgb(17, 24, 39)' : 'white')
										: 'white'
								}}></span>
							</div>
						</button>
						<a href="/" className="flex items-center gap-2 flex-shrink-0">
							<img 
								src="/images/logo-light.png" 
								alt="Medarion" 
								className="h-7 transition-all"
								style={{
									filter: (scrolled || (isWhiteBackgroundPage && theme === 'light'))
										? (theme === 'dark' ? 'brightness(0)' : 'brightness(0) invert(1)')
										: 'brightness(0) invert(1)', // White logo when transparent
								}}
							/>
						</a>
				</div>

					{/* Right: Theme + Sign in */}
					<div className="flex items-center gap-2 flex-shrink-0">
					<button
							className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
							style={sectionStyle}
						onClick={toggleTheme}
						aria-label="Toggle theme"
					>
							<span style={{ 
								fontSize: '18px',
								color: (scrolled || (isWhiteBackgroundPage && theme === 'light'))
									? (theme === 'dark' ? 'rgb(17, 24, 39)' : 'white')
									: 'white'
							}}>
						{theme === 'dark' ? '☀️' : '🌙'}
							</span>
						</button>
						<button 
							className={`px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm flex-shrink-0 ${
								(scrolled || (isWhiteBackgroundPage && theme === 'light')) && theme === 'light'
									? 'bg-white text-black'
									: 'bg-[var(--color-text-primary)] text-[var(--color-background-default)]'
							}`}
							onClick={handleSignInClick}
						>
							{user && profile ? 'Dashboard' : 'Sign in'}
					</button>
					</div>
				</div>

				{/* Mobile Header Row 2: Breadcrumb Navigation */}
				{breadcrumbs.length > 1 && (
					<div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ fontSize: '12px' }}>
						{breadcrumbs.map((crumb, index) => (
							<React.Fragment key={crumb.path}>
								{index > 0 && (
									<span style={{ color: (scrolled || (isWhiteBackgroundPage && theme === 'light')) ? (theme === 'dark' ? 'rgb(107, 114, 128)' : 'rgba(255,255,255,0.6)') : 'rgba(255,255,255,0.6)' }} className="mx-1">/</span>
								)}
								{index === breadcrumbs.length - 1 ? (
									<span style={{ 
										color: (scrolled || (isWhiteBackgroundPage && theme === 'light')) ? (theme === 'dark' ? 'rgb(17, 24, 39)' : 'white') : 'white',
										fontWeight: 500
									}} className="truncate">
										{crumb.label}
									</span>
								) : (
									<a 
										href={crumb.path}
										style={{ 
											color: (scrolled || (isWhiteBackgroundPage && theme === 'light')) ? (theme === 'dark' ? 'rgb(107, 114, 128)' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.8)',
										}}
										className="hover:opacity-80 transition-opacity truncate"
									>
										{crumb.label}
									</a>
								)}
							</React.Fragment>
						))}
					</div>
				)}
			</div>
			{/* Mobile menu overlay - Cursor.com style */}
			{open && isMobile && (
				<>
					<div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closeMenu} />
					<div className="fixed top-16 left-3 right-3 z-50">
						<div
							className="rounded-2xl shadow-2xl"
							style={{
								background: theme === 'dark' 
									? 'rgba(255,255,255,0.95)' 
									: 'rgba(0,0,0,0.95)',
								backdropFilter: 'blur(20px)',
								WebkitBackdropFilter: 'blur(20px)',
								border: theme === 'dark' 
									? '1px solid rgba(0,0,0,0.1)' 
									: '1px solid rgba(255,255,255,0.2)',
								boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
							}}
						>
							<div className="flex flex-col p-2">
								<button
									className={`text-left py-3 px-4 rounded-xl transition-colors ${
										theme === 'dark' 
											? 'hover:bg-black/5 text-gray-900' 
											: 'hover:bg-white/10 text-white'
									} ${isActive('about') ? 'font-medium' : 'font-normal'}`}
									onClick={() => { nav('about'); closeMenu(); }}
									style={{ fontSize: '14px' }}
								>
									About
								</button>
								<button
									className={`text-left py-3 px-4 rounded-xl transition-colors ${
										theme === 'dark' 
											? 'hover:bg-black/5 text-gray-900' 
											: 'hover:bg-white/10 text-white'
									} ${isActive('arion') ? 'font-medium' : 'font-normal'}`}
									onClick={() => { nav('arion'); closeMenu(); }}
									style={{ fontSize: '14px' }}
								>
									Arion
								</button>
								<button
									className={`text-left py-3 px-4 rounded-xl transition-colors ${
										theme === 'dark' 
											? 'hover:bg-black/5 text-gray-900' 
											: 'hover:bg-white/10 text-white'
									} ${isActive('m-index') ? 'font-medium' : 'font-normal'}`}
									onClick={() => { nav('m-index'); closeMenu(); }}
									style={{ fontSize: '14px' }}
								>
									M-Index
								</button>
								<button
									className={`text-left py-3 px-4 rounded-xl transition-colors ${
										theme === 'dark' 
											? 'hover:bg-black/5 text-gray-900' 
											: 'hover:bg-white/10 text-white'
									}`}
									onClick={() => { closeMenu(); }}
									style={{ fontSize: '14px' }}
								>
									Ergon
								</button>
								<div className={`h-px my-1 mx-2 ${theme === 'dark' ? 'bg-gray-200' : 'bg-white/20'}`} />
								<button 
									className={`text-left py-3 px-4 rounded-xl transition-colors ${
										theme === 'dark' 
											? 'hover:bg-black/5 text-gray-900' 
											: 'hover:bg-white/10 text-white'
									}`}
									onClick={() => { handleSignInClick(); closeMenu(); }}
									style={{ fontSize: '14px', fontWeight: 500 }}
								>
									{user && profile ? 'Dashboard' : 'Sign in'}
								</button>
							</div>
						</div>
					</div>
				</>
			)}
		</header>
	);
}

export default SiteHeader;


