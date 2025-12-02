import React, { useEffect, useRef, useState } from 'react';
import { africanCountriesMapData, mapLegend, CountryData } from '../data/mapData';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/apiService';

interface InteractiveMapProps {
	title?: string;
	dataType?: 'value' | 'count' | 'investment';
	height?: number;
	heightSm?: number;
	showLegend?: boolean;
	showPopup?: boolean; // Option to disable popup
	deals?: Array<{ country: string; value_usd: number; date?: string }>;
	itemType?: 'deal' | 'grant' | 'investment'; // Type of data being displayed
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
	title = 'African Healthcare Investment Map', 
	dataType = 'investment', 
	height = 400,
	heightSm = 280,
	showLegend = true,
	showPopup = true, // Default to showing popup
	deals = [],
	itemType = 'investment' // Default to 'investment' for backward compatibility
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

	// Process deals data or fetch from API
	useEffect(() => {
		const processCountryData = async () => {
			try {
				let countryInvestmentData: any[] = [];
				
				// If deals are provided, aggregate them by country
				if (deals && deals.length > 0) {
					console.log('[InteractiveMap] Processing', deals.length, 'deals');
					const countryMap = new Map<string, { total: number; count: number }>();
					
					deals.forEach((deal: any) => {
						const country = deal.country || '';
						if (!country) return;
						
						const value = parseFloat(deal.value_usd || deal.amount || 0);
						if (isNaN(value) || value <= 0) return;
						
						const existing = countryMap.get(country) || { total: 0, count: 0 };
						countryMap.set(country, {
							total: existing.total + value,
							count: existing.count + 1
						});
					});
					
					// Determine investment level based on dataType
					countryInvestmentData = Array.from(countryMap.entries()).map(([country, data]) => {
						// For 'count' dataType, use count to determine level; for 'value' or 'investment', use total
						let investment_level: 'high' | 'medium' | 'low';
						if (dataType === 'count') {
							investment_level = data.count > 10 ? 'high' : data.count > 5 ? 'medium' : 'low';
						} else {
							investment_level = data.total > 50000000 ? 'high' : data.total > 10000000 ? 'medium' : 'low';
						}
						
						return {
							country,
							total_investment: data.total,
							deal_count: data.count,
							investment_level
						};
					});
					
					console.log('[InteractiveMap] Aggregated to', countryInvestmentData.length, 'countries');
				} else {
					// Fallback to API if no deals provided
					const result = await apiService.get('/countries/investment');
					if (result.success && result.data) {
						countryInvestmentData = result.data;
						console.log('[InteractiveMap] Loaded from API:', countryInvestmentData.length, 'countries');
					}
				}
				
				// Create a country name mapping for better matching
				const countryNameMap: Record<string, string> = {
					'south africa': 'South Africa',
					'egypt': 'Egypt',
					'nigeria': 'Nigeria',
					'kenya': 'Kenya',
					'ghana': 'Ghana',
					'morocco': 'Morocco',
					'tunisia': 'Tunisia',
					'algeria': 'Algeria',
					'ethiopia': 'Ethiopia',
					'tanzania': 'Tanzania',
					'uganda': 'Uganda',
					'senegal': 'Senegal',
					'ivory coast': 'Ivory Coast',
					'côte d\'ivoire': 'Ivory Coast',
					'cote d\'ivoire': 'Ivory Coast',
					'zambia': 'Zambia',
					'zimbabwe': 'Zimbabwe',
					'mozambique': 'Mozambique',
					'angola': 'Angola',
					'cameroon': 'Cameroon',
					'sudan': 'Sudan',
					'madagascar': 'Madagascar',
					'mali': 'Mali',
					'burkina faso': 'Burkina Faso',
					'niger': 'Niger',
					'malawi': 'Malawi',
					'rwanda': 'Rwanda',
					'benin': 'Benin',
					'guinea': 'Guinea',
					'chad': 'Chad',
					'sierra leone': 'Sierra Leone',
					'togo': 'Togo',
					'libya': 'Libya',
					'mauritania': 'Mauritania',
					'eritrea': 'Eritrea',
					'gambia': 'Gambia',
					'botswana': 'Botswana',
					'gabon': 'Gabon',
					'lesotho': 'Lesotho',
					'guinea-bissau': 'Guinea-Bissau',
					'equatorial guinea': 'Equatorial Guinea',
					'mauritius': 'Mauritius',
					'eswatini': 'Eswatini',
					'djibouti': 'Djibouti',
					'comoros': 'Comoros',
					'cape verde': 'Cape Verde',
					'sao tome and principe': 'São Tomé and Príncipe',
					'seychelles': 'Seychelles'
				};
				
				// Merge with static map data
				const mergedData = africanCountriesMapData.map((staticCountry) => {
					const dbCountry = countryInvestmentData.find((c: any) => {
						const countryName = (c.country || '').toLowerCase().trim();
						const staticName = staticCountry.name.toLowerCase().trim();
						const normalizedName = countryNameMap[countryName]?.toLowerCase() || countryName;
						
						return countryName === staticName || 
						       normalizedName === staticName ||
						       countryName.includes(staticName) || 
						       staticName.includes(countryName) ||
						       normalizedName.includes(staticName) ||
						       staticName.includes(normalizedName);
					});
					
					if (dbCountry) {
						const isDark = theme === 'dark';
						const total = dbCountry.total_investment || 0;
						const count = dbCountry.deal_count || 0;
						
						// Color scheme using green/emerald - matches investment levels
						// For 'count' dataType, use count; for 'value' or 'investment', use total
						let color: string;
						let investmentLevel = dbCountry.investment_level;
						
						if (dataType === 'count') {
							// Use count to determine level
							if (count > 10 || investmentLevel === 'high') {
								color = isDark ? '#10b981' : '#059669'; // Emerald-500 / Emerald-600
							} else if (count > 5 || investmentLevel === 'medium') {
								color = isDark ? '#34d399' : '#10b981'; // Emerald-400 / Emerald-500
							} else if (count > 0) {
								color = isDark ? '#6ee7b7' : '#34d399'; // Emerald-300 / Emerald-400
							} else {
								color = isDark ? '#4b5563' : '#e5e7eb'; // Gray-600 / Gray-200
							}
						} else {
							// Use total investment to determine level
							if (investmentLevel === 'high' || total > 50000000) {
								color = isDark ? '#10b981' : '#059669'; // Emerald-500 / Emerald-600
							} else if (investmentLevel === 'medium' || total > 10000000) {
								color = isDark ? '#34d399' : '#10b981'; // Emerald-400 / Emerald-500
							} else if (total > 0) {
								color = isDark ? '#6ee7b7' : '#34d399'; // Emerald-300 / Emerald-400
							} else {
								color = isDark ? '#4b5563' : '#e5e7eb'; // Gray-600 / Gray-200
							}
						}
						
						return {
							...staticCountry,
							totalInvestment: total,
							dealCount: dbCountry.deal_count || 0,
							companies: dbCountry.company_count || 0,
							investmentLevel: dbCountry.investment_level || 'low',
							color // Override static color with calculated color
						};
					}
					// For static countries without data, ensure they use green scheme, not red
					const isDark = theme === 'dark';
					let staticColor: string;
					if (staticCountry.investmentLevel === 'high') {
						staticColor = isDark ? '#10b981' : '#059669';
					} else if (staticCountry.investmentLevel === 'medium') {
						staticColor = isDark ? '#34d399' : '#10b981';
					} else if (staticCountry.investmentLevel === 'low') {
						staticColor = isDark ? '#6ee7b7' : '#34d399';
					} else {
						staticColor = isDark ? '#4b5563' : '#e5e7eb';
					}
					// Replace any red colors with green
					if (staticCountry.color === '#EF4444' || staticCountry.color?.toLowerCase().includes('ef4444')) {
						return { ...staticCountry, color: staticColor };
					}
					return { ...staticCountry, color: staticColor };
				});
				
				console.log('[InteractiveMap] Merged data:', mergedData.filter(c => c.totalInvestment > 0).length, 'countries with data');
				
				setCountryData(mergedData);
			} catch (error: any) {
				console.error('[InteractiveMap] Error processing country data:', error);
				setCountryData(africanCountriesMapData);
			} finally {
				setLoading(false);
			}
		};
		
		processCountryData();
	}, [deals, theme, dataType]);

