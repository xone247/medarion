export function badgeClassesFromVar(cssVar: string): string {
	return [
		`bg-[color-mix(in_srgb,var(${cssVar}),white_85%)]`,
		`dark:bg-[color-mix(in_srgb,var(${cssVar}),black_80%)]`,
		`text-[var(${cssVar})]`,
		`dark:text-[color-mix(in_srgb,var(${cssVar}),white_80%)]`,
		`border`,
		`border-[color-mix(in_srgb,var(${cssVar}),black_20%)]`,
		`dark:border-[color-mix(in_srgb,var(${cssVar}),white_20%)]`,
	].join(' ');
}

export function accentBgFromVar(cssVar: string): string {
	return [
		`bg-[color-mix(in_srgb,var(${cssVar}),white_75%)]`,
		`dark:bg-[color-mix(in_srgb,var(${cssVar}),black_75%)]`,
	].join(' ');
}

export function grantTypeToVar(type: string): string {
	const key = (type || '').toLowerCase();
	switch (true) {
		case key.includes('research'):
			return '--color-accent-sky';
		case key.includes('infrastructure'):
			return '--color-secondary-gold';
		case key.includes('innovation'):
			return '--color-primary-teal';
		case key.includes('capacity'):
			return '--color-success';
		case key.includes('digital'):
			return '--color-accent-sky';
		default:
			return '--color-neutral-taupe';
	}
}

export function dealStageToVar(stage: string): string {
	const key = (stage || '').toLowerCase();
	switch (true) {
		case key.includes('pre-seed'):
			return '--color-neutral-taupe';
		case key === 'seed' || key.includes('seed'):
			return '--color-success';
		case key.includes('series a'):
			return '--color-secondary-gold';
		case key.includes('series b'):
			return '--color-accent-sky';
		case key.includes('series c') || key.includes('series d'):
			return '--color-accent-sky';
		case key.includes('private equity') || key.includes('pe'):
			return '--color-error';
		case key.includes('grant'):
			return '--color-primary-teal';
		default:
			return '--color-neutral-taupe';
	}
} 