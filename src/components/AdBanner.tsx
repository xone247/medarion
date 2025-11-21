import React, { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';

interface AdBannerProps {
  placement: 'sidebar' | 'blog_header' | 'blog_content';
  userTier?: 'free' | 'premium' | 'enterprise';
  className?: string;
}

interface Ad {
  id: number;
  title: string;
  advertiser: string;
  image_url: string;
  cta_text: string;
  target_url: string;
  category: string;
  target_tier: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  placement, 
  userTier = 'free', 
  className = '' 
}) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [placement, userTier]);

  const fetchAd = async () => {
    try {
      const response = await fetch(`/api/ads/random?placement=${placement}&tier=${userTier}`);
      const data = await response.json();
      
      if (data.success && data.ad) {
        setAd(data.ad);
        // Track impression
        trackImpression(data.ad.id, placement);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (adId: number, placement: string) => {
    try {
      await fetch('/api/ads/impression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: adId,
          placement: placement,
          page_url: window.location.href
        })
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const handleClick = async () => {
    if (!ad) return;
    
    // Track click
    try {
      await fetch('/api/ads/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: ad.id,
          placement: placement,
          page_url: window.location.href
        })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    
    // Open ad URL
    window.open(ad.target_url, '_blank');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || !ad || dismissed) {
    return null;
  }

  const getAdStyles = () => {
    switch (placement) {
      case 'sidebar':
        return 'w-full max-w-xs mx-auto';
      case 'blog_header':
        return 'w-full max-w-4xl mx-auto';
      case 'blog_content':
        return 'w-full max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className={`relative ${getAdStyles()} ${className}`}>
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Ad Content */}
        <div 
          className="cursor-pointer group"
          onClick={handleClick}
        >
          {ad.image_url && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img 
                src={ad.image_url} 
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 line-clamp-2">
                  {ad.title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                  Sponsored by {ad.advertiser}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
                title="Dismiss ad"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-secondary)]">Ad</span>
              <div className="flex items-center gap-1 text-xs text-[var(--color-primary-teal)] group-hover:text-[var(--color-primary-dark)] transition-colors">
                <span>{ad.cta_text || 'Learn More'}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;




















