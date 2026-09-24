<script lang="ts">
  import { appState } from '../lib/store.svelte';
  import { searchLocation, getForecast } from '../lib/api';
  import { getWeatherDescription } from '../lib/utils';
  import { Search, MapPin, Layers, CloudRain, Thermometer, Wind, Cloud, Droplets, Map as MapIcon, Loader2, AlertCircle } from '@lucide/svelte';
  import { format, parseISO } from 'date-fns';
  import type { GeocodingResult } from '../lib/types';
  
  let searchQuery = $state('');
  let searchResults = $state<GeocodingResult[]>([]);
  let isSearching = $state(false);
  let showDropdown = $state(false);
  let searchError = $state<string | null>(null);
  
  $effect(() => {
    if (appState.selectedLocation) {
      loadForecast(appState.selectedLocation.latitude, appState.selectedLocation.longitude);
    } else {
      appState.forecast = null;
    }
  });
  
  async function loadForecast(lat: number, lon: number) {
    appState.isForecastLoading = true;
    appState.forecastError = null;
    try {
      appState.forecast = await getForecast(lat, lon);
    } catch (e: any) {
      appState.forecastError = e.message || 'Failed to load forecast';
      appState.forecast = null;
    } finally {
      appState.isForecastLoading = false;
    }
  }

  let searchTimeout: any;
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchError = null;
    if (searchQuery.length < 2) {
      searchResults = [];
      showDropdown = false;
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      isSearching = true;
      try {
        searchResults = await searchLocation(searchQuery);
        showDropdown = searchResults.length > 0;
        if (searchResults.length === 0) {
          searchError = "No locations found in CONUS.";
        }
      } catch (e) {
        console.error(e);
        searchError = "Failed to search locations.";
      } finally {
        isSearching = false;
      }
    }, 400);
  }
  
  function selectLocation(res: GeocodingResult) {
    // CONUS Check
    if (res.latitude < 24 || res.latitude > 50 || res.longitude < -125 || res.longitude > -66) {
      searchError = "Location outside CONUS bounds.";
      return;
    }
    const locName = res.admin1 ? `${res.name}, ${res.admin1}` : res.name;
    appState.selectedLocation = {
      name: locName,
      latitude: res.latitude,
      longitude: res.longitude
    };
    appState.flyTo(res.latitude, res.longitude, 11);
    
    searchQuery = '';
    showDropdown = false;
  }
  
  function formatDate(dateStr: string) {
    return format(parseISO(dateStr), 'EEE, MMM d');
  }
</script>