	useEffect(() => {
		const onResize = () => setIsSmall(window.innerWidth < 640);
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const addSourcesAndLayers = () => {
		if (!map.current) {
			console.log('[InteractiveMap] Cannot add layers - map not ready');
			return;
		}
		
		// Use countryData if available, otherwise use static data with proper colors
		let dataToUse = countryData.length > 0 ? countryData : africanCountriesMapData.map(c => {
			// Ensure static data has proper colors (not red) based on investment level
			const isDark = theme === 'dark';
			let color = c.color;
			if (c.color === '#EF4444' || c.color?.toLowerCase().includes('ef4444')) {
				// Replace red with appropriate green/emerald based on investment level
				if (c.investmentLevel === 'high') {
					color = isDark ? '#10b981' : '#059669';
				} else if (c.investmentLevel === 'medium') {
					color = isDark ? '#34d399' : '#10b981';
				} else if (c.investmentLevel === 'low') {
					color = isDark ? '#6ee7b7' : '#34d399';
				} else {
					color = isDark ? '#4b5563' : '#e5e7eb';
				}
			} else if (!c.color || c.color === '#00665C' || c.color === '#F59E0B') {
				// Update old color scheme to new green/emerald scheme
				if (c.investmentLevel === 'high') {
					color = isDark ? '#10b981' : '#059669';
				} else if (c.investmentLevel === 'medium') {
					color = isDark ? '#34d399' : '#10b981';
				} else if (c.investmentLevel === 'low') {
					color = isDark ? '#6ee7b7' : '#34d399';
				} else {
					color = isDark ? '#4b5563' : '#e5e7eb';
				}
			}
			return { ...c, color };
		});
		
		if (dataToUse.length === 0) {
			console.warn('[InteractiveMap] Cannot add layers - no country data available');
			return;
		}
		
		if (!map.current.loaded()) {
			console.log('[InteractiveMap] Map not loaded yet, waiting...');
			map.current.once('load', () => {
				setTimeout(() => addSourcesAndLayers(), 100);
			});
			return;
		}
		
		try {
			// Countries vector source (Mapbox)
			if (!map.current.getSource('countries')) {
				map.current.addSource('countries', {
					type: 'vector',
					url: 'mapbox://mapbox.country-boundaries-v1'
				});
				console.log('[InteractiveMap] Added countries source');
			}

			// Get current theme from the map's style or use context
			const currentTheme = theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
			
			// Build color match expression for country fills - Green/emerald scheme matching investment levels
			const isDark = currentTheme === 'dark';
			const defaultColor = isDark ? '#4b5563' : '#e5e7eb'; // Gray for no data (more visible)
			const hoverColor = isDark ? '#10b981' : '#059669'; // Bright emerald/green on hover
			const borderColor = isDark ? '#1e293b' : '#cbd5e1'; // More visible border
			
			const colorMatch: any[] = ['match', ['get', 'name_en']];
			dataToUse.forEach((c: CountryData) => { 
				const countryColor = c.color || defaultColor;
				colorMatch.push(c.name, countryColor);
			});
			colorMatch.push(defaultColor);

		// Restrict to our listed African countries by English name
		const countryFilter: any[] = ['in', 'name_en'];
		const countryNames = dataToUse.map((c: CountryData) => c.name).filter(Boolean);
		countryNames.forEach((name: string) => countryFilter.push(name));
		console.log('[InteractiveMap] Country filter:', countryNames.length, 'countries with', colorMatch.length - 1, 'color mappings');
		
		// Skip the non-africa-fills layer - we'll just show our African countries
		// The map style will handle the rest of the world

			// Remove existing layer if it exists to ensure fresh colors (especially important for mobile)
			if (map.current.getLayer('country-fills')) {
				map.current.removeLayer('country-fills');
			}
			
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
						['boolean', ['feature-state', 'hover'], false], 0.95,
						0.85
					]
				},
				filter: countryFilter
			});
			console.log('[InteractiveMap] Added country-fills layer with', dataToUse.length, 'countries,', countryNames.length, 'filtered, colorMatch entries:', colorMatch.length);
			
