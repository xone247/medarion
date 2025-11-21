import React, { useEffect, useRef } from 'react';

interface StarsBackgroundProps {
	className?: string;
	density?: number; // stars per 10,000 px^2
	speed?: number;   // base speed
}

// Lightweight starfield animation for hero backgrounds
const StarsBackground: React.FC<StarsBackgroundProps> = ({ className = '', density = 0.12, speed = 0.2 }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationRef = useRef<number | null>(null);
	const starsRef = useRef<Array<{ x: number; y: number; z: number; r: number; vx: number; vy: number }>>([]);

	useEffect(() => {
		const canvas = canvasRef.current!;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let width = canvas.clientWidth;
		let height = canvas.clientHeight;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		ctx.scale(dpr, dpr);

		// Init stars based on area
		const area = (width * height) / 10000; // per 10k px^2
		const count = Math.max(60, Math.floor(area * density));
		starsRef.current = Array.from({ length: count }, () => ({
			x: Math.random() * width,
			y: Math.random() * height,
			z: Math.random() * 0.8 + 0.2,
			r: Math.random() * 1.4 + 0.3,
			vx: (Math.random() - 0.5) * speed,
			vy: (Math.random() - 0.5) * speed,
		}));

		let lastTs = 0;
		const draw = (ts: number) => {
			const dt = Math.min(33, ts - lastTs) / 16.67; // normalize vs 60fps
			lastTs = ts;

			// Theme-aware colors
			const isDark = document.documentElement.classList.contains('dark');
			const bgAlpha = isDark ? 0.35 : 0.18;
			ctx.clearRect(0, 0, width, height);
			// subtle radial vignette
			const grad = ctx.createRadialGradient(width*0.5, height*0.4, 0, width*0.5, height*0.5, Math.max(width, height));
			grad.addColorStop(0, `rgba(0,0,0,${bgAlpha})`);
			grad.addColorStop(1, `rgba(0,0,0,0)`);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, width, height);

			// Stars
			for (const s of starsRef.current) {
				s.x += s.vx * s.z * dt;
				s.y += s.vy * s.z * dt;
				// wrap
				if (s.x < -5) s.x = width + 5;
				if (s.x > width + 5) s.x = -5;
				if (s.y < -5) s.y = height + 5;
				if (s.y > height + 5) s.y = -5;
				// glow color from brand primary (teal-ish), softened in light mode
				const hue = 180; // teal base
				const sat = isDark ? 70 : 55;
				const lum = isDark ? 75 : 55;
				ctx.beginPath();
				ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
				ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lum}%, ${0.85 * s.z})`;
				ctx.shadowColor = `hsla(${hue}, ${sat}%, ${lum}%, 0.6)`;
				ctx.shadowBlur = 6 * s.z;
				ctx.fill();
			}

			ctx.shadowBlur = 0;
			animationRef.current = requestAnimationFrame(draw);
		};
		animationRef.current = requestAnimationFrame(draw);

		const handleResize = () => {
			width = canvas.clientWidth;
			height = canvas.clientHeight;
			const dprN = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.floor(width * dprN);
			canvas.height = Math.floor(height * dprN);
			ctx.scale(dprN, dprN);
		};
		window.addEventListener('resize', handleResize);
		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);
			window.removeEventListener('resize', handleResize);
		};
	}, [density, speed]);

	return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} aria-hidden />;
};

export default StarsBackground; 