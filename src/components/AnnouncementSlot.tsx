import type React from 'react';
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AnnouncementSlotProps {
	placement?: 'blog_sidebar' | 'dashboard_sidebar';
}

type Announcement = {
	id: number;
	title: string;
	message: string;
	image_url?: string;
	action_url?: string;
	action_text?: string;
	expires_at?: string;
	created_at: string;
};

const AnnouncementSlot: React.FC<AnnouncementSlotProps> = ({ placement = 'blog_sidebar' }) => {
	const { profile } = useAuth();
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [loading, setLoading] = useState(true);
	const [dismissed, setDismissed] = useState<number[]>([]);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				// Get dismissed announcements from localStorage
				const dismissedStr = localStorage.getItem('dismissed_announcements');
				const dismissedIds = dismissedStr ? JSON.parse(dismissedStr) : [];
				setDismissed(dismissedIds);

				// Fetch active announcements
				const res = await fetch(`/api/blog/announcements/public?placement=${placement}&limit=3`);
				if (!res.ok) throw new Error('Failed to fetch announcements');
				const data = await res.json();
				const items: Announcement[] = (data.announcements || []) as Announcement[];
				
				// Filter out expired and dismissed announcements
				const now = new Date();
				const active = items.filter(ann => {
					if (dismissedIds.includes(ann.id)) return false;
					if (ann.expires_at && new Date(ann.expires_at) < now) return false;
					return true;
				});
				
				setAnnouncements(active);
			} catch (error) {
				console.error('Error fetching announcements:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [placement]);

	const handleDismiss = (id: number) => {
		const newDismissed = [...dismissed, id];
		setDismissed(newDismissed);
		localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
		setAnnouncements(prev => prev.filter(a => a.id !== id));
	};

	if (loading || announcements.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			{announcements.map(ann => (
				<div
					key={ann.id}
					className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm relative"
				>
					<button
						onClick={() => handleDismiss(ann.id)}
						className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
						aria-label="Dismiss announcement"
					>
						<X className="h-4 w-4" />
					</button>
					
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
							<Bell className="h-5 w-5 text-white" />
						</div>
						<div className="flex-1 min-w-0">
							<h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
								{ann.title}
							</h4>
							<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
								{ann.message}
							</p>
							{ann.image_url && (
								<img
									src={ann.image_url}
									alt={ann.title}
									className="w-full h-32 object-cover rounded-lg mb-2"
								/>
							)}
							{ann.action_url && ann.action_text && (
								<a
									href={ann.action_url}
									className="inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
								>
									{ann.action_text} →
								</a>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default AnnouncementSlot;

