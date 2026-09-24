export function getWeatherDescription(code: number): { description: string, icon: string } {
  // WMO Weather interpretation codes (WW)
  switch (code) {
    case 0: return { description: 'Clear sky', icon: 'sun' };
    case 1: return { description: 'Mainly clear', icon: 'sun' };
    case 2: return { description: 'Partly cloudy', icon: 'cloud-sun' };
    case 3: return { description: 'Overcast', icon: 'cloud' };
    case 45: 
    case 48: return { description: 'Fog', icon: 'cloud-fog' };
    case 51: 
    case 53: 
    case 55: return { description: 'Drizzle', icon: 'cloud-drizzle' };
    case 56: 
    case 57: return { description: 'Freezing Drizzle', icon: 'cloud-drizzle' };
    case 61: return { description: 'Slight Rain', icon: 'cloud-rain' };
    case 63: return { description: 'Moderate Rain', icon: 'cloud-rain' };
    case 65: return { description: 'Heavy Rain', icon: 'cloud-rain' };
    case 66: 
    case 67: return { description: 'Freezing Rain', icon: 'cloud-hail' };
    case 71: return { description: 'Slight Snow', icon: 'cloud-snow' };
    case 73: return { description: 'Moderate Snow', icon: 'cloud-snow' };
    case 75: return { description: 'Heavy Snow', icon: 'cloud-snow' };
    case 77: return { description: 'Snow Grains', icon: 'cloud-snow' };
    case 80: 
    case 81: 
    case 82: return { description: 'Rain Showers', icon: 'cloud-rain' };
    case 85: 
    case 86: return { description: 'Snow Showers', icon: 'cloud-snow' };
    case 95: return { description: 'Thunderstorm', icon: 'cloud-lightning' };
    case 96: 
    case 99: return { description: 'Thunderstorm with Hail', icon: 'cloud-lightning' };
    default: return { description: 'Unknown', icon: 'help-circle' };
  }
}

export function getColorForTemperature(tempF: number): string {
  if (tempF < 10) return '#3b82f6'; // blue-500
  if (tempF < 32) return '#06b6d4'; // cyan-500
  if (tempF < 50) return '#10b981'; // emerald-500
  if (tempF < 70) return '#84cc16'; // lime-500
  if (tempF < 85) return '#f59e0b'; // amber-500
  if (tempF < 100) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export const SAMPLE_CITIES = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Houston', lat: 29.7604, lon: -95.3698 },
  { name: 'Phoenix', lat: 33.4484, lon: -112.0740 },
  { name: 'Philadelphia', lat: 39.9526, lon: -75.1652 },
  { name: 'San Antonio', lat: 29.4241, lon: -98.4936 },
  { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
  { name: 'Dallas', lat: 32.7767, lon: -96.7970 },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
  { name: 'Austin', lat: 30.2672, lon: -97.7431 },
  { name: 'Jacksonville', lat: 30.3322, lon: -81.6557 },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Washington', lat: 38.9072, lon: -77.0369 },
  { name: 'Boston', lat: 42.3601, lon: -71.0589 },
  { name: 'Las Vegas', lat: 36.1699, lon: -115.1398 },
  { name: 'Miami', lat: 25.7617, lon: -80.1918 },
  { name: 'Atlanta', lat: 33.7490, lon: -84.3880 },
  { name: 'New Orleans', lat: 29.9511, lon: -90.0715 },
  { name: 'Minneapolis', lat: 44.9778, lon: -93.2650 },
  { name: 'Salt Lake City', lat: 40.7608, lon: -111.8910 },
  { name: 'Portland', lat: 45.5152, lon: -122.6784 },
  { name: 'Kansas City', lat: 39.0997, lon: -94.5786 },
  { name: 'Charlotte', lat: 35.2271, lon: -80.8431 },
  { name: 'Nashville', lat: 36.1627, lon: -86.7816 }
];
