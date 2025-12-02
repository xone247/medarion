import React from 'react';
import { Check, Shield, BookOpen, Users, Zap, Lock, HeadphonesIcon, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface PricingPageProps {
	onBack: () => void;
}

const features = {
	starter: [
		'Access to free tools',
		'Unlimited basic usage',
		'Community support',
	],
	pro: [
		'Unlimited pro responses',
		'Latest models access',
		'Full dashboards access',
		'Priority support',
	],
	enterprise: [
		'Role-based access & SSO',
		'Custom knowledge base (RAG)',
		'Advanced analytics & reporting',
		'No data training & security controls',
	],
};

const PricingCard: React.FC<{
	title: string;
	price: string;
	desc: string;
	cta: string;
	variant: 'starter'|'pro'|'enterprise';
	secondary?: string;
	onClick: () => void;
	isPopular?: boolean;
}> = ({ title, price, desc, cta, variant, secondary, onClick, isPopular = false }) => {
	const { theme } = useTheme();
	return (
		<div className={`relative p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border transition-all duration-300 h-full flex flex-col ${
			isPopular 
				? 'border-[var(--color-primary-teal)]/50 bg-[var(--color-background-surface)] shadow-xl hover:shadow-2xl' 
				: 'border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm hover:shadow-lg hover:border-[var(--color-primary-teal)]/30'
		}`}>
			{isPopular && (
				<div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-20">
					<span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-[var(--color-primary-teal)] text-white shadow-lg">
						Most Popular
					</span>
				</div>
			)}
			<div className="flex items-center gap-3 mb-4 sm:mb-6">
				<div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
					isPopular ? 'bg-[var(--color-primary-teal)]/20 dark:bg-white/20' : 'bg-[var(--color-background-surface)]'
				}`}>
					{variant === 'enterprise' ? (
						<Shield className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-primary-teal)]"/>
					) : variant === 'pro' ? (
						<Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-primary-teal)]"/>
					) : (
						<BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-primary-teal)]"/>
					)}
				</div>
				<h3 className="text-xl sm:text-2xl md:text-3xl font-medium text-[var(--color-text-primary)]">{title}</h3>
			</div>
			<p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4 sm:mb-6 leading-relaxed">{desc}</p>
			<div className="mb-6 sm:mb-8">
				<div className="text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-text-primary)] mb-1">
					{price}
					{secondary && <span className="text-base sm:text-lg md:text-xl font-normal text-[var(--color-text-secondary)] ml-1">{secondary}</span>}
				</div>
			</div>
			<ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
				{features[variant].map((f) => (
					<li key={f} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-[var(--color-text-primary)]">
						<Check className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
						<span className="leading-relaxed">{f}</span>
					</li>
				))}
			</ul>
			<button 
				onClick={onClick} 
				className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
					isPopular 
						? 'btn-primary-elevated' 
						: 'btn-outline'
				}`}
			>
				{cta}
			</button>
		</div>
	);
};

