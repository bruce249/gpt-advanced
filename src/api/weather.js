/**
 * Weather API module — Open-Meteo (free, no API key needed)
 * Uses geocoding API for city search + forecast API for weather data.
 */

const WEATHER_STORAGE = 'gpt-advanced-weather-location';

export function loadWeatherLocation() {
    try {
        return JSON.parse(localStorage.getItem(WEATHER_STORAGE) || 'null');
    } catch { return null; }
}

export function saveWeatherLocation(location) {
    localStorage.setItem(WEATHER_STORAGE, JSON.stringify(location));
}

// WMO weather code → description & emoji icon
const WMO_CODES = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mainly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Fog', icon: '🌫️' },
    48: { desc: 'Rime fog', icon: '🌫️' },
    51: { desc: 'Light drizzle', icon: '🌦️' },
    53: { desc: 'Moderate drizzle', icon: '🌦️' },
    55: { desc: 'Dense drizzle', icon: '🌧️' },
    61: { desc: 'Slight rain', icon: '🌦️' },
    63: { desc: 'Moderate rain', icon: '🌧️' },
    65: { desc: 'Heavy rain', icon: '🌧️' },
    71: { desc: 'Slight snow', icon: '🌨️' },
    73: { desc: 'Moderate snow', icon: '🌨️' },
    75: { desc: 'Heavy snow', icon: '❄️' },
    80: { desc: 'Rain showers', icon: '🌦️' },
    81: { desc: 'Moderate showers', icon: '🌧️' },
    82: { desc: 'Violent showers', icon: '⛈️' },
    95: { desc: 'Thunderstorm', icon: '⛈️' },
    96: { desc: 'Thunderstorm + hail', icon: '⛈️' },
    99: { desc: 'Thunderstorm + heavy hail', icon: '⛈️' },
};

function getWeatherInfo(code) {
    return WMO_CODES[code] || { desc: 'Unknown', icon: '🌡️' };
}

/**
 * Geocode a city name → { name, country, latitude, longitude }
 */
async function geocodeCity(city) {
    const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
        throw new Error(`City "${city}" not found`);
    }
    const r = data.results[0];
    return {
        name: r.name,
        country: r.country_code || r.country || '',
        latitude: r.latitude,
        longitude: r.longitude,
    };
}

/**
 * Fetch current weather + 5-day forecast from Open-Meteo
 */
export async function fetchWeather(city) {
    if (!city) return null;

    const geo = await geocodeCity(city);

    const params = new URLSearchParams({
        latitude: geo.latitude,
        longitude: geo.longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: '6',
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    const current = data.current || {};
    const daily = data.daily || {};
    const weatherInfo = getWeatherInfo(current.weather_code);

    const forecast = [];
    const days = daily.time || [];
    for (let i = 1; i < Math.min(days.length, 6); i++) {
        const dayInfo = getWeatherInfo(daily.weather_code?.[i]);
        forecast.push({
            day: new Date(days[i]).toLocaleDateString('en-US', { weekday: 'short' }),
            temp: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
            tempMax: Math.round(daily.temperature_2m_max[i]),
            tempMin: Math.round(daily.temperature_2m_min[i]),
            icon: dayInfo.icon,
            description: dayInfo.desc,
        });
    }

    return {
        city: geo.name,
        country: geo.country,
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind: Math.round(current.wind_speed_10m),
        description: weatherInfo.desc,
        icon: weatherInfo.icon,
        forecast,
    };
}
