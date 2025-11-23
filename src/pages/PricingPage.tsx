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
		<div className={`p-6 ${isPro ? '' : ''}`}>
			<div className="flex items-center gap-2 mb-2">
				{isEnterprise ? <Shield className="h-5 w-5 text-[var(--color-primary-teal)]"/> : isPro ? <Zap className="h-5 w-5 text-[var(--color-primary-teal)]"/> : <BookOpen className="h-5 w-5 text-[var(--color-primary-teal)]"/>}
				<h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h3>
			</div>
			<p className="text-[var(--color-text-secondary)] mb-4">{desc}</p>
			<div className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">{price} {secondary && (<span className="text-base font-normal text-[var(--color-text-secondary)]">{secondary}</span>)}</div>
			<ul className="space-y-2 mb-6">
				{features[variant].map((f) => (
					<li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
						<Check className="h-4 w-4 text-[var(--color-primary-teal)] mt-0.5"/>
						<span>{f}</span>
					</li>
				))}
			</ul>
			<button onClick={onClick} className={`${isPro ? 'btn-primary' : 'btn-outline'} w-full py-2 rounded`}>{cta}</button>
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
						<div className="page-hero-accent" />
						<h1 className="page-hero-heading">
							Pricing
						</h1>
						<p className="page-hero-subtext">
							Flexible plans for teams of all sizes
						</p>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
				<div className="text-center max-w-3xl mx-auto px-4">
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">Start for free. Scale when ready.</h2>
					<p className="text-[var(--color-text-secondary)] text-base sm:text-lg">Choose a plan that suits your workflow. Upgrade anytime as your needs grow.</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
					<PricingCard title="Starter" price="Free" desc="All essential features to get you started." cta="Get Started" variant="starter" onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:auth')); }} />
					<PricingCard title="Pro" price="$20" desc="Unlock advanced features for individuals." cta="Subscribe" secondary="/ month" variant="pro" onClick={() => { alert('Subscription flow placeholder'); }} />
					<PricingCard title="Enterprise" price="Custom" desc="Advanced security and controls for teams." cta="Talk to sales" variant="enterprise" onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:static', { detail: { page: 'contact' } })); }} />
				</div>

				<div className="p-6">
					<h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">What's included</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div>
							<div className="font-medium mb-2">Starter</div>
							<ul className="space-y-2 text-[var(--color-text-secondary)]">
								{features.starter.map(f => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-[var(--color-primary)]"/>{f}</li>)}
							</ul>
						</div>
						<div>
							<div className="font-medium mb-2">Pro</div>
							<ul className="space-y-2 text-[var(--color-text-secondary)]">
								{features.pro.map(f => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-[var(--color-primary)]"/>{f}</li>)}
							</ul>
						</div>
						<div>
							<div className="font-medium mb-2">Enterprise</div>
							<ul className="space-y-2 text-[var(--color-text-secondary)]">
								{features.enterprise.map(f => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-[var(--color-primary)]"/>{f}</li>)}
							</ul>
						</div>
					</div>
				</div>

				<div className="p-6">
					<h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Enterprise-grade security</h3>
					<ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
						<li className="flex items-center gap-2"><Lock className="h-4 w-4"/> SSO and identity provider integration</li>
						<li className="flex items-center gap-2"><Users className="h-4 w-4"/> User provisioning and role-based access</li>
						<li className="flex items-center gap-2"><HeadphonesIcon className="h-4 w-4"/> Dedicated support and onboarding</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default PricingPage; 