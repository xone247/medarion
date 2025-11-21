import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Navbar: React.FC = () => {
	const { theme, toggleTheme } = useTheme();
	return (
		<header className="w-full sticky top-0 z-40 hairline shadow-soft" style={{ 
			background: 'rgba(255, 255, 255, 0.15)',
			backdropFilter: 'blur(20px)',
			WebkitBackdropFilter: 'blur(20px)',
			borderRadius: '14px',
			border: '1px solid rgba(255, 255, 255, 0.2)'
		}}>
			<div className="page-container h-14 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-md bg-[var(--color-primary-teal)]" />
					<span className="font-semibold text-gray-900 dark:text-white">Medarion</span>
				</div>
				<div className="flex items-center gap-3">
					<button className="btn-outline btn-sm" onClick={toggleTheme}>
						{theme === 'dark' ? 'Light' : 'Dark'}
					</button>
				</div>
			</div>
		</header>
	);
};

export default Navbar;




