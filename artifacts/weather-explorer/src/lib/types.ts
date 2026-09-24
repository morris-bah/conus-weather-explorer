export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export type ChatTurnRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatTurnRole;
  content: string;
  sources?: string[];
}

export interface WeatherChatInput {
  message: string;
  location?: WeatherLocation;
  history?: ChatTurn[];
}

export interface WeatherChatResult {
  answer: string;
  location?: WeatherLocation;
  sources: string[];
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  feature_code: string;
  country_code: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  timezone: string;
  population?: number;
  postcodes?: string[];
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
}

export interface ForecastData {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    cloud_cover: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

export interface WeatherCodeMapping {
  description: string;
  icon: string;
}