const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
	const { theme } = useTheme();
	
	return (
		<div className="min-h-screen bg-[var(--color-background-default)]">
			{/* Hero Section */}
			<div className="page-hero" style={{ position: 'relative', zIndex: 1 }}>
				<div aria-hidden className="page-hero-bg">
					<img
						src={(import.meta as any).env?.VITE_PRICING_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
						alt=""
					/>
					<div className="page-hero-overlay" />
					<div className="page-hero-gradient" />
				</div>
				
				<div className="page-hero-content">
					<div className="page-hero-content-inner">
						<h1 className="page-hero-heading">
							Pricing
						</h1>
						<p className="page-hero-subtext">
							Flexible plans for teams of all sizes
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-screen-2xl mx-auto">
				{/* Pricing Cards Section */}
				<section 
					className="py-16 sm:py-20 md:py-24 lg:py-32 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
					style={{ 
						backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
					}}
				>
					<div className="px-6 md:px-8 lg:px-12 xl:px-16">
						<div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20">
							<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight mb-4 sm:mb-6">
								Start for free. Scale when ready.
							</h2>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed">
								Choose a plan that suits your workflow. Upgrade anytime as your needs grow.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 items-stretch max-w-7xl mx-auto">
							<PricingCard 
								title="Starter" 
								price="Free" 
								desc="All essential features to get you started." 
								cta="Get Started" 
								variant="starter" 
								onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:auth')); }} 
							/>
							<PricingCard 
								title="Pro" 
								price="$20" 
								desc="Unlock advanced features for individuals." 
								cta="Subscribe" 
								secondary="/ month" 
								variant="pro" 
								isPopular={true}
								onClick={() => { alert('Subscription flow placeholder'); }} 
							/>
							<PricingCard 
								title="Enterprise" 
								price="Custom" 
								desc="Advanced security and controls for teams." 
								cta="Talk to sales" 
								variant="enterprise" 
								onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:static', { detail: { page: 'contact' } })); }} 
							/>
						</div>
					</div>
				</section>

				{/* Features Comparison Section */}
				<section 
					className="py-16 sm:py-20 md:py-24 lg:py-32 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
					style={{ 
						backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
					}}
				>
					<div className="px-6 md:px-8 lg:px-12 xl:px-16">
						<div className="text-center mb-12 sm:mb-16">
							<h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight mb-4 sm:mb-6">
								What's included
							</h2>
							<p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
								Compare features across all plans
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 max-w-7xl mx-auto">
							<div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-white dark:bg-[var(--color-background-default)] shadow-sm hover:shadow-md transition-shadow duration-300">
								<div className="font-medium text-lg sm:text-xl mb-4 sm:mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
									<BookOpen className="h-5 w-5 text-[var(--color-primary-teal)]" />
									Starter
								</div>
								<ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
									{features.starter.map(f => (
										<li key={f} className="flex items-start gap-2 sm:gap-3 text-[var(--color-text-secondary)]">
											<Check className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
											<span className="leading-relaxed">{f}</span>
										</li>
									))}
								</ul>
							</div>
							<div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-primary-teal)]/30 bg-white dark:bg-[var(--color-background-default)] shadow-md hover:shadow-lg transition-shadow duration-300">
								<div className="font-medium text-lg sm:text-xl mb-4 sm:mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
									<Zap className="h-5 w-5 text-[var(--color-primary-teal)]" />
									Pro
								</div>
								<ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
									{features.pro.map(f => (
										<li key={f} className="flex items-start gap-2 sm:gap-3 text-[var(--color-text-secondary)]">
											<Check className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
											<span className="leading-relaxed">{f}</span>
										</li>
									))}
								</ul>
							</div>
							<div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-white dark:bg-[var(--color-background-default)] shadow-sm hover:shadow-md transition-shadow duration-300 sm:col-span-2 md:col-span-1">
								<div className="font-medium text-lg sm:text-xl mb-4 sm:mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
									<Shield className="h-5 w-5 text-[var(--color-primary-teal)]" />
									Enterprise
								</div>
								<ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
									{features.enterprise.map(f => (
										<li key={f} className="flex items-start gap-2 sm:gap-3 text-[var(--color-text-secondary)]">
											<Check className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
											<span className="leading-relaxed">{f}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* Security Features Section */}
				<section 
					className="py-16 sm:py-20 md:py-24 lg:py-32 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
					style={{ 
						backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
					}}
				>
					<div className="px-6 md:px-8 lg:px-12 xl:px-16">
						<div className="text-center mb-12 sm:mb-16">
							<div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--color-primary-teal)]/10 dark:bg-white/10 mb-6">
								<Shield className="h-8 w-8 text-[var(--color-primary-teal)] dark:text-white" />
							</div>
							<h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight mb-4 sm:mb-6">
								Enterprise-grade security
							</h2>
							<p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
								Built with security and compliance at the core
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 max-w-7xl mx-auto">
							<div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] text-center hover:shadow-lg transition-shadow duration-300">
								<div className="p-3 sm:p-4 rounded-xl bg-[var(--color-primary-teal)]/10 dark:bg-white/10 inline-flex mb-4 sm:mb-6">
									<Lock className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary-teal)]"/>
								</div>
								<p className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]">SSO and identity provider integration</p>
							</div>
							<div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] text-center hover:shadow-lg transition-shadow duration-300">
								<div className="p-3 sm:p-4 rounded-xl bg-[var(--color-primary-teal)]/10 dark:bg-white/10 inline-flex mb-4 sm:mb-6">
									<Users className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary-teal)]"/>
								</div>
								<p className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]">User provisioning and role-based access</p>
							</div>
							<div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] text-center hover:shadow-lg transition-shadow duration-300 sm:col-span-2 md:col-span-1">
								<div className="p-3 sm:p-4 rounded-xl bg-[var(--color-primary-teal)]/10 dark:bg-white/10 inline-flex mb-4 sm:mb-6">
									<HeadphonesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary-teal)]"/>
								</div>
								<p className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]">Dedicated support and onboarding</p>
							</div>
						</div>
					</div>
				</section>

				{/* Report & Advisory Section */}
				<section 
					className="py-16 sm:py-20 md:py-24 lg:py-32 transition-colors duration-500"
					style={{ 
						backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
					}}
				>
					<div className="px-6 md:px-8 lg:px-12 xl:px-16">
						<div className="text-center mb-12 sm:mb-16">
							<div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--color-primary-teal)]/10 dark:bg-white/10 mb-6">
								<TrendingUp className="h-8 w-8 text-[var(--color-primary-teal)] dark:text-white" />
							</div>
							<h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight mb-4 sm:mb-6">
								Report & Advisory
							</h2>
							<p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto">
								The Medarion team provides on-demand reports and advisory services across industries and countries covering topics ranging from funding and deals to clinical trials and much more.
							</p>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
							<div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-xl group">
								<img 
									src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80"
									alt="2024 Healthcare Series A Funding Trends"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80';
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								<div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<div className="text-xs sm:text-sm font-medium text-white leading-tight">2024 Healthcare Series A Funding Trends</div>
								</div>
							</div>
							<div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-xl group">
								<img 
									src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80"
									alt="2023 Series C Trends Across Africa"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80';
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								<div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<div className="text-xs sm:text-sm font-medium text-white leading-tight">2023 Series C Trends Across Africa</div>
								</div>
							</div>
							<div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-xl group">
								<img 
									src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80"
									alt="2021 Deals in Africa: Fintech Insights & Trends"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80';
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								<div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<div className="text-xs sm:text-sm font-medium text-white leading-tight">2021 Deals in Africa: Fintech Insights & Trends</div>
								</div>
							</div>
							<div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-xl group">
								<img 
									src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80"
									alt="2023 Clinical Trial Insights in Nigeria"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80';
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								<div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<div className="text-xs sm:text-sm font-medium text-white leading-tight">2023 Clinical Trial Insights in Nigeria</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default PricingPage;
