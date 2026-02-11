import React, { useState, useEffect } from 'react';
import { fetchWeather, loadWeatherLocation, saveWeatherLocation } from '../api/weather.js';
import { HiOutlineMapPin, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState('');
    const [savedCity, setSavedCity] = useState(() => loadWeatherLocation());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (savedCity) {
            loadWeather(savedCity);
        }
    }, []);

    async function loadWeather(location) {
        setLoading(true);
        setError('');
        try {
            const data = await fetchWeather(location);
            setWeather(data);
            setSavedCity(location);
            saveWeatherLocation(location);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        if (city.trim()) {
            loadWeather(city.trim());
            setCity('');
        }
    }

    return (
        <div className="weather-widget">
            <form className="weather-search" onSubmit={handleSearch}>
                <HiOutlineMapPin className="weather-search-icon" />
                <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder={savedCity || 'Search city...'}
                    className="weather-search-input"
                />
                <button type="submit" className="weather-search-btn" disabled={loading}>
                    <HiOutlineMagnifyingGlass />
                </button>
            </form>

            {loading && <div className="weather-loading">Loading weather...</div>}
            {error && <div className="weather-error">{error}</div>}

            {weather && !loading && (
                <div className="weather-content">
                    <div className="weather-current">
                        <div className="weather-main">
                            <span className="weather-emoji-icon">{weather.icon}</span>
                            <div className="weather-temp">{weather.temp}°C</div>
                        </div>
                        <div className="weather-details">
                            <div className="weather-city">
                                {weather.city}, {weather.country}
                            </div>
                            <div className="weather-desc">{weather.description}</div>
                            <div className="weather-meta">
                                <span>Feels {weather.feelsLike}°</span>
                                <span>💧 {weather.humidity}%</span>
                                <span>💨 {weather.wind} km/h</span>
                            </div>
                        </div>
                    </div>

                    {weather.forecast.length > 0 && (
                        <div className="weather-forecast">
                            {weather.forecast.map((day, i) => (
                                <div key={i} className="forecast-day">
                                    <span className="forecast-label">{day.day}</span>
                                    <span className="forecast-emoji">{day.icon}</span>
                                    <span className="forecast-temp">{day.temp}°</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
