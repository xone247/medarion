import React, { useEffect, useRef, useState } from 'react';
import { africanCountriesMapData, mapLegend, CountryData } from '../data/mapData';
import { useTheme } from '../contexts/ThemeContext';
import { getApiUrl } from '../config/api';

interface InteractiveMapProps {
	title?: string;
	dataType?: 'value' | 'count' | 'investment';
	height?: number;
	heightSm?: number;
	showLegend?: boolean;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
	title = 'African Healthcare Investment Map', 
	dataType = 'investment', 
	height = 400,
	heightSm = 280,
	showLegend = true 
}) => {
	const mapContainer = useRef<HTMLDivElement | null>(null);
	const map = useRef<any>(null);
	const [mapError, setMapError] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
	const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
	const hoveredFeatureId = useRef<string | number | null>(null);
	const { theme } = useTheme();
	const [isSmall, setIsSmall] = useState(false);
	const [countryData, setCountryData] = useState<CountryData[]>([]);
	const [loading, setLoading] = useState(true);

	// Fetch country investment data from database
	useEffect(() => {
		const fetchCountryData = async () => {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
				
				const response = await fetch(getApiUrl('/countries/investment'), {
					signal: controller.signal
				});
				clearTimeout(timeoutId);
				const result = await response.json();
				
				if (result.success && result.data) {
					// Merge database data with static mapData (for coordinates, codes, etc.)
					const mergedData = africanCountriesMapData.map((staticCountry) => {
						const dbCountry = result.data.find((c: any) => 
							c.country.toLowerCase() === staticCountry.name.toLowerCase()
						);
						
						if (dbCountry) {
							// Determine color based on investment level - Cursor.com monochrome style
							const isDark = theme === 'dark';
							let color = isDark ? '#2d3748' : '#e5e7eb'; // default gray
							if (dbCountry.investment_level === 'high') color = isDark ? '#718096' : '#6b7280'; // medium gray
							else if (dbCountry.investment_level === 'medium') color = isDark ? '#4a5568' : '#9ca3af'; // lighter gray
							else if (dbCountry.investment_level === 'low') color = isDark ? '#2d3748' : '#d1d5db'; // lightest gray
							
							return {
								...staticCountry,
								totalInvestment: dbCountry.total_investment || 0,
								dealCount: dbCountry.deal_count || 0,
								companies: dbCountry.company_count || 0,
								investmentLevel: dbCountry.investment_level || 'low',
								sectors: dbCountry.sectors || [],
								topCompanies: dbCountry.top_companies || [],
								healthcareIndicators: dbCountry.healthcare_indicators ? {
									lifeExpectancy: dbCountry.healthcare_indicators.life_expectancy || 0,
									healthcareSpending: dbCountry.healthcare_indicators.healthcare_spending || 0,
									doctorDensity: dbCountry.healthcare_indicators.doctor_density || 0,
									hospitalBeds: dbCountry.healthcare_indicators.hospital_beds || 0
								} : staticCountry.healthcareIndicators,
								investmentTrends: {
									growth: dbCountry.growth || 0,
									focus: dbCountry.sectors || staticCountry.investmentTrends.focus,
									challenges: staticCountry.investmentTrends.challenges // Keep static for now
								},
								color
							};
						}
						return staticCountry; // Keep static data if no database match
					});
					
					setCountryData(mergedData);
				} else {
					// Fallback to static data if API fails
					setCountryData(africanCountriesMapData);
				}
			} catch (error: any) {
				if (error.name === 'AbortError') {
					console.warn('Country data fetch timeout, using static data');
				} else {
					console.error('Error fetching country data:', error);
				}
				// Fallback to static data
				setCountryData(africanCountriesMapData);
			} finally {
				setLoading(false);
			}
		};
		
		fetchCountryData();
	}, []);

	useEffect(() => {
		const onResize = () => setIsSmall(window.innerWidth < 640);
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const addSourcesAndLayers = () => {
		if (!map.current || countryData.length === 0) return;
		// Countries vector source (Mapbox)
		if (!map.current.getSource('countries')) {
			map.current.addSource('countries', {
				type: 'vector',
				url: 'mapbox://mapbox.country-boundaries-v1'
			});
		}

		// Get current theme from the map's style or use context
		const currentTheme = theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
		
		// Build color match expression for country fills - Cursor.com monochrome style
		const isDark = currentTheme === 'dark';
		const defaultColor = isDark ? '#2d3748' : '#e5e7eb';
		const hoverColor = isDark ? '#718096' : '#6b7280';
		const borderColor = isDark ? '#4a5568' : '#d1d5db';
		
		const colorMatch: any[] = ['match', ['get', 'name_en']];
		countryData.forEach((c: CountryData) => { colorMatch.push(c.name, c.color || defaultColor); });
		colorMatch.push(defaultColor);

		// Restrict to our listed African countries by English name
		const countryFilter: any[] = ['in', 'name_en'];
		countryData.forEach((c: CountryData) => countryFilter.push(c.name));
		
		// Add a layer to hide all non-African countries by making them transparent
		if (!map.current.getLayer('non-africa-fills')) {
			map.current.addLayer({
				id: 'non-africa-fills',
				type: 'fill',
				source: 'countries',
				'source-layer': 'country_boundaries',
				paint: {
					'fill-color': defaultColor,
					'fill-opacity': 0.1 // Very transparent for non-African countries
				},
				filter: ['!', countryFilter] // Everything NOT in our filter
			});
		}

		if (!map.current.getLayer('country-fills')) {
			map.current.addLayer({
				id: 'country-fills',
				type: 'fill',
				source: 'countries',
				'source-layer': 'country_boundaries',
				paint: {
					'fill-color': [
						'case',
						['boolean', ['feature-state', 'hover'], false],
						hoverColor,
						colorMatch
					],
					'fill-opacity': [
						'case',
						['boolean', ['feature-state', 'hover'], false], 0.9,
						0.7
					]
				},
				filter: countryFilter
			});
		}

		if (!map.current.getLayer('country-borders')) {
			map.current.addLayer({
				id: 'country-borders',
				type: 'line',
				source: 'countries',
				'source-layer': 'country_boundaries',
				paint: {
					'line-color': borderColor,
					'line-width': 1,
					'line-opacity': 0.8
				},
				filter: countryFilter
			});
		}

		// Rebind interactions
		if (!map.current.__medarionBound) {
			map.current.on('mousemove', 'country-fills', (e: any) => {
				if (!e.features?.length) return;
				const feature = e.features[0];
				const fid = feature.id ?? feature.properties?.mapbox_id ?? feature.properties?.name_en;
				if (hoveredFeatureId.current !== null) {
					map.current.setFeatureState({ source: 'countries', sourceLayer: 'country_boundaries', id: hoveredFeatureId.current }, { hover: false });
				}
				hoveredFeatureId.current = fid;
				map.current.setFeatureState({ source: 'countries', sourceLayer: 'country_boundaries', id: fid }, { hover: true });
				setHoveredCountry(feature.properties?.name_en || null);
				map.current.getCanvas().style.cursor = 'pointer';
			});
			map.current.on('mouseleave', 'country-fills', () => {
				if (hoveredFeatureId.current !== null) {
					map.current.setFeatureState({ source: 'countries', sourceLayer: 'country_boundaries', id: hoveredFeatureId.current }, { hover: false });
					hoveredFeatureId.current = null;
				}
				setHoveredCountry(null);
				map.current.getCanvas().style.cursor = '';
			});
			map.current.on('click', 'country-fills', (e: any) => {
				if (!e.features?.length) return;
				const name = e.features[0].properties?.name_en as string;
				const foundCountry = countryData.find((c: CountryData) => c.name === name);
				if (foundCountry) setSelectedCountry(foundCountry);
			});
			map.current.__medarionBound = true;
		}
	};

	useEffect(() => {
		if (map.current || !mapContainer.current) return;

		if ((window as any).mapboxgl) {
			try {
				(window as any).mapboxgl.accessToken = 'pk.eyJ1IjoieG9uZXJvY2tzIiwiYSI6ImNtYm5nYmV6MTFndjgyanBqNmt5a3U1MjMifQ.LnwikwgA-Y_VzONNW7EcNg';
				const styleId = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
				map.current = new (window as any).mapboxgl.Map({
					container: mapContainer.current as HTMLDivElement,
					style: styleId,
					center: [20, 0],
					zoom: 3,
					projection: 'mercator',
					// Restrict to Africa only - bounds: [minLng, minLat, maxLng, maxLat]
					maxBounds: [[-20, -35], [55, 38]], // Africa continent bounds
					minZoom: 2.5,
					maxZoom: 8
				});
				// Single load handler that does everything
				map.current.on('load', () => {
					// Fit to Africa bounds: [minLng, minLat], [maxLng, maxLat]
					map.current.fitBounds([[-20, -35], [55, 38]], {
						padding: { top: 50, bottom: 50, left: 50, right: 50 },
						duration: 1000
					});
					
					// Add layers after fitBounds completes
					if (countryData.length > 0) {
						setTimeout(() => addSourcesAndLayers(), 1100);
					} else {
						// Wait for country data to load with timeout
						let attempts = 0;
						const maxAttempts = 50; // 5 seconds max wait
						const checkData = setInterval(() => {
							attempts++;
							if (countryData.length > 0) {
								clearInterval(checkData);
								setTimeout(() => addSourcesAndLayers(), 100);
							} else if (attempts >= maxAttempts) {
								clearInterval(checkData);
								console.warn('Map: Country data not loaded after timeout, using static data');
								setCountryData(africanCountriesMapData);
								setTimeout(() => addSourcesAndLayers(), 100);
							}
						}, 100);
					}
				});

				map.current.on('error', () => {
					setMapError(true);
				});

			} catch (error) {
				console.error('Map initialization error:', error);
				setMapError(true);
			}
		} else {
			setMapError(true);
		}

		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, [countryData.length]);

	// Switch map style on theme change and re-add layers so colors/contrast match
	useEffect(() => {
		if (!map.current) return;
		try {
			const styleId = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
			map.current.setStyle(styleId);
			map.current.once('style.load', () => {
				// Ensure bounds are maintained
				map.current.setMaxBounds([[-20, -35], [55, 38]]);
				// Re-add layers with new theme colors
				if (countryData.length > 0) {
					addSourcesAndLayers();
				}
			});
		} catch {}
	}, [theme, countryData.length]);

	const formatCurrency = (amount: number) => {
		if (amount >= 1000000) {
			return `$${(amount / 1000000).toFixed(1)}M`;
		} else if (amount >= 1000) {
			return `$${(amount / 1000).toFixed(1)}K`;
		}
		return `$${amount.toFixed(0)}`;
	};

	if (mapError) {
		return (
			<div className="card p-6 text-center">
				<div className="text-[var(--color-text-secondary)] mb-4">
					<svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
					</svg>
				</div>
				<h3 className="text-lg font-medium text-[var(--color-text-primary)]">Map Unavailable</h3>
				<p className="text-[var(--color-text-secondary)]">Interactive map is currently unavailable. Please try again later.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="card p-6 text-center">
				<div className="text-[var(--color-text-secondary)] mb-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-teal)] mx-auto"></div>
				</div>
				<p className="text-[var(--color-text-secondary)]">Loading map data...</p>
			</div>
		);
	}

	return (
		<div className="tile">
			<div className="tile-header">
				<h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
				<p className="text-sm text-[var(--color-text-secondary)] mt-1">Click on a country to view details. Metric: {dataType}</p>
			</div>
			
			<div className="relative">
				<div 
					ref={mapContainer} 
					className="w-full"
					style={{ height: `${isSmall ? heightSm : height}px` }}
				/>
				
				{hoveredCountry && (
					<div className="absolute bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-lg shadow-lg p-3 pointer-events-none z-10"
					     style={{ 
					       left: '50%', 
					       top: '20px', 
					       transform: 'translateX(-50%)',
					       maxWidth: '300px'
					     }}>
						<div className="text-sm font-medium text-[var(--color-text-primary)]">{hoveredCountry}</div>
						<div className="text-xs text-[var(--color-text-secondary)] mt-1">Click for details</div>
					</div>
				)}

				{showLegend && (
					<div className="absolute bottom-4 right-4 bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-lg shadow-lg p-3">
						<div className="text-xs font-medium text-[var(--color-text-primary)] mb-2">Investment Level</div>
						<div className="space-y-1">
							{mapLegend.map((item) => (
								<div key={item.level} className="flex items-center space-x-2">
									<div 
										className="w-3 h-3 rounded-full" 
										style={{ backgroundColor: item.color }}
									/>
									<span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{selectedCountry && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-[var(--color-background-surface)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-divider-gray)]">
						<div className="p-6">
							<div className="flex justify-between items-start mb-4">
								<h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{selectedCountry.name}</h3>
								<button
									onClick={() => setSelectedCountry(null)}
									className="text-[var(--color-text-secondary)] hover:opacity-80"
								>
									<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div>
									<h4 className="font-medium text-[var(--color-text-primary)] mb-3">Investment Overview</h4>
									<div className="space-y-2 text-[var(--color-text-primary)]/90">
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Total Investment:</span>
											<span className="text-sm font-medium">{formatCurrency(selectedCountry.totalInvestment)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Deal Count:</span>
											<span className="text-sm font-medium">{selectedCountry.dealCount}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Companies:</span>
											<span className="text-sm font-medium">{selectedCountry.companies}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Growth Rate:</span>
											<span className="text-sm font-medium text-success">+{selectedCountry.investmentTrends.growth}%</span>
										</div>
									</div>
								</div>

								<div>
									<h4 className="font-medium text-[var(--color-text-primary)] mb-3">Healthcare Indicators</h4>
									<div className="space-y-2">
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Life Expectancy:</span>
											<span className="text-sm font-medium">{selectedCountry.healthcareIndicators.lifeExpectancy} years</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Healthcare Spending:</span>
											<span className="text-sm font-medium">{selectedCountry.healthcareIndicators.healthcareSpending}% of GDP</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Doctors per 1K:</span>
											<span className="text-sm font-medium">{selectedCountry.healthcareIndicators.doctorDensity}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-[var(--color-text-secondary)]">Hospital Beds per 1K:</span>
											<span className="text-sm font-medium">{selectedCountry.healthcareIndicators.hospitalBeds}</span>
										</div>
									</div>
								</div>

								<div className="col-span-2">
									<h4 className="font-medium text-[var(--color-text-primary)] mb-3">Key Sectors</h4>
									<div className="flex flex-wrap gap-2">
										{selectedCountry.sectors.map((sector) => (
											<span
												key={sector}
												className="px-3 py-1 chip text-xs rounded-full"
											>
												{sector}
											</span>
										))}
									</div>
								</div>

								<div className="col-span-2">
									<h4 className="font-medium text-[var(--color-text-primary)] mb-3">Top Companies</h4>
									<div className="grid grid-cols-4 gap-2">
										{selectedCountry.topCompanies.map((company) => (
											<span
												key={company}
												className="px-3 py-2 chip text-sm text-center"
											>
												{company}
											</span>
										))}
									</div>
								</div>

								<div className="col-span-2">
									<h4 className="font-medium text-[var(--color-text-primary)] mb-3">Investment Focus</h4>
									<div className="flex flex-wrap gap-2">
										{selectedCountry.investmentTrends.focus.map((focus) => (
											<span
												key={focus}
												className="px-3 py-1 badge text-xs"
											>
												{focus}
											</span>
										))}
									</div>
								</div>

								<div className="col-span-2">
									<h4 className="font-medium text-[var(--color-text-primary)] mb-3">Key Challenges</h4>
									<div className="flex flex-wrap gap-2">
										{selectedCountry.investmentTrends.challenges.map((challenge) => (
											<span
												key={challenge}
												className="px-3 py-1 badge text-xs text-error"
											>
												{challenge}
											</span>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default InteractiveMap;