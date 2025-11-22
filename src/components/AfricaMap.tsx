import React, { useEffect, useRef, useState } from 'react';
import { africaCountriesData, AfricaCountryInfo, formatNumber, formatPopulation, formatArea } from '../data/africaCountriesData';
import { useTheme } from '../contexts/ThemeContext';
import { X } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface AfricaMapProps {
  height?: number;
  heightSm?: number;
}

const AfricaMap: React.FC<AfricaMapProps> = ({ 
  height = 600,
  heightSm = 400
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const [mapError, setMapError] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<AfricaCountryInfo | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const hoveredFeatureId = useRef<string | number | null>(null);
  const { theme } = useTheme();
  const [isSmall, setIsSmall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countryData, setCountryData] = useState<AfricaCountryInfo[]>([]);

  // Fetch country data from database
  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const response = await fetch(getApiUrl('/countries/africa'));
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setCountryData(result.data);
        } else {
          // Fallback to static data
          setCountryData(africaCountriesData);
        }
      } catch (error: any) {
        // Silently fallback to static data - this is expected when backend is not running
        console.debug('Error fetching country data:', error);
        setCountryData(africaCountriesData);
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
    const fillColor = isDark ? '#4a5568' : '#9ca3af'; // Monochrome gray
    const hoverColor = isDark ? '#718096' : '#6b7280'; // Slightly lighter on hover
    const defaultColor = isDark ? '#2d3748' : '#e5e7eb'; // Default background
    const borderColor = isDark ? '#4a5568' : '#d1d5db'; // Border color
    
    const colorMatch: any[] = ['match', ['get', 'name_en']];
    countryData.forEach((c: AfricaCountryInfo) => { 
      colorMatch.push(c.name, fillColor); // Monochrome color
    });
    colorMatch.push(defaultColor); // Default

    // Restrict to our listed African countries by English name
    const countryFilter: any[] = ['in', 'name_en'];
    countryData.forEach((c: AfricaCountryInfo) => countryFilter.push(c.name));
    
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
        const foundCountry = countryData.find((c: AfricaCountryInfo) => c.name === name);
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
                setCountryData(africaCountriesData);
                setTimeout(() => addSourcesAndLayers(), 100);
              }
            }, 100);
          }
        });

        map.current.on('error', (e: any) => {
          console.error('Map error:', e);
          // Only set error for critical failures, not style loading issues
          if (e.error && e.error.message && (
            e.error.message.includes('token') || 
            e.error.message.includes('unauthorized') ||
            e.error.message.includes('forbidden')
          )) {
            setMapError(true);
            setLoading(false);
          }
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError(true);
        setLoading(false);
      }
    } else {
      // Wait for mapboxgl to load (script might still be loading)
      const checkInterval = setInterval(() => {
        if ((window as any).mapboxgl) {
          clearInterval(checkInterval);
          // Retry initialization by triggering a re-render
          setLoading(true);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).mapboxgl) {
          setMapError(true);
          setLoading(false);
        }
      }, 10000);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [countryData.length, theme]);

  // Switch map style on theme change
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

  if (mapError) {
    return (
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl p-6 text-center">
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
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl p-6 text-center">
        <div className="text-[var(--color-text-secondary)] mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-teal)] mx-auto"></div>
        </div>
        <p className="text-[var(--color-text-secondary)]">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full rounded-xl overflow-hidden border border-[var(--color-divider-gray)]"
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

      {/* Country Info Modal */}
      {selectedCountry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCountry(null)}>
          <div 
            className="bg-[var(--color-background-surface)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-divider-gray)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{selectedCountry.flag}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedCountry.name}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">Capital: {selectedCountry.capital}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2 hover:bg-[var(--color-background-default)] rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Currency</h4>
                    <p className="text-lg font-medium text-[var(--color-text-primary)]">
                      {selectedCountry.currency} ({selectedCountry.currencyCode})
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Population</h4>
                    <p className="text-lg font-medium text-[var(--color-text-primary)]">
                      {formatPopulation(selectedCountry.population)} ({selectedCountry.population.toLocaleString()})
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Official Languages</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCountry.languages.map((lang, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-[var(--color-primary-teal)]/10 text-[var(--color-primary-teal)] rounded-lg text-sm font-medium"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">GDP</h4>
                    <p className="text-lg font-medium text-[var(--color-text-primary)]">
                      {formatNumber(selectedCountry.gdp)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">GDP per Capita</h4>
                    <p className="text-lg font-medium text-[var(--color-text-primary)]">
                      {formatNumber(selectedCountry.gdpPerCapita)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Country Size (Area)</h4>
                    <p className="text-lg font-medium text-[var(--color-text-primary)]">
                      {formatArea(selectedCountry.area)}
                    </p>
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

export default AfricaMap;

