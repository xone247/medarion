import React from 'react';
import { Check, Shield, BookOpen, Users, Zap, Lock, HeadphonesIcon } from 'lucide-react';

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
}> = ({ title, price, desc, cta, variant, secondary, onClick }) => {
	const isPro = variant === 'pro';
	const isEnterprise = variant === 'enterprise';
	return (
		<div className={`p-8 md:p-10 rounded-2xl border transition-all duration-300 h-full flex flex-col ${
			isPro 
				? 'border-[var(--color-primary-teal)]/50 bg-[var(--color-background-surface)] shadow-lg hover:shadow-xl scale-105 md:scale-110' 
				: 'border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm hover:shadow-md hover:border-[var(--color-primary-teal)]/30'
		}`}>
			{isPro && (
				<div className="mb-4">
					<span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-black/10 dark:bg-white/10 text-black dark:text-white">
						Most Popular
					</span>
				</div>
			)}
			<div className="flex items-center gap-3 mb-4">
				<div className={`p-2 rounded-lg ${
					isPro ? 'bg-black/20 dark:bg-white/20' : 'bg-black/10 dark:bg-white/10'
				}`}>
					{isEnterprise ? <Shield className="h-5 w-5 text-[var(--color-primary-teal)]"/> : isPro ? <Zap className="h-5 w-5 text-[var(--color-primary-teal)]"/> : <BookOpen className="h-5 w-5 text-[var(--color-primary-teal)]"/>}
				</div>
				<h3 className="text-xl md:text-2xl font-medium text-[var(--color-text-primary)]">{title}</h3>
			</div>
			<p className="text-[var(--color-text-secondary)] mb-6 text-sm md:text-base leading-relaxed">{desc}</p>
			<div className="mb-6">
				<div className="text-4xl md:text-5xl font-medium text-[var(--color-text-primary)] mb-1">
					{price}
					{secondary && <span className="text-lg md:text-xl font-normal text-[var(--color-text-secondary)] ml-1">{secondary}</span>}
				</div>
			</div>
			<ul className="space-y-3 mb-8 flex-1">
				{features[variant].map((f) => (
					<li key={f} className="flex items-start gap-3 text-sm md:text-base text-[var(--color-text-primary)]">
						<Check className="h-5 w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
						<span className="leading-relaxed">{f}</span>
					</li>
				))}
			</ul>
			<button 
				onClick={onClick} 
				className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
					isPro 
						? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 dark:hover:opacity-80 shadow-md hover:shadow-lg' 
						: 'bg-transparent border-2 border-black dark:border-white text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
				}`}
			>
				{cta}
			</button>
		</div>
	);
};

const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
	return (
		<div className="min-h-screen bg-[var(--color-background-default)]">
			{/* Hero Section */}
			<div className="page-hero">
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

			<div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16 py-16 md:py-20 lg:py-24 space-y-16 md:space-y-20 lg:space-y-24">
				<div className="text-center max-w-3xl mx-auto">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[var(--color-text-primary)] mb-6">Start for free. Scale when ready.</h2>
					<p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">Choose a plan that suits your workflow. Upgrade anytime as your needs grow.</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
					<PricingCard title="Starter" price="Free" desc="All essential features to get you started." cta="Get Started" variant="starter" onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:auth')); }} />
					<PricingCard title="Pro" price="$20" desc="Unlock advanced features for individuals." cta="Subscribe" secondary="/ month" variant="pro" onClick={() => { alert('Subscription flow placeholder'); }} />
					<PricingCard title="Enterprise" price="Custom" desc="Advanced security and controls for teams." cta="Talk to sales" variant="enterprise" onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:static', { detail: { page: 'contact' } })); }} />
				</div>

				<div className="p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm">
					<h3 className="text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-8 text-center">What's included</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
						<div className="p-6 rounded-xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-default)]">
							<div className="font-medium text-lg mb-4 text-[var(--color-text-primary)]">Starter</div>
							<ul className="space-y-3 text-sm md:text-base">
								{features.starter.map(f => (
									<li key={f} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
										<Check className="h-5 w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
										<span className="leading-relaxed">{f}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="p-6 rounded-xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-default)]">
							<div className="font-medium text-lg mb-4 text-[var(--color-text-primary)]">Pro</div>
							<ul className="space-y-3 text-sm md:text-base">
								{features.pro.map(f => (
									<li key={f} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
										<Check className="h-5 w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
										<span className="leading-relaxed">{f}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="p-6 rounded-xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-default)]">
							<div className="font-medium text-lg mb-4 text-[var(--color-text-primary)]">Enterprise</div>
							<ul className="space-y-3 text-sm md:text-base">
								{features.enterprise.map(f => (
									<li key={f} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
										<Check className="h-5 w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0"/>
										<span className="leading-relaxed">{f}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<div className="p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm">
					<h3 className="text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-8 text-center">Enterprise-grade security</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
						<div className="p-6 rounded-xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-default)] text-center">
							<div className="p-3 rounded-lg bg-black/10 dark:bg-white/10 inline-flex mb-4">
								<Lock className="h-6 w-6 text-[var(--color-primary-teal)]"/>
							</div>
							<p className="text-base md:text-lg font-medium text-[var(--color-text-primary)]">SSO and identity provider integration</p>
						</div>
						<div className="p-6 rounded-xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-default)] text-center">
							<div className="p-3 rounded-lg bg-black/10 dark:bg-white/10 inline-flex mb-4">
								<Users className="h-6 w-6 text-[var(--color-primary-teal)]"/>
							</div>
							<p className="text-base md:text-lg font-medium text-[var(--color-text-primary)]">User provisioning and role-based access</p>
						</div>
						<div className="p-6 rounded-xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-default)] text-center">
							<div className="p-3 rounded-lg bg-black/10 dark:bg-white/10 inline-flex mb-4">
								<HeadphonesIcon className="h-6 w-6 text-[var(--color-primary-teal)]"/>
							</div>
							<p className="text-base md:text-lg font-medium text-[var(--color-text-primary)]">Dedicated support and onboarding</p>
						</div>
					</div>
				</div>

				{/* Report & Advisory Section */}
				<div className="p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm">
					<h3 className="text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-4 text-center">Report & Advisory</h3>
					<p className="text-[var(--color-text-secondary)] mb-8 md:mb-10 leading-relaxed text-center max-w-3xl mx-auto">
						The Medarion team provides on-demand reports and advisory services across industries and countries covering topics ranging from funding and deals to clinical trials and much more.
					</p>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
						<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg">
							<div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center p-3">
								<div className="text-center">
									<div className="text-xs md:text-sm font-medium text-[var(--color-text-primary)] leading-tight">2024 Healthcare Series A Funding Trends</div>
								</div>
							</div>
						</div>
						<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg">
							<div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center p-3">
								<div className="text-center">
									<div className="text-xs md:text-sm font-medium text-[var(--color-text-primary)] leading-tight">2023 Series C Trends Across Africa</div>
								</div>
							</div>
						</div>
						<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg">
							<div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 flex items-center justify-center p-3">
								<div className="text-center">
									<div className="text-xs md:text-sm font-medium text-[var(--color-text-primary)] leading-tight">2021 Deals in Africa: Fintech Insights & Trends</div>
								</div>
							</div>
						</div>
						<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-[var(--color-divider-gray)]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg">
							<div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 flex items-center justify-center p-3">
								<div className="text-center">
									<div className="text-xs md:text-sm font-medium text-[var(--color-text-primary)] leading-tight">2023 Clinical Trial Insights in Nigeria</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PricingPage; 