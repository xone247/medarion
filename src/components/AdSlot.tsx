import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ACCESS_MATRIX, type AdPolicy } from '../types/accessControl';

export type AdPlacement = 'blog_top' | 'blog_inline' | 'blog_sidebar' | 'blog_grid' | 'blog_bottom' | 'dashboard_sidebar' | 'dashboard_inline';
export type AdCategory = 'blog_general' | 'dashboard_personalized';

interface AdSlotProps {
	placement: AdPlacement;
	category: AdCategory;
	hidden?: boolean;
}

type UiAd = {
    id: number;
	title: string;
    image_url: string;
    cta_text: string;
    target_url: string;
	advertiser?: string;
    category: string;
    placements: string[];
};

function useAdsFromDb(category: AdCategory, placement: AdPlacement): UiAd[] {
    const [ads, setAds] = useState<UiAd[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                params.append('placement', placement);
                params.append('category', category);
                params.append('limit', '1');
                // Use relative path - the .htaccess will handle routing
                const res = await fetch(`/api/ads/public.php?${params.toString()}`, {
                    method: 'GET'
                });
                if (!res.ok) throw new Error('Failed to fetch ads');
                const data = await res.json();
                const items: UiAd[] = (data.ads || []) as UiAd[];
                setAds(items);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching ads:', error);
                setLoading(false);
            }
        })();
    }, [category, placement]);
    
    if (loading) {
        return [];
    }
    
    return ads;
}

const AdSlot: React.FC<AdSlotProps> = ({ placement, category, hidden }) => {
	const { profile } = useAuth();

	// Global ads toggle from admin config
	try {
		const rawCfg = localStorage.getItem('medarionConfig');
		if (rawCfg) {
			const cfg = JSON.parse(rawCfg) as { adsEnabled?: boolean };
			if (cfg.adsEnabled === false) return null;
		}
	} catch {}

	// Compute hidden from account ad policy
	// Show ads for free accounts AND admin (so admin can see how ads look)
	// Hide ads for paid accounts (they'll see announcements instead)
	let hiddenByPolicy = false;
	try {
		if (profile && (profile as any).user_type) {
			const role = (profile as any).user_type as keyof typeof ACCESS_MATRIX;
			const tier = ((profile as any).account_tier || 'free') as keyof typeof ACCESS_MATRIX[typeof role];
			const isAdmin = (profile as any).is_admin === true || (profile as any).is_admin === 1 || 
			              (profile as any).role === 'admin' || 
			              (Array.isArray((profile as any).app_roles) && (profile as any).app_roles.includes('super_admin'));
			
			// Always show ads to admin and free accounts
			if (isAdmin || tier === 'free') {
				hiddenByPolicy = false;
			} else {
				// Hide ads for paid accounts (they'll see announcements)
				const policy = (ACCESS_MATRIX as any)?.[role]?.[tier]?.adPolicy as AdPolicy | undefined;
				if (policy) {
					const isBlog = placement === 'blog_top' || placement === 'blog_inline' || placement === 'blog_sidebar' || placement === 'blog_bottom';
					if (policy === 'none') hiddenByPolicy = true;
					if (policy === 'blog-only' && !isBlog) hiddenByPolicy = true;
				} else {
					// Default: hide ads for paid accounts
					hiddenByPolicy = true;
				}
			}
		}
	} catch {}

	if (hidden || hiddenByPolicy) return null;
    const ads = useAdsFromDb(category, placement);

	if (ads.length > 0) {
		const ad = ads[0];
		return (
            <a
                href={ad.target_url}
                target="_blank"
                rel="noreferrer"
                className="block bg-background-surface border border-divider rounded-lg overflow-hidden"
                onClick={() => {
                    try {
                        fetch('/api/ads/track.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ad_id: ad.id, event_type: 'click', placement, category })
                        });
                    } catch {}
                }}
            >
                {ad.image_url && (
                    <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-full h-28 object-cover"
                        onLoad={() => {
                            try {
                                fetch('/api/ads/track.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ad_id: ad.id, event_type: 'view', placement, category })
                                });
                            } catch {}
                        }}
                    />
				)}
				<div className="p-3">
					<div className="text-xs text-text-secondary mb-1">Sponsored • {ad.advertiser || 'Advertiser'}</div>
					<div className="text-sm font-medium text-text-primary">{ad.title}</div>
                    <div className="mt-2 inline-block text-xs px-2 py-1 rounded bg-primary-600 text-white">{ad.cta_text || 'Learn more'}</div>
				</div>
			</a>
		);
	}

	return (
		<div className="bg-background p-3 border border-divider rounded-lg text-text-secondary text-xs">
			<div className="flex items-center justify-between">
				<span>Ad • {category.replace('_', ' ')}</span>
				<span className="text-text-primary font-medium">{placement.replace('_', ' ')}</span>
			</div>
		</div>
	);
};

export default AdSlot; 