<div class="h-full flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">
  <!-- Search Header -->
  <div class="p-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-20">
    <div class="flex items-center gap-2 mb-4 text-brand-400">
      <MapIcon size={24} />
      <h1 class="text-xl font-bold tracking-tight text-slate-100">CONUS <span class="text-brand-400">Weather</span></h1>
    </div>
    
    <div class="relative">
      <div class="relative flex items-center">
        <Search size={16} class="absolute left-3 text-slate-400" />
        <input 
          type="text" 
          bind:value={searchQuery}
          oninput={handleSearchInput}
          placeholder="Search US cities..."
          class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
        {#if isSearching}
          <Loader2 size={16} class="absolute right-3 text-brand-400 animate-spin" />
        {/if}
      </div>
      
      {#if searchError}
        <div class="absolute top-full mt-1 w-full bg-red-900/90 text-red-200 text-xs p-2 rounded border border-red-700 z-50 flex items-center gap-1">
          <AlertCircle size={12} />
          {searchError}
        </div>
      {/if}
      
      {#if showDropdown && searchResults.length > 0}
        <div class="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          {#each searchResults as res}
            <button 
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 flex flex-col items-start transition-colors border-b border-slate-700/50 last:border-0"
              onclick={() => selectLocation(res)}
            >
              <span class="font-medium text-slate-200">{res.name}</span>
              <span class="text-xs text-slate-400">
                {res.admin1 || ''}{res.admin1 && res.country ? ', ' : ''}{res.country || ''}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Layers Control -->
  <div class="p-4 border-b border-slate-800">
    <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
      <Layers size={14} /> Map Layers
    </h3>
    <div class="space-y-2">
      <label class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors">
        <input type="checkbox" bind:checked={appState.showCities} class="rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50 w-4 h-4" />
        <div class="flex items-center gap-2">
          <Thermometer size={16} class="text-amber-400" />
          <span class="text-sm font-medium">City Temperatures</span>
        </div>
      </label>
      
      <label class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors">
        <input type="checkbox" bind:checked={appState.showWind} class="rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50 w-4 h-4" />
        <div class="flex items-center gap-2">
          <Wind size={16} class="text-teal-400" />
          <span class="text-sm font-medium">Wind Current</span>
        </div>
      </label>
      
      <label class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors">
        <input type="checkbox" bind:checked={appState.showRadar} class="rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50 w-4 h-4" />
        <div class="flex items-center gap-2">
          <CloudRain size={16} class="text-blue-400" />
          <span class="text-sm font-medium">Precipitation Radar</span>
        </div>
      </label>
      
      <label class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors">
        <input type="checkbox" bind:checked={appState.showClouds} class="rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50 w-4 h-4" />
        <div class="flex items-center gap-2">
          <Cloud size={16} class="text-slate-300" />
          <span class="text-sm font-medium">Cloud Cover</span>
        </div>
      </label>
    </div>
  </div>

  <!-- Forecast Section -->
  <div class="p-4 flex-1">
    {#if appState.selectedLocation}
      <div class="mb-4 flex items-start justify-between">
        <div>
          <h2 class="text-xl font-bold flex items-center gap-2">
            <MapPin size={18} class="text-brand-400" />
            {appState.selectedLocation.name}
          </h2>
          <p class="text-xs text-slate-400 ml-6 mt-1">
            {appState.selectedLocation.latitude.toFixed(4)}, {appState.selectedLocation.longitude.toFixed(4)}
          </p>
        </div>
      </div>
      
      {#if appState.isForecastLoading}
        <div class="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 size={24} class="animate-spin mb-2 text-brand-500" />
          <p class="text-sm">Fetching latest conditions...</p>
        </div>
      {:else if appState.forecastError}
        <div class="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-center text-red-400 text-sm">
          {appState.forecastError}
        </div>
      {:else if appState.forecast}
        <!-- Current Conditions -->
        {@const current = appState.forecast.current}
        {@const codeInfo = getWeatherDescription(current.weather_code)}
        
        <div class="bg-gradient-to-br from-brand-900/40 to-slate-800 border border-slate-700/50 rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
          
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Current</p>
              <div class="flex items-baseline gap-2">
                <span class="text-5xl font-bold tracking-tighter">{Math.round(current.temperature_2m)}°</span>
                <span class="text-lg text-slate-300 font-medium">F</span>
              </div>
            </div>
            <div class="text-brand-300 p-2 bg-slate-800/80 rounded-xl backdrop-blur">
              <span class="text-xs font-medium block text-center mb-1">{codeInfo.description}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-700/50 relative z-10">
            <div class="flex items-center gap-2">
              <Droplets size={16} class="text-blue-400" />
              <div>
                <p class="text-[10px] text-slate-400 uppercase">Humidity</p>
                <p class="text-sm font-semibold">{current.relative_humidity_2m}%</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Wind size={16} class="text-teal-400" />
              <div>
                <p class="text-[10px] text-slate-400 uppercase">Wind</p>
                <p class="text-sm font-semibold">{current.wind_speed_10m} mph</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 7-Day Forecast -->
        <h3 class="text-sm font-semibold text-slate-300 mb-3 ml-1">7-Day Forecast</h3>
        <div class="space-y-2">
          {#each appState.forecast.daily.time as dateStr, i}
            {@const dayInfo = getWeatherDescription(appState.forecast.daily.weather_code[i])}
            
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
              <div class="w-24">
                <p class="text-sm font-medium {i === 0 ? 'text-brand-400' : 'text-slate-200'}">
                  {i === 0 ? 'Today' : formatDate(dateStr)}
                </p>
              </div>
              
              <div class="flex items-center gap-2 flex-1 justify-center">
                <span class="text-xs text-slate-400 w-full text-center hidden md:block truncate">
                  {dayInfo.description}
                </span>
              </div>
              
              <div class="flex items-center gap-3 w-32 justify-end">
                <div class="flex flex-col items-end">
                  <span class="text-sm font-bold text-white">{Math.round(appState.forecast.daily.temperature_2m_max[i])}°</span>
                  <span class="text-xs text-slate-400">{Math.round(appState.forecast.daily.temperature_2m_min[i])}°</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <MapIcon size={48} class="text-slate-700 mb-4 opacity-50" />
        <h3 class="text-lg font-medium text-slate-300 mb-2">No location selected</h3>
        <p class="text-sm max-w-[200px] leading-relaxed">
          Search for a US city or click anywhere on the map to see the forecast.
        </p>
      </div>
    {/if}
  </div>
</div>
