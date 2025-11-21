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
		<div className={`rounded-xl border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)] p-6 shadow-sm ${isPro ? 'ring-1 ring-[var(--color-primary)]' : ''}`}>
			<div className="flex items-center gap-2 mb-2">
				{isEnterprise ? <Shield className="h-5 w-5 text-[var(--color-primary)]"/> : isPro ? <Zap className="h-5 w-5 text-[var(--color-primary)]"/> : <BookOpen className="h-5 w-5 text-[var(--color-primary)]"/>}
				<h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h3>
			</div>
			<p className="text-[var(--color-text-secondary)] mb-4">{desc}</p>
			<div className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">{price} {secondary && (<span className="text-base font-normal text-[var(--color-text-secondary)]">{secondary}</span>)}</div>
			<ul className="space-y-2 mb-6">
				{features[variant].map((f) => (
					<li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
						<Check className="h-4 w-4 text-[var(--color-primary)] mt-0.5"/>
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
						src={(import.meta as any).env?.VITE_PRICING_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
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
							Pricing
						</h1>
						<p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
							Flexible plans for teams of all sizes
						</p>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
				<div className="text-center max-w-3xl mx-auto">
					<h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">Start for free. Scale when ready.</h2>
					<p className="text-[var(--color-text-secondary)] text-lg">Choose a plan that suits your workflow. Upgrade anytime as your needs grow.</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<PricingCard title="Starter" price="Free" desc="All essential features to get you started." cta="Get Started" variant="starter" onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:auth')); }} />
					<PricingCard title="Pro" price="$20" desc="Unlock advanced features for individuals." cta="Subscribe" secondary="/ month" variant="pro" onClick={() => { alert('Subscription flow placeholder'); }} />
					<PricingCard title="Enterprise" price="Custom" desc="Advanced security and controls for teams." cta="Talk to sales" variant="enterprise" onClick={() => { window.dispatchEvent(new CustomEvent('medarion:navigate:static', { detail: { page: 'contact' } })); }} />
				</div>

				<div className="rounded-xl border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)] p-6">
					<h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">What’s included</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

				<div className="rounded-xl border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)] p-6">
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