			// Force repaint to ensure colors show on mobile
			setTimeout(() => {
				if (map.current) {
					map.current.triggerRepaint();
				}
			}, 100);

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

			// Rebind interactions - support both mouse and touch events
			if (!map.current.__medarionBound) {
				// Mouse events for desktop
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
				
				// Touch events for mobile
				map.current.on('touchstart', 'country-fills', (e: any) => {
					if (!e.features?.length) return;
					e.preventDefault();
					const feature = e.features[0];
					const fid = feature.id ?? feature.properties?.mapbox_id ?? feature.properties?.name_en;
					if (hoveredFeatureId.current !== null) {
						map.current.setFeatureState({ source: 'countries', sourceLayer: 'country_boundaries', id: hoveredFeatureId.current }, { hover: false });
					}
					hoveredFeatureId.current = fid;
					map.current.setFeatureState({ source: 'countries', sourceLayer: 'country_boundaries', id: fid }, { hover: true });
					setHoveredCountry(feature.properties?.name_en || null);
				});
				
				// Click/tap handler - works for both mouse and touch
				const handleCountryClick = (e: any) => {
					if (!e.features?.length || !showPopup) return;
					e.preventDefault();
					const name = e.features[0].properties?.name_en as string;
					const foundCountry = countryData.find((c: CountryData) => c.name === name);
					if (foundCountry) {
						console.log('[InteractiveMap] Country clicked:', foundCountry.name);
						setSelectedCountry(foundCountry);
					}
				};
				
				map.current.on('click', 'country-fills', handleCountryClick);
				map.current.on('touchend', 'country-fills', handleCountryClick);
				
				map.current.__medarionBound = true;
				console.log('[InteractiveMap] Layers and interactions added successfully');
			} else {
				// Update existing layers with new colors if data changed - remove and re-add to ensure colors show
				if (map.current.getLayer('country-fills') && dataToUse.length > 0) {
					const isDark = theme === 'dark';
					const defaultColor = isDark ? '#4b5563' : '#e5e7eb';
					const hoverColor = isDark ? '#10b981' : '#059669';
					const colorMatch: any[] = ['match', ['get', 'name_en']];
					dataToUse.forEach((c: CountryData) => { colorMatch.push(c.name, c.color || defaultColor); });
					colorMatch.push(defaultColor);
					
					// Remove and re-add layer to ensure colors update properly
					map.current.removeLayer('country-fills');
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
								['boolean', ['feature-state', 'hover'], false], 0.95,
								0.85
							]
						},
						filter: countryFilter
					});
					console.log('[InteractiveMap] Updated layer colors with', dataToUse.length, 'countries');
					setTimeout(() => {
						if (map.current) {
							map.current.triggerRepaint();
						}
					}, 100);
				}
			}
		} catch (error: any) {
			console.error('[InteractiveMap] Error adding sources/layers:', error);
		}
	};

	useEffect(() => {
		console.log('[InteractiveMap] useEffect triggered, map.current:', !!map.current, 'mapContainer.current:', !!mapContainer.current);
		if (map.current) {
			console.log('[InteractiveMap] Map already exists, skipping');
			return;
		}
		
		const loadMapboxAndInit = () => {
			// Check if Mapbox GL is already loaded (from index.html)
			if ((window as any).mapboxgl) {
				console.log('[InteractiveMap] Mapbox GL already loaded');
				initializeMap();
				return;
			}

			// Check if script is already in DOM (from index.html)
			const existingScript = document.querySelector('script[src*="mapbox-gl-js"]');
			if (existingScript) {
				console.log('[InteractiveMap] Mapbox GL script found in DOM, waiting for load...');
				// If script is already loaded, check periodically
				if (existingScript.getAttribute('src') && !(window as any).mapboxgl) {
					const checkInterval = setInterval(() => {
						if ((window as any).mapboxgl) {
							clearInterval(checkInterval);
							console.log('[InteractiveMap] Mapbox GL loaded from HTML script');
							initializeMap();
						}
					}, 100);
					// Timeout after 5 seconds
					setTimeout(() => {
						clearInterval(checkInterval);
						if (!(window as any).mapboxgl) {
							console.error('[InteractiveMap] Mapbox GL not loaded after 5 seconds');
							setMapError(true);
						}
					}, 5000);
					return;
				}
			}

			// Fallback: Load Mapbox GL script if not in HTML
			console.log('[InteractiveMap] Loading Mapbox GL (fallback)...');
			const script = document.createElement('script');
			script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
			script.async = true;
			script.onload = () => {
				console.log('[InteractiveMap] Mapbox GL script loaded successfully');
				// Add CSS if not already present
				if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
					const link = document.createElement('link');
					link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
					link.rel = 'stylesheet';
					document.head.appendChild(link);
				}
				// Small delay to ensure everything is ready
				setTimeout(() => initializeMap(), 100);
			};
			script.onerror = (error) => {
				console.error('[InteractiveMap] Failed to load Mapbox GL:', error);
				setMapError(true);
			};
			document.head.appendChild(script);
		};

		// Wait for DOM and scripts to be ready, and ensure container is mounted
		const initWhenReady = () => {
			if (!mapContainer.current) {
				// Container not ready yet, try again
				setTimeout(initWhenReady, 100);
				return;
			}
			loadMapboxAndInit();
		};

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				setTimeout(initWhenReady, 200);
			});
		} else {
			// DOM is ready, wait a bit for scripts from HTML to load and container to mount
			setTimeout(initWhenReady, 200);
		}

		function initializeMap() {
			if (!mapContainer.current) {
				console.error('[InteractiveMap] Map container not available');
				setMapError(true);
				return;
			}

			if (!(window as any).mapboxgl) {
				console.error('[InteractiveMap] Mapbox GL not available after load');
				setMapError(true);
				return;
			}

			try {
				console.log('[InteractiveMap] Initializing map...');
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
					maxZoom: 8,
					attributionControl: false
				});
				console.log('[InteractiveMap] Map instance created');
				// Single load handler that does everything
				map.current.on('load', () => {
					// Fit to Africa bounds: [minLng, minLat], [maxLng, maxLat]
					map.current.fitBounds([[-20, -35], [55, 38]], {
						padding: { top: 50, bottom: 50, left: 50, right: 50 },
						duration: 1000
					});
					
					// Add layers after fitBounds completes
					setTimeout(() => {
						console.log('[InteractiveMap] Map loaded, countryData length:', countryData.length);
						if (countryData.length > 0) {
							addSourcesAndLayers();
							// Force repaint after layers are added (important for mobile)
							setTimeout(() => {
								if (map.current) {
									map.current.triggerRepaint();
									console.log('[InteractiveMap] Triggered repaint after layer addition');
								}
							}, 600);
						} else {
							// Wait for country data to load with timeout
							let attempts = 0;
							const maxAttempts = 50; // 5 seconds max wait
							const checkData = setInterval(() => {
								attempts++;
								if (countryData.length > 0) {
									clearInterval(checkData);
									console.log('[InteractiveMap] Country data loaded, adding layers');
									addSourcesAndLayers();
									setTimeout(() => {
										if (map.current) {
											map.current.triggerRepaint();
										}
									}, 600);
								} else if (attempts >= maxAttempts) {
									clearInterval(checkData);
									console.warn('[InteractiveMap] Country data not loaded after timeout, using static data');
									setCountryData(africanCountriesMapData);
									setTimeout(() => {
										addSourcesAndLayers();
										if (map.current) {
											map.current.triggerRepaint();
										}
									}, 200);
								}
							}, 100);
						}
					}, 1200);
				});

				map.current.on('error', (e: any) => {
					console.error('[InteractiveMap] Map error:', e.error || e);
					// Don't set error state for minor errors, just log them
					if (e.error?.message?.includes('Style') || e.error?.message?.includes('Source')) {
						console.warn('[InteractiveMap] Map style/source error, continuing...');
					} else {
						setMapError(true);
					}
				});

			} catch (error: any) {
				console.error('[InteractiveMap] Map initialization error:', error);
				setMapError(true);
			}
		}

		return () => {
			if (map.current) {
				try {
					map.current.remove();
				} catch (e) {
					console.warn('[InteractiveMap] Error removing map:', e);
				}
				map.current = null;
			}
		};
	}, [theme]);

	// Add layers when country data becomes available
	useEffect(() => {
		if (map.current && countryData.length > 0) {
			console.log('[InteractiveMap] Country data updated, adding layers. Data length:', countryData.length);
			// Check if map is loaded
			if (map.current.loaded()) {
				setTimeout(() => {
					try {
						addSourcesAndLayers();
					} catch (error: any) {
						console.error('[InteractiveMap] Error in addSourcesAndLayers:', error);
					}
				}, 200);
			} else {
				map.current.once('load', () => {
					setTimeout(() => {
						try {
							addSourcesAndLayers();
						} catch (error: any) {
							console.error('[InteractiveMap] Error in addSourcesAndLayers after load:', error);
						}
					}, 200);
				});
			}
		}
	}, [countryData.length, theme]);

	// Resize map on window resize and ensure layers are visible
	useEffect(() => {
		const handleResize = () => {
			if (map.current) {
				map.current.resize();
				// Force a repaint to ensure colors show on mobile
				setTimeout(() => {
					if (map.current && map.current.getLayer('country-fills')) {
						// Trigger a style refresh
						const currentStyle = map.current.getStyle();
						if (currentStyle) {
							map.current.setStyle(currentStyle);
							// Re-add layers after style is set
							map.current.once('style.load', () => {
								setTimeout(() => {
									if (countryData.length > 0) {
										addSourcesAndLayers();
									}
								}, 100);
							});
						}
					}
				}, 100);
			}
		};
		window.addEventListener('resize', handleResize);
		// Also handle orientation change on mobile
		window.addEventListener('orientationchange', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('orientationchange', handleResize);
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
			<div className="card-glass p-4 sm:p-6 text-center rounded-lg">
				<div className="text-slate-500 dark:text-slate-400 mb-4">
					<svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
					</svg>
				</div>
				<h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">Map Unavailable</h3>
				<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Interactive map is currently unavailable. Please try again later.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="card-glass p-4 sm:p-6 text-center rounded-lg">
				<div className="text-slate-500 dark:text-slate-400 mb-4">
					<div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600 dark:border-cyan-500 mx-auto"></div>
				</div>
				<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Loading map data...</p>
			</div>
		);
	}

	return (
		<div className="w-full h-full">
			{title && (
				<div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
					<h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{title}</h3>
					<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Click on a country to view details. Metric: {dataType}</p>
				</div>
			)}
			
			<div className="relative w-full bg-slate-100 dark:bg-slate-900 rounded-b-lg overflow-visible map-container-responsive">
				<div 
					ref={mapContainer} 
					className="w-full rounded-b-lg overflow-hidden"
					style={{ 
						height: `${isSmall ? heightSm : height}px`,
						minHeight: `${isSmall ? heightSm : height}px`,
						width: '100%'
					}}
				/>
				
				{hoveredCountry && (
					<div className="absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1.5 sm:p-2 pointer-events-none z-10"
					     style={{ 
					       left: '50%', 
					       top: '8px', 
					       transform: 'translateX(-50%)',
					       maxWidth: isSmall ? 'calc(100% - 16px)' : '300px'
					     }}>
						<div className="text-[10px] sm:text-xs font-medium text-slate-900 dark:text-white truncate">{hoveredCountry}</div>
						<div className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Tap for details</div>
					</div>
				)}

				{showLegend && (
					<div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto sm:max-w-xs bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2.5 sm:p-3 z-20" style={{ maxWidth: isSmall ? 'calc(100% - 1rem)' : 'auto' }}>
						<div className="text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white mb-2 sm:mb-2.5">
							{dataType === 'count' 
								? (itemType === 'deal' ? 'Deal Count' : itemType === 'grant' ? 'Grant Count' : 'Count')
								: 'Investment Level'}
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-2">
							{mapLegend.map((item) => {
								const isDark = theme === 'dark';
								let legendColor: string;
								let label = item.label;
								
								// Match legend colors to actual map colors - using emerald/green scheme
								if (item.level === 'high') {
									legendColor = isDark ? '#10b981' : '#059669'; // Emerald-500 / Emerald-600
									if (dataType === 'count') {
										if (itemType === 'deal') {
											label = 'High Deal Count (10+)';
										} else if (itemType === 'grant') {
											label = 'High Grant Count (10+)';
										} else {
											label = 'High Count (10+)';
										}
									}
								} else if (item.level === 'medium') {
									legendColor = isDark ? '#34d399' : '#10b981'; // Emerald-400 / Emerald-500
									if (dataType === 'count') {
										if (itemType === 'deal') {
											label = 'Medium Deal Count (5-10)';
										} else if (itemType === 'grant') {
											label = 'Medium Grant Count (5-10)';
										} else {
											label = 'Medium Count (5-10)';
										}
									}
								} else if (item.level === 'low') {
									legendColor = isDark ? '#6ee7b7' : '#34d399'; // Emerald-300 / Emerald-400
									if (dataType === 'count') {
										if (itemType === 'deal') {
											label = 'Low Deal Count (<5)';
										} else if (itemType === 'grant') {
											label = 'Low Grant Count (<5)';
										} else {
											label = 'Low Count (<5)';
										}
									}
								} else if (item.level === 'none') {
									legendColor = isDark ? '#4b5563' : '#d1d5db'; // Gray-600 / Gray-300
								} else {
									legendColor = item.color;
								}
								
								return (
									<div key={item.level} className="flex items-start sm:items-center space-x-2 sm:space-x-2.5">
										<div 
											className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0 border border-slate-300 dark:border-slate-600 shadow-sm mt-0.5 sm:mt-0" 
											style={{ backgroundColor: legendColor }}
										/>
										<span className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium leading-tight break-words">{label}</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{selectedCountry && showPopup && (
				<div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-3 sm:p-4" onClick={() => setSelectedCountry(null)}>
					<div className="card-glass rounded-t-2xl sm:rounded-lg max-w-lg sm:max-w-2xl w-full max-h-[90vh] sm:max-h-[90vh] overflow-hidden border-t sm:border border-slate-200 dark:border-slate-700 shadow-elevated" onClick={(e) => e.stopPropagation()}>
						{/* Mobile drag handle */}
						<div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-2 mb-1"></div>
						
						{/* Header */}
						<div className="p-3 sm:p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
							<div className="min-w-0 flex-1 pr-2">
								<h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-200 mb-0.5">{selectedCountry.name}</h3>
								<p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Deal Investment Overview</p>
							</div>
							<button
								onClick={() => setSelectedCountry(null)}
								className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0 p-1 touch-manipulation"
								aria-label="Close"
							>
								<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Scrollable Content */}
						<div className="p-3 sm:p-4 md:p-5 overflow-y-auto max-h-[calc(90vh-70px)] sm:max-h-[calc(90vh-100px)]">
							{/* Deal Statistics - Main Focus */}
							<div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-5">
								<div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 sm:p-4 border border-slate-200 dark:border-slate-700">
									<p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">Total Investment</p>
									<p className="text-lg sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedCountry.totalInvestment)}</p>
								</div>
								<div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 sm:p-4 border border-slate-200 dark:border-slate-700">
									<p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1">Number of Deals</p>
									<p className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">{selectedCountry.dealCount}</p>
								</div>
							</div>

							{/* Additional Deal Info */}
							<div className="space-y-3 sm:space-y-4">
								{selectedCountry.companies > 0 && (
									<div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-200 dark:border-slate-700">
										<span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Companies Involved</span>
										<span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedCountry.companies}</span>
									</div>
								)}
								
								{selectedCountry.sectors && selectedCountry.sectors.length > 0 && (
									<div>
										<h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Key Sectors</h4>
										<div className="flex flex-wrap gap-1.5 sm:gap-2">
											{selectedCountry.sectors.slice(0, 6).map((sector) => (
												<span
													key={sector}
													className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium border border-emerald-200 dark:border-emerald-800"
												>
													{sector}
												</span>
											))}
										</div>
									</div>
								)}

								{selectedCountry.topCompanies && selectedCountry.topCompanies.length > 0 && (
									<div>
										<h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Top Companies</h4>
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
											{selectedCountry.topCompanies.slice(0, 6).map((company) => (
												<span
													key={company}
													className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-center font-medium border border-slate-200 dark:border-slate-700 truncate"
												>
													{company}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default InteractiveMap;