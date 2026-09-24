<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '../lib/store.svelte';
  import { getCitiesCurrentWeather, getRainViewerRadar } from '../lib/api';
  import { SAMPLE_CITIES, getColorForTemperature } from '../lib/utils';
  
  let mapContainer: HTMLElement;
  let map: L.Map | undefined;
  
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  
  let cityLayerGroup: L.LayerGroup | undefined;
  let windLayerGroup: L.LayerGroup | undefined;
  let radarLayerGroup: L.LayerGroup | undefined;
  let cloudLayerGroup: L.LayerGroup | undefined;
  
  let mapReady = $state(false);
  let citiesLoadError = $state<string | null>(null);
  let citiesLastUpdated = $state<string | null>(null);
  let radarLoadError = $state<string | null>(null);
  let isLoadingCities = $state(false);
  let selectedWeatherError = $state<string | null>(null);
  let mapZoom = $state(3);
  const detailedMarkers: { marker: L.Marker; layer: L.LayerGroup }[] = [];
  function updateDetailedMarkers() {
    if (!map) return;
    mapZoom = map.getZoom();
    for (const { marker, layer } of detailedMarkers) {
      if (mapZoom >= 6) layer.addLayer(marker);
      else layer.removeLayer(marker);
    }
  }
  
  // RainViewer logic
  let radarTimestamps: any[] = $state([]);
  let currentRadarIndex = $state(0);
  let radarAnimationInterval: any;
  
  onMount(async () => {
    map = L.map(mapContainer, {
      zoomControl: false,
      minZoom: 3,
      maxZoom: 12
    }).fitBounds([[24.5, -124.8], [49.4, -66.9]], { padding: [24, 24] });
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    appState.setMapInstance(map);
    mapReady = true;
    
    cityLayerGroup = L.layerGroup().addTo(map);
    windLayerGroup = L.layerGroup();
    radarLayerGroup = L.layerGroup();
    cloudLayerGroup = L.layerGroup();
    updateDetailedMarkers();
    map.on('zoomend', updateDetailedMarkers);
    
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (lat < 24 || lat > 50 || lng < -125 || lng > -66) {
        // Only fetch forecast within CONUS approximations
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
        const data = await res.json();
        
        let name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Selected Location';
        if (data.address?.state) name += `, ${data.address.state}`;
        
        appState.selectedLocation = {
          name,
          latitude: lat,
          longitude: lng
        };
      } catch (err) {
        appState.selectedLocation = {
          name: `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`,
          latitude: lat,
          longitude: lng
        };
      }
      appState.flyTo(lat, lng, 8);
    });

    loadCitiesData();
    initRadar();
  });
  
  onDestroy(() => {
    mapReady = false;
    if (radarAnimationInterval) clearInterval(radarAnimationInterval);
    if (map) map.remove();
  });
  
  $effect(() => {
    if (!mapReady || !map) return;
    
    if (appState.showCities) {
      if (!map.hasLayer(cityLayerGroup!)) map.addLayer(cityLayerGroup!);
    } else {
      if (map.hasLayer(cityLayerGroup!)) map.removeLayer(cityLayerGroup!);
    }
    
    if (appState.showWind) {
      if (!map.hasLayer(windLayerGroup!)) map.addLayer(windLayerGroup!);
    } else {
      if (map.hasLayer(windLayerGroup!)) map.removeLayer(windLayerGroup!);
    }
    
    if (appState.showRadar) {
      if (!map.hasLayer(radarLayerGroup!)) {
        map.addLayer(radarLayerGroup!);
        startRadarAnimation();
      }
    } else {
      if (map.hasLayer(radarLayerGroup!)) {
        map.removeLayer(radarLayerGroup!);
        stopRadarAnimation();
      }
    }
    
    if (appState.showClouds) {
      if (!map.hasLayer(cloudLayerGroup!)) map.addLayer(cloudLayerGroup!);
    } else {
      if (map.hasLayer(cloudLayerGroup!)) map.removeLayer(cloudLayerGroup!);
    }
  });
  
  async function loadCitiesData() {
    if (!cityLayerGroup || !cloudLayerGroup || !windLayerGroup) return;
    
    isLoadingCities = true;
    citiesLoadError = null;
    
    const lats = SAMPLE_CITIES.map(c => c.lat);
    const lons = SAMPLE_CITIES.map(c => c.lon);
    
    try {
      const data = await getCitiesCurrentWeather(lats, lons);
      
      if (!mapReady) return;
      SAMPLE_CITIES.forEach((city, i) => {
        const cityData = Array.isArray(data) ? data[i] : data; 
        
        if (cityData && cityData.current) {
          addWeatherMarkers(city, cityData.current, i >= 27);
        }
      });
      citiesLastUpdated = new Date().toLocaleTimeString();
    } catch (e: any) {
      console.error("Failed to load cities data", e);
      citiesLoadError = "Failed to load city data.";
    } finally {
      isLoadingCities = false;
    }
  }

  function addWeatherMarkers(
    city: { name: string; lat: number; lon: number },
    current: { temperature_2m: number; cloud_cover: number; wind_direction_10m: number; wind_speed_10m: number },
    detailed = false
  ) {
          // Names can come from search or chat; never interpolate raw HTML.
          const label = document.createElement('span');
          label.textContent = city.name;
          const safeName = label.innerHTML;
          const temp = current.temperature_2m;
          const color = getColorForTemperature(temp);
          
          const iconHtml = `
            <div class="flex items-center justify-center -ml-4 -mt-4 w-10 h-10 rounded-full border-2 border-slate-900 shadow-lg" style="background-color: ${color}ee;">
              <span class="text-white font-bold text-xs shadow-sm">${Math.round(temp)}°</span>
            </div>
            <div class="text-[10px] font-bold text-white uppercase tracking-wider mt-1 text-center bg-slate-900/50 rounded px-1 w-max -ml-2 backdrop-blur">
              ${safeName}
            </div>
          `;
          
          const icon = L.divIcon({
            html: iconHtml,
            className: 'bg-transparent',
            iconSize: [0, 0]
          });
          const temperatureMarker = L.marker([city.lat, city.lon], { icon, title: city.name }).addTo(cityLayerGroup!);
          
          // Cloud Cover marker
          const cloudCover = current.cloud_cover;
          const cloudHtml = `
            <div class="flex flex-col items-center justify-center -ml-4 -mt-4 w-10 h-10 rounded-full border border-slate-700 bg-slate-800/90 shadow-lg backdrop-blur">
              <span class="text-slate-300 font-bold text-xs">${cloudCover}%</span>
            </div>
            <div class="text-[10px] font-bold text-slate-300 uppercase mt-1 text-center bg-slate-900/80 rounded px-1 w-max -ml-2 backdrop-blur">
              Clouds
            </div>
          `;
          const cloudIcon = L.divIcon({
            html: cloudHtml,
            className: 'bg-transparent',
            iconSize: [0, 0]
          });
          const cloudMarker = L.marker([city.lat, city.lon], { icon: cloudIcon, title: city.name }).addTo(cloudLayerGroup!);
          
          // Wind Arrow marker
          const windDir = current.wind_direction_10m;
          const windSpeed = current.wind_speed_10m;
          const windHtml = `
            <div class="flex items-center justify-center -ml-4 -mt-4 w-8 h-8 rounded-full border border-slate-700 bg-slate-900/80 shadow-lg backdrop-blur" style="transform: rotate(${windDir}deg);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-teal-400"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/></svg>
            </div>
            <div class="text-[10px] font-bold text-teal-400 uppercase mt-1 text-center bg-slate-900/80 rounded px-1 w-max -ml-2 backdrop-blur">
              ${Math.round(windSpeed)} mph
            </div>
          `;
          const windIcon = L.divIcon({
            html: windHtml,
            className: 'bg-transparent',
            iconSize: [0, 0]
          });
          const windMarker = L.marker([city.lat, city.lon], { icon: windIcon, title: city.name }).addTo(windLayerGroup!);
          if (detailed) {
            detailedMarkers.push(
              { marker: temperatureMarker, layer: cityLayerGroup! },
              { marker: cloudMarker, layer: cloudLayerGroup! },
              { marker: windMarker, layer: windLayerGroup! }
            );
            updateDetailedMarkers();
          }
          return () => {
            cityLayerGroup?.removeLayer(temperatureMarker);
            cloudLayerGroup?.removeLayer(cloudMarker);
            windLayerGroup?.removeLayer(windMarker);
          };
  }

  $effect(() => {
    const location = appState.selectedLocation;
    if (!mapReady || !location) return;
    let cancelled = false;
    let removeMarkers: (() => void) | undefined;
    selectedWeatherError = null;
    // Preset cities already have markers, unless their initial request failed.
    const alreadyShown = !citiesLoadError && !isLoadingCities && citiesLastUpdated &&
      SAMPLE_CITIES.some((city, index) => (index < 27 || mapZoom >= 6) && Math.abs(city.lat - location.latitude) < 0.03 &&
        Math.abs(city.lon - location.longitude) < 0.03);
    if (alreadyShown) return;
    getCitiesCurrentWeather([location.latitude], [location.longitude])
      .then(data => {
        if (cancelled) return;
        const weather = Array.isArray(data) ? data[0] : data;
        if (!weather?.current) throw new Error('No current weather returned');
        removeMarkers = addWeatherMarkers({
          name: location.name, lat: location.latitude, lon: location.longitude
        }, weather.current);
      })
      .catch(() => {
        if (!cancelled) selectedWeatherError = `Could not load map weather for ${location.name}. Select the location again to retry.`;
      });
    return () => { cancelled = true; removeMarkers?.(); };
  });
  
  async function initRadar() {
    radarLoadError = null;
    try {
      const rvData = await getRainViewerRadar();
      radarTimestamps = rvData.radar.past;
      
      if (appState.showRadar) {
        startRadarAnimation();
      }
    } catch (e: any) {
      console.error("Failed to load RainViewer data", e);
      radarLoadError = "Failed to load radar data.";
    }
  }
  
  function startRadarAnimation() {
    if (!radarTimestamps.length || !radarLayerGroup) return;
    
    stopRadarAnimation();
    
    showRadarFrame(currentRadarIndex);
    
    radarAnimationInterval = setInterval(() => {
      currentRadarIndex = (currentRadarIndex + 1) % radarTimestamps.length;
      showRadarFrame(currentRadarIndex);
    }, 1500);
  }
  
  function stopRadarAnimation() {
    if (radarAnimationInterval) {
      clearInterval(radarAnimationInterval);
      radarAnimationInterval = null;
    }
  }
  
  let currentRadarLayer: L.TileLayer | null = null;
  
  function showRadarFrame(index: number) {
    if (!radarLayerGroup || !radarTimestamps[index]) return;
    
    const frame = radarTimestamps[index];
    const url = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    
    const newLayer = L.tileLayer(url, {
      opacity: 0.6,
      zIndex: 10,
      maxNativeZoom: 7
    });
    
    newLayer.on('tileerror', () => {
      radarLoadError = "Failed to load radar tile.";
    });
    
    radarLayerGroup.addLayer(newLayer);
    
    if (currentRadarLayer) {
      setTimeout((layerToRemove: L.TileLayer) => {
        if (radarLayerGroup && radarLayerGroup.hasLayer(layerToRemove)) {
          radarLayerGroup.removeLayer(layerToRemove);
        }
      }, 200, currentRadarLayer);
    }
    
    currentRadarLayer = newLayer;
  }
