import type { WeatherLocation, ChatTurn, ForecastData } from './types';

export class WeatherStore {
  selectedLocation = $state<WeatherLocation | null>(null);
  forecast = $state<ForecastData | null>(null);
  isForecastLoading = $state(false);
  forecastError = $state<string | null>(null);
  
  chatHistory = $state<ChatTurn[]>([{ role: 'assistant', content: 'Hello! I am your weather assistant. Ask me about conditions anywhere in the US.' }]);
  isChatting = $state(false);
  
  mapInstance = $state<any>(null); // To trigger map updates
  
  // Layers
  showRadar = $state(false);
  showCities = $state(true);
  showClouds = $state(false);
  showWind = $state(false);
  
  setMapInstance(map: any) {
    this.mapInstance = map;
  }
  
  flyTo(lat: number, lon: number, zoom = 10) {
    if (this.mapInstance) {
      this.mapInstance.flyTo([lat, lon], zoom, { duration: 1.5 });
    }
  }
  
  clearChat() {
    this.chatHistory = [{ role: 'assistant', content: 'Chat history cleared. How can I help you today?' }];
  }
}

export const appState = new WeatherStore();
