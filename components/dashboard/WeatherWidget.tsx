'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  updatedAt: Date;
  isDay: boolean;
}

// Weather condition codes from Open-Meteo
// https://open-meteo.com/en/docs/meteorological-variables#weather-variables
enum WeatherCode {
  ClearSky = 0,
  MainlyClear = 1,
  PartlyCloudy = 2,
  Overcast = 3,
  Fog = 45,
  DepositingRimeFog = 48,
  LightDrizzle = 51,
  ModerateDrizzle = 53,
  DenseDrizzle = 55,
  LightFreezingDrizzle = 56,
  DenseFreezingDrizzle = 57,
  SlightRain = 61,
  ModerateRain = 63,
  HeavyRain = 65,
  LightFreezingRain = 66,
  HeavyFreezingRain = 67,
  SlightSnowFall = 71,
  ModerateSnowFall = 73,
  HeavySnowFall = 75,
  SnowGrains = 77,
  SlightRainShowers = 80,
  ModerateRainShowers = 81,
  ViolentRainShowers = 82,
  SlightSnowShowers = 85,
  HeavySnowShowers = 86,
  Thunderstorm = 95,
  ThunderstormWithSlightHail = 96,
  ThunderstormWithHeavyHail = 99
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchWeather() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Brock University, St. Catharines coordinates
        const lat = 43.1167;
        const lon = -79.2494;
        
        // Using Open-Meteo API which doesn't require an API key
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=America%2FNew_York`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        
        if (!data.current) {
          throw new Error('Invalid response from weather API');
        }
        
        // Parse the weather data from Open-Meteo response
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          condition: getWeatherCondition(data.current.weather_code),
          windSpeed: Math.round(data.current.wind_speed_10m),
          humidity: data.current.relative_humidity_2m,
          updatedAt: new Date(),
          isDay: data.current.is_day === 1
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWeather();
    
    // Refresh weather data every 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Convert Open-Meteo weather code to human-readable condition
  function getWeatherCondition(code: number): string {
    switch (code) {
      case WeatherCode.ClearSky:
        return 'Clear Sky';
      case WeatherCode.MainlyClear:
        return 'Mainly Clear';
      case WeatherCode.PartlyCloudy:
        return 'Partly Cloudy';
      case WeatherCode.Overcast:
        return 'Overcast';
      case WeatherCode.Fog:
      case WeatherCode.DepositingRimeFog:
        return 'Foggy';
      case WeatherCode.LightDrizzle:
      case WeatherCode.ModerateDrizzle:
      case WeatherCode.DenseDrizzle:
        return 'Drizzle';
      case WeatherCode.LightFreezingDrizzle:
      case WeatherCode.DenseFreezingDrizzle:
        return 'Freezing Drizzle';
      case WeatherCode.SlightRain:
      case WeatherCode.ModerateRain:
        return 'Rain';
      case WeatherCode.HeavyRain:
        return 'Heavy Rain';
      case WeatherCode.LightFreezingRain:
      case WeatherCode.HeavyFreezingRain:
        return 'Freezing Rain';
      case WeatherCode.SlightSnowFall:
      case WeatherCode.ModerateSnowFall:
        return 'Snow';
      case WeatherCode.HeavySnowFall:
        return 'Heavy Snow';
      case WeatherCode.SnowGrains:
        return 'Snow Grains';
      case WeatherCode.SlightRainShowers:
      case WeatherCode.ModerateRainShowers:
      case WeatherCode.ViolentRainShowers:
        return 'Rain Showers';
      case WeatherCode.SlightSnowShowers:
      case WeatherCode.HeavySnowShowers:
        return 'Snow Showers';
      case WeatherCode.Thunderstorm:
      case WeatherCode.ThunderstormWithSlightHail:
      case WeatherCode.ThunderstormWithHeavyHail:
        return 'Thunderstorm';
      default:
        return 'Unknown';
    }
  }
  
  // Get weather emoji based on weather code and whether it's day or night
  function getWeatherEmoji(condition: string, isDay: boolean): string {
    switch (condition) {
      case 'Clear Sky':
        return isDay ? '☀️' : '🌙';
      case 'Mainly Clear':
        return isDay ? '🌤️' : '🌙';
      case 'Partly Cloudy':
        return isDay ? '⛅' : '☁️';
      case 'Overcast':
        return '☁️';
      case 'Foggy':
        return '🌫️';
      case 'Drizzle':
      case 'Freezing Drizzle':
        return '🌦️';
      case 'Rain':
      case 'Freezing Rain':
        return '🌧️';
      case 'Heavy Rain':
        return '🌧️';
      case 'Snow':
      case 'Snow Grains':
        return '❄️';
      case 'Heavy Snow':
        return '❄️';
      case 'Rain Showers':
        return '🌦️';
      case 'Snow Showers':
        return '🌨️';
      case 'Thunderstorm':
        return '⛈️';
      default:
        return '☁️';
    }
  }
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  if (isLoading) {
    return (
      <div className="p-5 animate-pulse">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Weather on Campus</h3>
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="ml-3 space-y-2 w-full">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
        <div className="mt-2 flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Weather on Campus</h3>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded-md text-xs">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!weather) return null;
  
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Weather on Campus</h3>
      <div className="flex items-center">
        <div className="text-3xl text-blue-500 dark:text-blue-400 mr-3">
          {getWeatherEmoji(weather.condition, weather.isDay)}
        </div>
        <div>
          <div className="flex items-baseline">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{weather.temperature}°C</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">Feels like {weather.feelsLike}°C</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{weather.condition} • Brock University</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">St. Catharines, ON</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex justify-between">
        <span>Wind: {weather.windSpeed} km/h</span>
        <span>Humidity: {weather.humidity}%</span>
      </div>
      <div className="mt-3 text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: Today, {formatTime(weather.updatedAt)}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Powered by <a href="https://open-meteo.com/" className="underline hover:text-indigo-500 dark:hover:text-indigo-400" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
        </p>
      </div>
    </div>
  );
} 