</script>

<div class="relative w-full h-full">
  <div bind:this={mapContainer} class="w-full h-full bg-slate-950 z-0"></div>
  
  {#if !mapReady}
    <div class="absolute inset-0 bg-slate-900/80 backdrop-blur flex items-center justify-center z-50">
      <div class="flex flex-col items-center gap-4">
        <div class="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-brand-300 font-medium">Initializing Map...</p>
      </div>
    </div>
  {/if}
  
  <div class="absolute top-4 right-4 flex flex-col items-end gap-2 z-[400] pointer-events-none">
    {#if selectedWeatherError}
      <div role="alert" class="max-w-xs bg-red-900/80 px-3 py-1.5 rounded text-xs text-red-200">
        {selectedWeatherError}
      </div>
    {/if}
    {#if citiesLoadError}
      <div class="bg-red-900/80 backdrop-blur px-3 py-1.5 rounded border border-red-700 shadow-xl text-xs text-red-200">
        Cities: {citiesLoadError}
      </div>
    {/if}
    {#if radarLoadError}
      <div class="bg-red-900/80 backdrop-blur px-3 py-1.5 rounded border border-red-700 shadow-xl text-xs text-red-200">
        Radar: {radarLoadError}
      </div>
    {/if}
    {#if citiesLastUpdated}
      <div class="bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded border border-slate-700 shadow-xl text-xs text-slate-400">
        City Data: {citiesLastUpdated}
      </div>
      {#if mapZoom < 6}
        <div class="bg-slate-900/80 px-3 py-1.5 rounded text-xs text-slate-300">
          Zoom in or select a location for more city weather.
        </div>
      {/if}
    {/if}
  </div>
  
  {#if appState.showRadar && radarTimestamps.length > 0}
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 shadow-xl z-[400] flex items-center gap-3">
      <div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
      <span class="text-xs font-mono text-brand-300">
        Radar: {new Date(radarTimestamps[currentRadarIndex]?.time * 1000).toLocaleTimeString()}
      </span>
    </div>
  {/if}
</div>