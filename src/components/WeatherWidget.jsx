import React, { useState, useEffect, useCallback } from 'react';
import { fetchWeather, loadSavedCities, addSavedCity, removeSavedCity } from '../api/weather.js';
import { HiOutlineMapPin, HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

function WeatherCard({ cityName, onRemove }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        fetchWeather(cityName)
            .then(data => { if (!cancelled) setWeather(data); })
            .catch(e => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [cityName]);

    if (loading) {
        return (
            <div className="weather-card">
                <div className="weather-card-loading">
                    <span className="weather-card-loading-text">Loading {cityName}...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="weather-card weather-card-error-card">
                <div className="weather-card-header">
                    <span className="weather-card-city-name">❌ {cityName}</span>
                    <button className="weather-card-remove" onClick={() => onRemove(cityName)} title="Remove">
                        <HiOutlineXMark />
                    </button>
                </div>
                <div className="weather-card-error-msg">{error}</div>
            </div>
        );
    }

    if (!weather) return null;

    return (
        <div className="weather-card">
            <div className="weather-card-header">
                <div className="weather-card-location">
                    <span className="weather-card-city-name">{weather.city}</span>
                    <span className="weather-card-country">{weather.country}</span>
                </div>
                <button className="weather-card-remove" onClick={() => onRemove(cityName)} title="Remove city">
                    <HiOutlineXMark />
                </button>
            </div>
            <div className="weather-card-main">
                <span className="weather-card-icon">{weather.icon}</span>
                <div className="weather-card-temp-block">
                    <span className="weather-card-temp">{weather.temp}°</span>
                    <span className="weather-card-desc">{weather.description}</span>
                </div>
            </div>
            <div className="weather-card-stats">
                <span>Feels {weather.feelsLike}°</span>
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.wind} km/h</span>
            </div>
            {weather.forecast.length > 0 && (
                <div className="weather-card-forecast">
                    {weather.forecast.slice(0, 4).map((day, i) => (
                        <div key={i} className="weather-card-fday">
                            <span className="weather-card-fday-label">{day.day}</span>
                            <span className="weather-card-fday-icon">{day.icon}</span>
                            <span className="weather-card-fday-temp">{day.temp}°</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function WeatherWidget() {
    const [savedCities, setSavedCities] = useState(() => loadSavedCities());
    const [searchCity, setSearchCity] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const handleAddCity = useCallback((e) => {
        e?.preventDefault();
        const name = searchCity.trim();
        if (!name) return;
        const updated = addSavedCity(name);
        setSavedCities(updated);
        setSearchCity('');
        setShowSearch(false);
    }, [searchCity]);

    const handleRemoveCity = useCallback((cityName) => {
        const updated = removeSavedCity(cityName);
        setSavedCities(updated);
    }, []);

    return (
        <div className="weather-widget-multi">
            {/* Header */}
            <div className="weather-widget-header">
                <span className="weather-widget-title">🌤️ Weather</span>
                <button
                    className="weather-add-btn"
                    onClick={() => setShowSearch(!showSearch)}
                    title="Add city"
                >
                    <HiOutlinePlus />
                    <span>Add City</span>
                </button>
            </div>

            {/* Search bar */}
            {showSearch && (
                <form className="weather-add-form" onSubmit={handleAddCity}>
                    <HiOutlineMapPin className="weather-add-form-icon" />
                    <input
                        type="text"
                        value={searchCity}
                        onChange={e => setSearchCity(e.target.value)}
                        placeholder="Type city name and press Enter..."
                        className="weather-add-form-input"
                        autoFocus
                    />
                    <button type="submit" className="weather-add-form-btn" disabled={!searchCity.trim()}>
                        <HiOutlinePlus />
                    </button>
                </form>
            )}

            {/* City cards */}
            {savedCities.length === 0 ? (
                <div className="weather-empty">
                    <HiOutlineMapPin />
                    <span>No cities added yet. Click "Add City" to get started.</span>
                </div>
            ) : (
                <div className="weather-cards-grid">
                    {savedCities.map(city => (
                        <WeatherCard key={city} cityName={city} onRemove={handleRemoveCity} />
                    ))}
                </div>
            )}
        </div>
    );
}
