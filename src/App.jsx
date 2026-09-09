import { useEffect, useMemo, useState } from "react";

const DEFAULT_LOCATION = {
  name: "Hyderabad",
  country: "India",
  latitude: 17.385,
  longitude: 78.4867,
};

const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm + hail", "⛈️"],
  99: ["Thunderstorm + hail", "⛈️"],
};

const getWeather = (code) =>
  weatherCodes[code] || ["Weather unavailable", "🌤️"];

const getDay = (date) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  });

const getLongDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

function App() {
  const [screen, setScreen] = useState("welcome");
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("skycast-location")) || DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  function chooseLocation(next) {
    setLocation(next);
    localStorage.setItem("skycast-location", JSON.stringify(next));
    setScreen("weather");
  }

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const button = document.querySelector(".search-trigger");
        if (button) button.click();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  if (screen === "welcome") {
    return <Welcome onStart={() => setScreen("login")} />;
  }

  if (screen === "login") {
    return (
      <Login
        onBack={() => setScreen("welcome")}
        onContinue={() => setScreen("location")}
      />
    );
  }

  if (screen === "location") {
    return (
      <LocationScreen
        current={location}
        onBack={() => setScreen("login")}
        onChoose={chooseLocation}
      />
    );
  }

  return (
    <Dashboard
      screen={screen}
      setScreen={setScreen}
      location={location}
      onLocation={() => setScreen("location")}
    />
  );
}

function Welcome({ onStart }) {
  return (
    <div className="app">
      <Header onLogo={onStart} action={<button className="outline-btn" onClick={onStart}>Get Started</button>} />

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">✦ SMART WEATHER ASSISTANT</span>
          <h1>
            Know your weather.
            <br />
            <span>Plan smarter.</span>
          </h1>
          <p>
            SkyCast combines live weather, forecasts, alerts, travel planning,
            event comfort and smart agriculture insights in one simple place.
          </p>
          <button className="primary-btn" onClick={onStart}>
            Explore SkyCast <span>→</span>
          </button>
        </div>

        <div className="hero-card">
          <div className="hero-card-head">
            <div>
              <span className="muted">CURRENT WEATHER</span>
              <h3>Hyderabad, India</h3>
            </div>
            <span className="hero-icon">☀️</span>
          </div>
          <div className="hero-temp">28°</div>
          <p>Partly cloudy</p>
          <div className="three-stats">
            <MiniStat icon="💧" value="68%" label="Humidity" />
            <MiniStat icon="💨" value="12 km/h" label="Wind" />
            <MiniStat icon="🌡️" value="31°" label="Feels like" />
          </div>
        </div>
      </section>

      <section className="section landing-section">
        <span className="eyebrow">ONE APP, MANY USE CASES</span>
        <h2>Weather information built around real life.</h2>
        <div className="feature-grid">
          <Feature icon="🌦️" title="Live Weather" text="Real-time conditions and a clear 7-day outlook." />
          <Feature icon="🌾" title="Smart Agriculture" text="Soil moisture and weather-based farming insights." />
          <Feature icon="🏖️" title="Beach & Surf" text="Wave, sea temperature and beach-safety information." />
          <Feature icon="✈️" title="Travel Planner" text="Saved destinations, alerts and packing suggestions." />
          <Feature icon="🎉" title="Event Planner" text="Rain probability and a simple outdoor comfort index." />
          <Feature icon="🗺️" title="Weather Map" text="Explore your location on an interactive map." />
        </div>
      </section>

      <footer>
        <Logo />
        <span>Simple weather. Smarter planning.</span>
      </footer>
    </div>
  );
}

function Login({ onBack, onContinue }) {
  return (
    <div className="center-page">
      <button className="back-link" onClick={onBack}>← Back</button>
      <div className="auth-card">
        <div className="auth-logo">☁</div>
        <h1>Welcome to SkyCast</h1>
        <p>Continue as a guest and start using the weather assistant immediately.</p>
        <button className="primary-btn full" onClick={onContinue}>
          Continue <span>→</span>
        </button>
        <button className="ghost-btn full" onClick={onContinue}>Continue as Guest</button>
      </div>
    </div>
  );
}

function LocationScreen({ current, onBack, onChoose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function useMyLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location. Use Hyderabad instead.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        let name = "Your Location";
        let country = "";

        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&count=1&language=en&format=json`
          );
          const data = await res.json();
          name = data.results?.[0]?.name || name;
          country = data.results?.[0]?.country || country;
        } catch {}

        onChoose({
          name,
          country,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setLoading(false);
      },
      () => {
        setLoading(false);
        setMessage("Location permission was denied. You can use Hyderabad.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="center-page">
      <button className="back-link" onClick={onBack}>← Back</button>
      <div className="location-card">
        <div className="location-big">📍</div>
        <h1>Choose your location</h1>
        <p>Use your current location or continue with the saved location.</p>
        {message && <div className="notice">{message}</div>}
        <button className="primary-btn full" onClick={useMyLocation} disabled={loading}>
          {loading ? "Finding location..." : "Use My Location"} {!loading && <span>→</span>}
        </button>
        <button className="ghost-btn full" onClick={() => onChoose(current)}>
          Use {current.name}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ screen, setScreen, location, onLocation }) {
  const [weather, setWeather] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [marine, setMarine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWeather() {
    setLoading(true);
    setError("");

    try {
      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure" +
        "&hourly=temperature_2m,precipitation_probability,weather_code,relative_humidity_2m" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max" +
        "&timezone=auto&forecast_days=7";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      setWeather(await res.json());

      const marineUrl =
        "https://marine-api.open-meteo.com/v1/marine" +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        "&current=wave_height,wave_direction,wave_period,sea_surface_temperature" +
        "&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature" +
        "&timezone=auto&forecast_days=3";

      try {
        const marineRes = await fetch(marineUrl);
        if (marineRes.ok) setMarine(await marineRes.json());
        else setMarine(null);
      } catch {
        setMarine(null);
      }
    } catch {
      setError("Live weather could not be loaded. Check your internet connection.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadWeather();
  }, [location.latitude, location.longitude]);

  const title =
    screen === "weather" ? "Weather" :
    screen === "forecast" ? "7-Day Forecast" :
    screen === "agriculture" ? "Smart Agriculture" :
    screen === "beach" ? "Beach & Surf" :
    screen === "travel" ? "Travel Planner" :
    screen === "events" ? "Event Planner" :
    screen === "alerts" ? "Weather Alerts" :
    screen === "map" ? "Weather Map" :
    screen === "profile" ? "Profile & Settings" : "Weather";

  return (
    <div className="dashboard">
      <Header
        onLogo={() => setScreen("weather")}
        action={
          <div className="header-actions">
            <button className="search-trigger" onClick={() => setSearchOpen(true)}>
              <span>⌕</span><span className="search-trigger-text">Search city...</span><kbd>Ctrl K</kbd>
            </button>
            <button className="location-chip" onClick={onLocation}>
              📍 {location.name}
            </button>
          </div>
        }
      />

      {searchOpen && (
        <CitySearch
          current={location}
          onClose={() => setSearchOpen(false)}
          onSelect={(next) => {
            onLocation(next);
            setSearchOpen(false);
            setScreen("weather");
          }}
        />
      )}

      <div className="dashboard-layout">
        <aside className="sidebar">
          <SideItem icon="☀️" label="Weather" active={screen === "weather"} onClick={() => setScreen("weather")} />
          <SideItem icon="📅" label="Forecast" active={screen === "forecast"} onClick={() => setScreen("forecast")} />
          <SideItem icon="🔔" label="Alerts" active={screen === "alerts"} onClick={() => setScreen("alerts")} />
          <div className="side-label">SMART MODULES</div>
          <SideItem icon="🌾" label="Agriculture" active={screen === "agriculture"} onClick={() => setScreen("agriculture")} />
          <SideItem icon="🏖️" label="Beach & Surf" active={screen === "beach"} onClick={() => setScreen("beach")} />
          <SideItem icon="✈️" label="Travel" active={screen === "travel"} onClick={() => setScreen("travel")} />
          <SideItem icon="🎉" label="Events" active={screen === "events"} onClick={() => setScreen("events")} />
          <SideItem icon="🗺️" label="Map" active={screen === "map"} onClick={() => setScreen("map")} />
          <div className="side-bottom">
            <SideItem icon="👤" label="Profile" active={screen === "profile"} onClick={() => setScreen("profile")} />
          </div>
        </aside>

        <main className="content">
          <div className="mobile-title">
            <span className="muted">{title.toUpperCase()}</span>
            <h1>{title}</h1>
          </div>

          {loading && <Loading />}
          {!loading && error && (
            <ErrorState message={error} retry={loadWeather} />
          )}

          {!loading && !error && screen === "weather" && (
            <WeatherHome weather={weather} location={location} setScreen={setScreen} refresh={loadWeather} />
          )}

          {!loading && !error && screen === "forecast" && (
            <ForecastPage weather={weather} location={location} />
          )}

          {!loading && !error && screen === "alerts" && (
            <AlertsPage weather={weather} location={location} />
          )}

          {!loading && !error && screen === "agriculture" && (
            <AgriculturePage weather={weather} location={location} />
          )}

          {!loading && !error && screen === "beach" && (
            <BeachPage marine={marine} location={location} />
          )}

          {!loading && !error && screen === "travel" && (
            <TravelPage weather={weather} location={location} />
          )}

          {!loading && !error && screen === "events" && (
            <EventsPage weather={weather} location={location} />
          )}

          {screen === "map" && <MapPage location={location} />}

          {screen === "profile" && (
            <ProfilePage location={location} onLocation={onLocation} />
          )}
        </main>
      </div>

      <MobileNav screen={screen} setScreen={setScreen} />
    </div>
  );
}

function CitySearch({ current, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setMessage("");
        return;
      }

      setLoading(true);
      setMessage("");
      try {
        const url =
          "https://geocoding-api.open-meteo.com/v1/search" +
          `?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const places = (data.results || []).map((item) => ({
          name: item.name,
          country: item.country || item.country_code || "",
          admin1: item.admin1 || "",
          latitude: item.latitude,
          longitude: item.longitude,
          timezone: item.timezone || "",
        }));
        setResults(places);
        if (!places.length) setMessage("No city found. Try another name.");
      } catch {
        setResults([]);
        setMessage("Could not search right now. Check your internet connection.");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="search-overlay" onMouseDown={onClose}>
      <div className="search-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="search-modal-head">
          <div>
            <span className="eyebrow">SKYCAST LOCATION</span>
            <h2>Search a city</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="search-input-wrap">
          <span>⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a city name..."
          />
          <kbd>ESC</kbd>
        </div>

        {loading && <div className="search-status">Searching worldwide...</div>}
        {!loading && message && <div className="search-status">{message}</div>}

        <div className="search-results">
          {results.map((place) => (
            <button
              className="search-result"
              key={`${place.latitude}-${place.longitude}-${place.name}`}
              onClick={() => onSelect(place)}
            >
              <span className="result-icon">📍</span>
              <span className="result-copy">
                <strong>{place.name}</strong>
                <small>{[place.admin1, place.country].filter(Boolean).join(" • ")}</small>
              </span>
              <span className="result-arrow">→</span>
            </button>
          ))}
        </div>

        {!query && (
          <button className="current-location-result" onClick={() => onSelect(current)}>
            <span>📍</span>
            <span><strong>Current location</strong><small>{current.name}, {current.country}</small></span>
          </button>
        )}
      </div>
    </div>
  );
}

function WeatherHome({ weather, location, setScreen, refresh }) {
  const current = weather.current;
  const [condition, icon] = getWeather(current.weather_code);

  const hours = weather.hourly.time
    .map((time, i) => ({
      time,
      temp: weather.hourly.temperature_2m[i],
      rain: weather.hourly.precipitation_probability[i],
      code: weather.hourly.weather_code[i],
    }))
    .filter((x) => new Date(x.time).getTime() >= Date.now())
    .slice(0, 12);

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">TODAY • {getLongDate().toUpperCase()}</span>
          <h1>{location.name}</h1>
          <p>{location.country || "Current location"} • Live conditions</p>
        </div>
        <button className="small-btn" onClick={refresh}>↻ Refresh</button>
      </div>

      <section className="current-panel">
        <div className="current-left">
          <span className="weather-emoji">{icon}</span>
          <div>
            <div className="current-number">{Math.round(current.temperature_2m)}°</div>
            <h2>{condition}</h2>
            <p>Feels like {Math.round(current.apparent_temperature)}°</p>
          </div>
        </div>

        <div className="current-metrics">
          <Metric icon="💧" label="Humidity" value={`${current.relative_humidity_2m}%`} />
          <Metric icon="💨" label="Wind" value={`${Math.round(current.wind_speed_10m)} km/h`} />
          <Metric icon="🌧️" label="Rain" value={`${current.precipitation} mm`} />
          <Metric icon="📊" label="Pressure" value={`${Math.round(current.surface_pressure)} hPa`} />
        </div>
      </section>

      <section className="panel-section">
        <SectionHeading eyebrow="NEXT 12 HOURS" title="Hourly forecast" />
        <div className="hour-row">
          {hours.map((item, i) => (
            <div className={`hour-card ${i === 0 ? "selected" : ""}`} key={item.time}>
              <small>{i === 0 ? "Now" : formatHour(item.time)}</small>
              <span>{getWeather(item.code)[1]}</span>
              <strong>{Math.round(item.temp)}°</strong>
              <em>💧 {item.rain}%</em>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <SectionHeading eyebrow="LOOKING AHEAD" title="7-day forecast" />
        <div className="daily-list">
          {weather.daily.time.map((date, i) => (
            <div className="daily-row" key={date}>
              <div>
                <strong>{i === 0 ? "Today" : getDay(date)}</strong>
                <small>{getWeather(weather.daily.weather_code[i])[0]}</small>
              </div>
              <span>{getWeather(weather.daily.weather_code[i])[1]}</span>
              <div className="rain-text">💧 {weather.daily.precipitation_probability_max[i]}%</div>
              <div className="temps">
                <strong>{Math.round(weather.daily.temperature_2m_max[i])}°</strong>
                <span>{Math.round(weather.daily.temperature_2m_min[i])}°</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-grid">
        <QuickCard icon="🌾" title="Agriculture" text="Check soil moisture" onClick={() => setScreen("agriculture")} />
        <QuickCard icon="🏖️" title="Beach & Surf" text="Check sea conditions" onClick={() => setScreen("beach")} />
        <QuickCard icon="✈️" title="Travel" text="Plan your trip" onClick={() => setScreen("travel")} />
        <QuickCard icon="🎉" title="Events" text="Check outdoor comfort" onClick={() => setScreen("events")} />
      </section>
    </>
  );
}

function ForecastPage({ weather, location }) {
  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">FORECAST</span>
          <h1>7-Day Forecast</h1>
          <p>Extended outlook for {location.name}.</p>
        </div>
      </div>

      <div className="forecast-large">
        {weather.daily.time.map((date, i) => (
          <div className="forecast-card" key={date}>
            <div>
              <strong>{i === 0 ? "Today" : getDay(date)}</strong>
              <small>{getWeather(weather.daily.weather_code[i])[0]}</small>
            </div>
            <span>{getWeather(weather.daily.weather_code[i])[1]}</span>
            <div className="forecast-rain">💧 {weather.daily.precipitation_probability_max[i]}%</div>
            <div className="forecast-temp">
              <strong>{Math.round(weather.daily.temperature_2m_max[i])}°</strong>
              <span>{Math.round(weather.daily.temperature_2m_min[i])}°</span>
            </div>
            <div className="uv">UV {Math.round(weather.daily.uv_index_max?.[i] || 0)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function AlertsPage({ weather, location }) {
  const code = weather.current.weather_code;
  const severe = code >= 95;
  const rainy = code >= 51 && code <= 82;

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">SAFETY</span>
          <h1>Weather Alerts</h1>
          <p>Useful notices for {location.name}.</p>
        </div>
      </div>

      <div className={`alert-main ${severe ? "danger" : rainy ? "warning" : "safe"}`}>
        <div className="alert-symbol">{severe ? "⛈️" : rainy ? "🌧️" : "✓"}</div>
        <div>
          <span className="muted">{severe || rainy ? "WEATHER NOTICE" : "ALL CLEAR"}</span>
          <h2>
            {severe ? "Thunderstorm conditions" :
              rainy ? "Rain conditions detected" :
              "No active severe weather"}
          </h2>
          <p>
            {severe
              ? "Thunderstorms are detected. Consider staying indoors and checking local official advisories."
              : rainy
                ? "Rain or showers are detected. Carry rain protection when going outside."
                : "Current conditions do not indicate severe weather from the available forecast data."}
          </p>
        </div>
      </div>

      <div className="info-grid">
        <InfoCard icon="🌡️" title="Temperature" value={`${Math.round(weather.current.temperature_2m)}°C`} />
        <InfoCard icon="💨" title="Wind" value={`${Math.round(weather.current.wind_speed_10m)} km/h`} />
        <InfoCard icon="☀️" title="UV Index" value={`${Math.round(weather.daily.uv_index_max?.[0] || 0)}`} />
      </div>
    </>
  );
}

function AgriculturePage({ weather, location }) {
  const [soil, setSoil] = useState(null);
  const [soilLoading, setSoilLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchSoil() {
      setSoilLoading(true);
      try {
        const url =
          "https://api.open-meteo.com/v1/forecast" +
          `?latitude=${location.latitude}&longitude=${location.longitude}` +
          "&current=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_temperature_0cm" +
          "&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_temperature_0cm" +
          "&timezone=auto&forecast_days=1";

        const res = await fetch(url);
        const data = await res.json();
        if (active) setSoil(data.current || null);
      } catch {
        if (active) setSoil(null);
      }
      if (active) setSoilLoading(false);
    }

    fetchSoil();
    return () => { active = false; };
  }, [location.latitude, location.longitude]);

  const moisture = soil?.soil_moisture_0_to_1cm;
  const rainTomorrow = weather.daily.precipitation_probability_max?.[1] ?? 0;
  const temp = weather.current.temperature_2m;

  const recommendation =
    rainTomorrow >= 60
      ? "Rain is likely soon. Consider delaying irrigation and monitor field drainage."
      : moisture != null && moisture < 0.2
        ? "Surface soil moisture is relatively low. Consider checking the field before irrigation."
        : "Conditions look moderate. Continue normal field monitoring.";

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">SMART AGRICULTURE</span>
          <h1>Farm Weather</h1>
          <p>Weather and soil information for {location.name}.</p>
        </div>
      </div>

      <div className="agri-hero">
        <div>
          <span className="large-module-icon">🌾</span>
          <h2>Weather-aware farming</h2>
          <p>Use the available weather and soil data to support irrigation and outdoor planning.</p>
        </div>
        <div className="agri-status">
          <span>SOIL MOISTURE</span>
          <strong>{soilLoading ? "..." : moisture != null ? `${(moisture * 100).toFixed(1)}%` : "Unavailable"}</strong>
        </div>
      </div>

      <div className="info-grid">
        <InfoCard icon="💧" title="Surface moisture" value={soilLoading ? "Loading" : moisture != null ? `${(moisture * 100).toFixed(1)}%` : "Unavailable"} />
        <InfoCard icon="🌡️" title="Soil temperature" value={soil?.soil_temperature_0cm != null ? `${Math.round(soil.soil_temperature_0cm)}°C` : "Unavailable"} />
        <InfoCard icon="🌧️" title="Rain probability" value={`${rainTomorrow}%`} />
      </div>

      <div className="recommendation">
        <span>💡</span>
        <div>
          <span className="muted">SMART SUGGESTION</span>
          <h3>{recommendation}</h3>
          <p>Current air temperature: {Math.round(temp)}°C. Always verify field conditions locally before making irrigation decisions.</p>
        </div>
      </div>
    </>
  );
}

function BeachPage({ marine, location }) {
  const seaTemp = marine?.current?.sea_surface_temperature;
  const wave = marine?.current?.wave_height;
  const period = marine?.current?.wave_period;

  const inland =
    location.latitude > 0 &&
    !marine
      ? "Marine data is unavailable for this inland location. Select a coastal location to use the beach module."
      : null;

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">SMART BEACH MODULE</span>
          <h1>Beach & Surf</h1>
          <p>Sea conditions for the selected location.</p>
        </div>
      </div>

      {inland && <div className="notice">{inland}</div>}

      <div className="beach-hero">
        <div className="beach-visual">🏖️</div>
        <div>
          <span className="muted">COASTAL CONDITIONS</span>
          <h2>{marine ? "Current marine data" : "Marine data unavailable"}</h2>
          <p>
            Wave height, wave period and sea-surface temperature are shown when
            marine data is available for the selected coordinates.
          </p>
        </div>
      </div>

      <div className="info-grid">
        <InfoCard icon="🌊" title="Wave height" value={wave != null ? `${wave.toFixed(1)} m` : "Unavailable"} />
        <InfoCard icon="🌡️" title="Water temperature" value={seaTemp != null ? `${seaTemp.toFixed(1)}°C` : "Unavailable"} />
        <InfoCard icon="〰️" title="Wave period" value={period != null ? `${period.toFixed(1)} s` : "Unavailable"} />
      </div>

      <div className="recommendation">
        <span>🛟</span>
        <div>
          <span className="muted">SAFETY NOTE</span>
          <h3>Check local beach and lifeguard advisories before entering the water.</h3>
          <p>SkyCast marine data is informational and does not replace official safety guidance.</p>
        </div>
      </div>
    </>
  );
}

function TravelPage({ weather, location }) {
  const [destination, setDestination] = useState("London");
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("skycast-destinations")) || ["London"];
    } catch {
      return ["London"];
    }
  });

  const [destinationWeather, setDestinationWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const cities = {
    London: { lat: 51.5074, lon: -0.1278 },
    Mumbai: { lat: 19.076, lon: 72.8777 },
    Bengaluru: { lat: 12.9716, lon: 77.5946 },
    Delhi: { lat: 28.6139, lon: 77.209 },
  };

  async function checkDestination(name) {
    setDestination(name);
    setLoading(true);
    const city = cities[name];

    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${city.lat}&longitude=${city.lon}` +
        "&current=temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
        "&timezone=auto&forecast_days=5"
      );
      const data = await res.json();
      setDestinationWeather(data);
    } catch {
      setDestinationWeather(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    checkDestination("London");
  }, []);

  function saveDestination() {
    if (!saved.includes(destination)) {
      const next = [...saved, destination];
      setSaved(next);
      localStorage.setItem("skycast-destinations", JSON.stringify(next));
    }
  }

  const packing = useMemo(() => {
    const data = destinationWeather;
    if (!data) return [];
    const max = data.daily.temperature_2m_max[0];
    const rain = data.daily.precipitation_probability_max[0];
    const items = ["Comfortable clothes", "Travel documents"];

    if (rain >= 40) items.push("Umbrella / rain jacket");
    if (max >= 30) items.push("Light clothes", "Sunscreen");
    if (max <= 15) items.push("Warm layer / jacket");

    return items;
  }, [destinationWeather]);

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">TRAVEL ASSISTANT</span>
          <h1>Travel Planner</h1>
          <p>Check weather before you travel.</p>
        </div>
      </div>

      <div className="travel-toolbar">
        <select value={destination} onChange={(e) => checkDestination(e.target.value)}>
          {Object.keys(cities).map((city) => <option key={city}>{city}</option>)}
        </select>
        <button className="primary-btn" onClick={saveDestination}>☆ Save Destination</button>
      </div>

      <div className="saved-row">
        {saved.map((city) => (
          <button key={city} className="saved-chip" onClick={() => checkDestination(city)}>
            📍 {city}
          </button>
        ))}
      </div>

      {loading && <Loading />}

      {!loading && destinationWeather && (
        <>
          <div className="travel-hero">
            <div>
              <span className="weather-emoji">{getWeather(destinationWeather.current.weather_code)[1]}</span>
              <div>
                <span className="muted">DESTINATION WEATHER</span>
                <h2>{destination}</h2>
                <p>{getWeather(destinationWeather.current.weather_code)[0]}</p>
              </div>
            </div>
            <strong>{Math.round(destinationWeather.current.temperature_2m)}°</strong>
          </div>

          <div className="info-grid">
            <InfoCard icon="🌧️" title="Rain probability" value={`${destinationWeather.daily.precipitation_probability_max[0]}%`} />
            <InfoCard icon="💨" title="Wind" value={`${Math.round(destinationWeather.current.wind_speed_10m)} km/h`} />
            <InfoCard icon="🌡️" title="Feels like" value={`${Math.round(destinationWeather.current.apparent_temperature)}°`} />
          </div>

          <div className="recommendation">
            <span>🎒</span>
            <div>
              <span className="muted">PACKING SUGGESTIONS</span>
              <h3>Pack for the expected conditions</h3>
              <div className="packing-list">
                {packing.map((item) => <span key={item}>✓ {item}</span>)}
              </div>
            </div>
          </div>

          <div className="recommendation">
            <span>✈️</span>
            <div>
              <span className="muted">TRAVEL ALERT</span>
              <h3>
                {destinationWeather.daily.precipitation_probability_max[0] >= 70
                  ? "High chance of rain. Check transport and flight updates before departure."
                  : "No major rain signal in the current forecast. Still check official travel updates."}
              </h3>
            </div>
          </div>
        </>
      )}

      {weather && (
        <div className="mini-source">
          Your home location is <strong>{locationName(location)}</strong>.
        </div>
      )}
    </>
  );
}

function EventsPage({ weather, location }) {
  const [dateIndex, setDateIndex] = useState(0);

  const max = weather.daily.temperature_2m_max[dateIndex];
  const min = weather.daily.temperature_2m_min[dateIndex];
  const rain = weather.daily.precipitation_probability_max[dateIndex];
  const code = weather.daily.weather_code[dateIndex];

  const comfort = calculateComfort(max, rain, code);

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">OUTDOOR EVENT PLANNER</span>
          <h1>Event Planner</h1>
          <p>Choose a day for a wedding, gathering or outdoor activity.</p>
        </div>
      </div>

      <div className="date-selector">
        {weather.daily.time.map((date, i) => (
          <button
            key={date}
            className={dateIndex === i ? "date-btn active" : "date-btn"}
            onClick={() => setDateIndex(i)}
          >
            <small>{i === 0 ? "Today" : getDay(date)}</small>
            <strong>{new Date(date + "T12:00:00").getDate()}</strong>
          </button>
        ))}
      </div>

      <div className={`comfort-card ${comfort.className}`}>
        <div className="comfort-score">{comfort.score}</div>
        <div>
          <span className="muted">OUTDOOR COMFORT INDEX</span>
          <h2>{comfort.label}</h2>
          <p>{comfort.message}</p>
        </div>
      </div>

      <div className="info-grid">
        <InfoCard icon="🌡️" title="Temperature" value={`${Math.round(min)}°–${Math.round(max)}°C`} />
        <InfoCard icon="🌧️" title="Rain probability" value={`${rain}%`} />
        <InfoCard icon={getWeather(code)[1]} title="Conditions" value={getWeather(code)[0]} />
      </div>

      <div className="recommendation">
        <span>🎉</span>
        <div>
          <span className="muted">EVENT SUGGESTION</span>
          <h3>
            {comfort.score >= 75
              ? `Good candidate for outdoor events in ${location.name}.`
              : comfort.score >= 50
                ? "Possible for outdoor plans with a backup indoor option."
                : "Consider an indoor venue or backup plan for this date."}
          </h3>
          <p>The comfort index is a simple prototype score based on temperature, rain probability and weather condition.</p>
        </div>
      </div>
    </>
  );
}

function MapPage({ location }) {
  const bbox =
    `${location.longitude - 0.08}%2C${location.latitude - 0.06}%2C` +
    `${location.longitude + 0.08}%2C${location.latitude + 0.06}`;

  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">EXPLORE</span>
          <h1>Weather Map</h1>
          <p>Map centered on {location.name}.</p>
        </div>
      </div>

      <div className="map-wrap">
        <iframe
          title="SkyCast map"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
        />
      </div>

      <div className="map-info">
        📍 <strong>{location.name}</strong>
        <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
      </div>
    </>
  );
}

function ProfilePage({ location, onLocation }) {
  return (
    <>
      <div className="content-head">
        <div>
          <span className="muted">ACCOUNT</span>
          <h1>Profile & Settings</h1>
          <p>Your SkyCast preferences.</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="avatar">S</div>
        <div>
          <h2>SkyCast User</h2>
          <p>Guest account</p>
        </div>
      </div>

      <div className="settings">
        <button onClick={onLocation}>
          <span>📍</span>
          <div><strong>Location</strong><small>{location.name}, {location.country}</small></div>
          <b>›</b>
        </button>
        <button onClick={() => alert("Weather notifications are enabled for this prototype.")}>
          <span>🔔</span>
          <div><strong>Weather Notifications</strong><small>Severe weather and planning alerts</small></div>
          <b>›</b>
        </button>
        <button onClick={() => alert("SkyCast Smart Weather Assistant • Prototype v1.0")}>
          <span>ℹ️</span>
          <div><strong>About SkyCast</strong><small>Weather, travel, agriculture and event planning</small></div>
          <b>›</b>
        </button>
      </div>
    </>
  );
}

function Header({ onLogo, action }) {
  return (
    <header className="topbar">
      <button className="brand-btn" onClick={onLogo}>
        <Logo />
      </button>
      {action}
    </header>
  );
}

function Logo() {
  return (
    <div className="logo">
      <div className="logo-box">☁</div>
      <span>SkyCast</span>
    </div>
  );
}

function SideItem({ icon, label, active, onClick }) {
  return (
    <button className={`side-item ${active ? "active" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}

function MobileNav({ screen, setScreen }) {
  const items = [
    ["☀️", "Weather", "weather"],
    ["📅", "Forecast", "forecast"],
    ["🌾", "Farm", "agriculture"],
    ["✈️", "Travel", "travel"],
    ["👤", "Profile", "profile"],
  ];

  return (
    <nav className="mobile-nav">
      {items.map(([icon, label, id]) => (
        <button className={screen === id ? "active" : ""} key={id} onClick={() => setScreen(id)}>
          <span>{icon}</span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}

function MiniStat({ icon, value, label }) {
  return (
    <div className="mini-stat">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="section-heading">
      <span className="muted">{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function QuickCard({ icon, title, text, onClick }) {
  return (
    <button className="quick-card" onClick={onClick}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
      <b>→</b>
    </button>
  );
}

function InfoCard({ icon, title, value }) {
  return (
    <div className="info-card">
      <span>{icon}</span>
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <h2>Loading SkyCast...</h2>
      <p>Getting the latest weather information.</p>
    </div>
  );
}

function ErrorState({ message, retry }) {
  return (
    <div className="loading">
      <span className="error-icon">⚠️</span>
      <h2>Weather unavailable</h2>
      <p>{message}</p>
      <button className="primary-btn" onClick={retry}>Try Again</button>
    </div>
  );
}

function calculateComfort(max, rain, code) {
  let score = 100;

  if (max > 35) score -= 30;
  else if (max > 32) score -= 18;
  else if (max > 29) score -= 8;
  else if (max < 12) score -= 22;
  else if (max < 18) score -= 10;

  score -= Math.min(40, Math.round(rain * 0.45));

  if (code >= 95) score -= 30;
  else if (code >= 80) score -= 15;
  else if (code >= 61) score -= 10;

  score = Math.max(0, Math.min(100, score));

  if (score >= 75) {
    return {
      score,
      label: "Excellent",
      className: "excellent",
      message: "Weather looks favorable for an outdoor event.",
    };
  }

  if (score >= 50) {
    return {
      score,
      label: "Moderate",
      className: "moderate",
      message: "Outdoor plans are possible, but keep a backup option.",
    };
  }

  return {
    score,
    label: "Not ideal",
    className: "poor",
    message: "Weather may make an outdoor event uncomfortable.",
  };
}

function formatHour(value) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
  });
}

function locationName(location) {
  return `${location.name}${location.country ? `, ${location.country}` : ""}`;
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

:root {
  font-family: Poppins, sans-serif;
  color: #eef7ff;
  background: #06111e;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  min-width: 320px;
  margin: 0;
  background: #06111e;
  color: #eef7ff;
  font-family: Poppins, sans-serif;
}

button, select { font: inherit; }
button { cursor: pointer; }
button:disabled { opacity: .65; cursor: not-allowed; }

.app, .dashboard {
  min-height: 100vh;
  background:
    radial-gradient(circle at 80% 0%, rgba(56,189,248,.08), transparent 28%),
    #06111e;
}

.topbar {
  height: 76px;
  padding: 0 5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,.07);
  background: rgba(6,17,30,.95);
}

.brand-btn { border: 0; background: none; color: white; }
.logo { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; }
.logo-box {
  width: 38px; height: 38px; display: grid; place-items: center;
  border-radius: 12px; background: #38bdf8; color: #04111d; font-size: 22px;
}

.outline-btn, .small-btn {
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.03);
  color: white;
  border-radius: 11px;
  padding: 10px 17px;
}

.location-chip {
  border: 1px solid rgba(56,189,248,.2);
  background: rgba(56,189,248,.08);
  color: #a9e6ff;
  border-radius: 20px;
  padding: 9px 15px;
}

.hero {
  min-height: 650px;
  padding: 80px 8%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}

.hero-copy { max-width: 700px; }
.eyebrow { color: #38bdf8; font-size: 11px; letter-spacing: 1.7px; font-weight: 700; }

.hero h1 {
  margin-top: 20px;
  font-size: clamp(43px, 6vw, 78px);
  line-height: 1.06;
  letter-spacing: -3px;
}
.hero h1 span { color: #38bdf8; }
.hero-copy > p { color: #8ea2b7; max-width: 620px; margin: 25px 0 30px; line-height: 1.8; }

.primary-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 17px;
  border: 0; border-radius: 12px; padding: 14px 22px;
  background: #38bdf8; color: #03111c; font-weight: 700;
}
.primary-btn:hover { transform: translateY(-1px); }
.primary-btn.full { width: 100%; }
.ghost-btn {
  margin-top: 12px; border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 13px; background: transparent; color: white;
}

.hero-card {
  width: 390px; padding: 30px; border-radius: 28px;
  background: #0d1c2d; border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 30px 80px rgba(0,0,0,.35);
}
.hero-card-head { display: flex; justify-content: space-between; align-items: center; }
.muted { color: #6e8499; font-size: 10px; letter-spacing: 1.4px; font-weight: 600; }
.hero-card h3 { margin-top: 5px; font-size: 16px; }
.hero-icon { font-size: 43px; }
.hero-temp { font-size: 78px; font-weight: 700; margin-top: 25px; line-height: 1; }
.hero-card > p { color: #91a4b8; margin-top: 7px; }
.three-stats {
  margin-top: 30px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.07);
  display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
}
.mini-stat { display: flex; flex-direction: column; gap: 3px; }
.mini-stat span { font-size: 18px; }
.mini-stat strong { font-size: 13px; }
.mini-stat small { color: #61778d; font-size: 9px; }

.section { padding: 80px 8%; }
.landing-section { background: #091623; }
.section h2 { margin-top: 8px; font-size: 35px; max-width: 680px; }
.feature-grid {
  margin-top: 40px; display: grid; grid-template-columns: repeat(3,1fr); gap: 18px;
}
.feature-card {
  padding: 27px; border-radius: 20px; background: #0d1d2d;
  border: 1px solid rgba(255,255,255,.07);
}
.feature-card > span { font-size: 30px; }
.feature-card h3 { margin-top: 17px; font-size: 17px; }
.feature-card p { color: #8094a9; font-size: 12px; line-height: 1.7; margin-top: 7px; }

footer {
  padding: 35px 8%; border-top: 1px solid rgba(255,255,255,.07);
  display: flex; justify-content: space-between; align-items: center;
  color: #61778d; font-size: 11px;
}

/* Auth */
.center-page {
  min-height: 100vh; display: grid; place-items: center; padding: 30px;
  position: relative; background: radial-gradient(circle, rgba(56,189,248,.08), transparent 35%), #06111e;
}
.back-link {
  position: absolute; left: 30px; top: 28px; border: 0; background: none; color: #8ea2b7;
}
.auth-card, .location-card {
  width: min(430px,100%); padding: 42px; text-align: center;
  border-radius: 25px; background: #0d1c2d; border: 1px solid rgba(255,255,255,.09);
}
.auth-logo, .location-big {
  width: 70px; height: 70px; margin: 0 auto 22px; display: grid; place-items: center;
  border-radius: 20px; background: #38bdf8; color: #06111e; font-size: 38px;
}
.location-big { background: rgba(56,189,248,.1); color: #38bdf8; }
.auth-card h1, .location-card h1 { font-size: 26px; }
.auth-card p, .location-card p { color: #8195a9; font-size: 13px; line-height: 1.7; margin: 10px 0 25px; }
.notice {
  margin: 15px 0; padding: 12px; border-radius: 11px;
  background: rgba(56,189,248,.08); color: #9bdfff; font-size: 11px;
}

/* Dashboard */
.dashboard-layout { display: flex; min-height: calc(100vh - 76px); }
.sidebar {
  width: 220px; padding: 25px 15px; border-right: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column; gap: 5px; flex-shrink: 0;
}
.side-item {
  width: 100%; padding: 11px 12px; display: flex; align-items: center; gap: 12px;
  border: 0; border-radius: 11px; color: #6e8499; background: transparent; text-align: left;
}
.side-item span { font-size: 17px; }
.side-item small { font-size: 11px; }
.side-item.active { color: #38bdf8; background: rgba(56,189,248,.09); }
.side-label { color: #4f667c; font-size: 9px; letter-spacing: 1.4px; margin: 22px 10px 6px; }
.side-bottom { margin-top: auto; }
.content { width: min(1100px, calc(100% - 30px)); margin: 0 auto; padding: 42px 0 100px; }
.mobile-title { display: none; }
.content-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 28px; }
.content-head h1 { margin-top: 4px; font-size: 34px; }
.content-head p { color: #6f8499; font-size: 12px; margin-top: 5px; }

/* Current */
.current-panel {
  padding: 32px; border-radius: 24px; display: flex; justify-content: space-between; gap: 30px;
  background: radial-gradient(circle at 20% 30%, rgba(56,189,248,.12), transparent 35%), #0d1c2d;
  border: 1px solid rgba(255,255,255,.08);
}
.current-left { display: flex; align-items: center; gap: 25px; }
.weather-emoji { font-size: 75px; }
.current-number { font-size: 75px; font-weight: 700; line-height: .9; }
.current-left h2 { margin-top: 10px; font-size: 18px; }
.current-left p { color: #71869b; font-size: 12px; margin-top: 4px; }
.current-metrics {
  min-width: 420px; display: grid; grid-template-columns: 1fr 1fr; gap: 13px;
  align-content: center;
}
.metric {
  display: flex; align-items: center; gap: 10px; padding: 13px;
  border-radius: 13px; background: rgba(255,255,255,.025);
}
.metric > span { font-size: 21px; }
.metric div { display: flex; flex-direction: column; }
.metric small { color: #61778d; font-size: 9px; }
.metric strong { font-size: 12px; margin-top: 2px; }

.panel-section { margin-top: 40px; }
.section-heading h2 { font-size: 20px; margin-top: 3px; }
.hour-row {
  display: flex; gap: 10px; overflow-x: auto; padding: 17px 2px 5px;
}
.hour-card {
  min-width: 88px; padding: 15px 9px; display: flex; flex-direction: column;
  align-items: center; gap: 8px; border-radius: 16px; background: #0d1c2d;
  border: 1px solid rgba(255,255,255,.07);
}
.hour-card.selected { border-color: rgba(56,189,248,.3); background: rgba(56,189,248,.1); }
.hour-card small { color: #71869b; font-size: 9px; }
.hour-card span { font-size: 25px; }
.hour-card strong { font-size: 15px; }
.hour-card em { color: #38bdf8; font-size: 8px; font-style: normal; }

.daily-list { margin-top: 15px; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,.07); }
.daily-row {
  min-height: 70px; padding: 10px 18px; display: grid; grid-template-columns: 1fr 70px 100px 80px;
  align-items: center; background: #0d1c2d; border-bottom: 1px solid rgba(255,255,255,.05);
}
.daily-row:last-child { border-bottom: 0; }
.daily-row > div:first-child { display: flex; flex-direction: column; }
.daily-row strong { font-size: 12px; }
.daily-row small { color: #657b90; font-size: 9px; margin-top: 3px; }
.daily-row > span { font-size: 25px; }
.rain-text { color: #38bdf8; font-size: 10px; }
.temps { display: flex; gap: 9px; justify-content: end; }
.temps span { color: #63798e; font-size: 12px; }
.temps strong { font-size: 12px; }

.quick-grid { margin-top: 35px; display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
.quick-card {
  padding: 17px; display: flex; align-items: center; gap: 10px; text-align: left;
  border: 1px solid rgba(255,255,255,.07); border-radius: 16px; background: #0d1c2d; color: white;
}
.quick-card > span { font-size: 24px; }
.quick-card div { flex: 1; display: flex; flex-direction: column; }
.quick-card strong { font-size: 11px; }
.quick-card small { color: #64798e; font-size: 8px; margin-top: 3px; }
.quick-card b { color: #38bdf8; }

/* General cards */
.info-grid { margin-top: 18px; display: grid; grid-template-columns: repeat(3,1fr); gap: 13px; }
.info-card {
  padding: 22px; display: flex; flex-direction: column; gap: 8px;
  border-radius: 17px; background: #0d1c2d; border: 1px solid rgba(255,255,255,.07);
}
.info-card > span { font-size: 24px; }
.info-card small { color: #6a8095; font-size: 9px; }
.info-card strong { color: #dff5ff; font-size: 16px; }

.forecast-large { display: grid; gap: 10px; }
.forecast-card {
  padding: 19px 22px; display: grid; grid-template-columns: 1fr 70px 120px 100px 70px;
  align-items: center; border-radius: 17px; background: #0d1c2d;
  border: 1px solid rgba(255,255,255,.07);
}
.forecast-card > div:first-child { display: flex; flex-direction: column; }
.forecast-card small { color: #687e93; font-size: 9px; margin-top: 3px; }
.forecast-card > span { font-size: 28px; }
.forecast-rain { color: #38bdf8; font-size: 10px; }
.forecast-temp { display: flex; gap: 10px; justify-content: end; }
.forecast-temp span { color: #657b90; font-size: 12px; }
.uv { color: #8195a9; font-size: 10px; text-align: right; }

.alert-main {
  padding: 30px; display: flex; gap: 20px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,.08); background: #0d1c2d;
}
.alert-main.safe { border-color: rgba(52,211,153,.2); }
.alert-main.warning { border-color: rgba(251,191,36,.25); background: rgba(251,191,36,.06); }
.alert-main.danger { border-color: rgba(248,113,113,.25); background: rgba(248,113,113,.06); }
.alert-symbol { font-size: 38px; }
.alert-main h2 { margin-top: 4px; font-size: 19px; }
.alert-main p { color: #8195a9; font-size: 11px; line-height: 1.7; margin-top: 7px; }

/* Smart modules */
.agri-hero, .beach-hero, .travel-hero {
  padding: 30px; border-radius: 22px; background: #0d1c2d;
  border: 1px solid rgba(255,255,255,.07); display: flex; align-items: center;
  justify-content: space-between; gap: 25px;
}
.large-module-icon { font-size: 45px; }
.agri-hero h2, .beach-hero h2 { margin-top: 8px; }
.agri-hero p, .beach-hero p { color: #8195a9; max-width: 650px; font-size: 11px; line-height: 1.7; margin-top: 6px; }
.agri-status { min-width: 160px; padding: 18px; border-radius: 15px; background: rgba(56,189,248,.08); }
.agri-status span { color: #6c8297; font-size: 9px; display: block; }
.agri-status strong { display: block; color: #38bdf8; font-size: 25px; margin-top: 5px; }
.recommendation {
  margin-top: 18px; padding: 22px; display: flex; gap: 15px; border-radius: 18px;
  background: #0d1c2d; border: 1px solid rgba(255,255,255,.07);
}
.recommendation > span { font-size: 28px; }
.recommendation h3 { font-size: 14px; margin-top: 5px; }
.recommendation p { color: #71869b; font-size: 10px; line-height: 1.6; margin-top: 6px; }
.beach-visual { font-size: 65px; }
.travel-toolbar { display: flex; gap: 10px; }
.travel-toolbar select {
  flex: 1; padding: 13px; border-radius: 11px; border: 1px solid rgba(255,255,255,.1);
  background: #0d1c2d; color: white;
}
.saved-row { display: flex; flex-wrap: wrap; gap: 7px; margin: 15px 0; }
.saved-chip {
  padding: 8px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.03); color: #9eb2c5; font-size: 10px;
}
.travel-hero { margin-top: 15px; }
.travel-hero > div { display: flex; align-items: center; gap: 18px; }
.travel-hero .weather-emoji { font-size: 50px; }
.travel-hero h2 { font-size: 23px; }
.travel-hero p { color: #74899e; font-size: 11px; }
.travel-hero > strong { font-size: 55px; }
.packing-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.packing-list span { padding: 7px 10px; border-radius: 9px; background: rgba(56,189,248,.07); color: #9edfff; font-size: 9px; }
.mini-source { margin-top: 20px; color: #5e7388; font-size: 9px; }

.date-selector { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; }
.date-btn {
  min-width: 75px; padding: 12px 9px; border-radius: 13px; border: 1px solid rgba(255,255,255,.08);
  background: #0d1c2d; color: white; display: flex; flex-direction: column; gap: 4px; align-items: center;
}
.date-btn small { color: #71869b; font-size: 9px; }
.date-btn strong { font-size: 18px; }
.date-btn.active { border-color: rgba(56,189,248,.35); background: rgba(56,189,248,.1); }
.comfort-card {
  margin-top: 18px; padding: 28px; display: flex; align-items: center; gap: 22px;
  border-radius: 20px; background: #0d1c2d; border: 1px solid rgba(255,255,255,.08);
}
.comfort-card.excellent { border-color: rgba(52,211,153,.25); }
.comfort-card.moderate { border-color: rgba(251,191,36,.25); }
.comfort-card.poor { border-color: rgba(248,113,113,.25); }
.comfort-score {
  width: 80px; height: 80px; display: grid; place-items: center; border-radius: 50%;
  background: rgba(56,189,248,.1); color: #38bdf8; font-size: 25px; font-weight: 700;
}
.comfort-card h2 { font-size: 21px; margin-top: 4px; }
.comfort-card p { color: #71869b; font-size: 11px; margin-top: 5px; }

/* Map */
.map-wrap { height: 520px; overflow: hidden; border-radius: 20px; border: 1px solid rgba(255,255,255,.08); }
.map-wrap iframe { width: 100%; height: 100%; border: 0; display: block; }
.map-info {
  margin-top: 12px; padding: 17px; display: flex; gap: 10px; align-items: center;
  border-radius: 15px; background: #0d1c2d; color: #9bb0c4; font-size: 11px;
}
.map-info span { color: #61778d; }

/* Profile */
.profile-card {
  padding: 25px; display: flex; align-items: center; gap: 16px; border-radius: 20px;
  background: #0d1c2d; border: 1px solid rgba(255,255,255,.07);
}
.avatar {
  width: 58px; height: 58px; display: grid; place-items: center; border-radius: 50%;
  background: #38bdf8; color: #04111d; font-weight: 700; font-size: 21px;
}
.profile-card h2 { font-size: 17px; }
.profile-card p { color: #667c91; font-size: 10px; margin-top: 2px; }
.settings { margin-top: 15px; border: 1px solid rgba(255,255,255,.07); border-radius: 18px; overflow: hidden; }
.settings button {
  width: 100%; padding: 18px; display: flex; align-items: center; gap: 14px; text-align: left;
  border: 0; border-bottom: 1px solid rgba(255,255,255,.06); background: #0d1c2d; color: white;
}
.settings button:last-child { border-bottom: 0; }
.settings button > span { font-size: 22px; }
.settings button div { flex: 1; display: flex; flex-direction: column; }
.settings strong { font-size: 12px; }
.settings small { color: #687e93; font-size: 9px; margin-top: 3px; }
.settings b { color: #687e93; font-size: 20px; }

/* Loading */
.loading {
  min-height: 350px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; text-align: center; border-radius: 20px; background: #0d1c2d; border: 1px solid rgba(255,255,255,.07);
}
.loading p { color: #71869b; font-size: 11px; }
.spinner {
  width: 43px; height: 43px; border: 4px solid rgba(255,255,255,.1);
  border-top-color: #38bdf8; border-radius: 50%; animation: spin .9s linear infinite;
}
.error-icon { font-size: 42px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Mobile */
.mobile-nav { display: none; }

@media (max-width: 1000px) {
  .sidebar { width: 175px; }
  .current-panel { flex-direction: column; }
  .current-metrics { min-width: 0; width: 100%; }
  .quick-grid { grid-template-columns: repeat(2,1fr); }
  .feature-grid { grid-template-columns: repeat(2,1fr); }
}

@media (max-width: 700px) {
  .topbar { height: 68px; padding: 0 4%; }
  .topbar .logo { font-size: 18px; }
  .location-chip { font-size: 9px; padding: 8px 10px; }
  .sidebar { display: none; }
  .content { width: 92%; padding: 30px 0 105px; }
  .mobile-title { display: block; margin-bottom: 25px; }
  .mobile-title h1 { font-size: 29px; margin-top: 4px; }
  .content-head { align-items: start; }
  .content-head h1 { font-size: 29px; }
  .content-head .small-btn { display: none; }
  .current-panel { padding: 23px; }
  .current-left { gap: 12px; }
  .weather-emoji { font-size: 52px; }
  .current-number { font-size: 55px; }
  .current-metrics { grid-template-columns: 1fr 1fr; }
  .daily-row { grid-template-columns: 1fr 45px 55px 65px; padding: 10px; }
  .quick-grid { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
  .forecast-card { grid-template-columns: 1fr 50px; gap: 9px; }
  .forecast-rain { grid-column: 1; }
  .forecast-temp { grid-column: 2; grid-row: 1 / span 2; }
  .uv { display: none; }
  .travel-toolbar { flex-direction: column; }
  .travel-hero { padding: 20px; }
  .travel-hero > strong { font-size: 42px; }
  .agri-hero, .beach-hero { flex-direction: column; align-items: start; }
  .agri-status { width: 100%; }
  .map-wrap { height: 390px; }
  .comfort-card { padding: 20px; }
  .comfort-score { width: 65px; height: 65px; flex-shrink: 0; }
  .feature-grid { grid-template-columns: 1fr; }
  .hero { padding: 55px 6%; flex-direction: column; text-align: center; }
  .hero h1 { font-size: 44px; }
  .hero-card { width: min(390px,100%); text-align: left; }
  .section { padding: 65px 6%; }
  .section h2 { font-size: 28px; }
  footer { padding: 30px 6%; flex-direction: column; gap: 12px; }
  .mobile-nav {
    position: fixed; z-index: 50; left: 50%; bottom: 10px; transform: translateX(-50%);
    width: 94%; display: grid; grid-template-columns: repeat(5,1fr); gap: 3px;
    padding: 7px; border: 1px solid rgba(255,255,255,.1); border-radius: 17px;
    background: rgba(6,17,30,.95); backdrop-filter: blur(15px);
    box-shadow: 0 15px 50px rgba(0,0,0,.4);
  }
  .mobile-nav button {
    border: 0; background: transparent; color: #647a90; border-radius: 11px;
    padding: 7px 3px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  }
  .mobile-nav button span { font-size: 17px; }
  .mobile-nav button small { font-size: 8px; }
  .mobile-nav button.active { color: #38bdf8; background: rgba(56,189,248,.08); }
}

@media (max-width: 450px) {
  .hero h1 { font-size: 38px; letter-spacing: -1.5px; }
  .hero-card { padding: 22px; }
  .current-metrics { grid-template-columns: 1fr; }
  .daily-row { grid-template-columns: 1fr 38px 48px 58px; }
  .daily-row > span { font-size: 21px; }
  .rain-text { font-size: 8px; }
  .temps { gap: 5px; }
}

/* =========================
   PREMIUM DARK UI OVERRIDES
========================= */
:root {
  --bg: #040914;
  --bg2: #07111f;
  --panel: rgba(12, 24, 40, .78);
  --panel-solid: #0b1829;
  --panel-light: #102238;
  --line: rgba(148, 191, 221, .11);
  --text: #f4f9ff;
  --muted: #8195aa;
  --cyan: #35c7ff;
  --cyan-soft: #8ee4ff;
  --violet: #8b7cff;
  --green: #43e0ae;
}

html { scroll-behavior: smooth; }
body {
  background:
    radial-gradient(circle at 8% 0%, rgba(53,199,255,.09), transparent 28%),
    radial-gradient(circle at 92% 12%, rgba(139,124,255,.08), transparent 25%),
    var(--bg);
}

.app, .dashboard, .center-page {
  background:
    radial-gradient(circle at 15% 5%, rgba(53,199,255,.07), transparent 25%),
    radial-gradient(circle at 85% 18%, rgba(139,124,255,.07), transparent 25%),
    linear-gradient(180deg, #040914 0%, #07111f 100%);
}

.topbar {
  height: 82px;
  padding: 0 6%;
  background: rgba(4,9,20,.72);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(22px);
  position: sticky;
  top: 0;
  z-index: 40;
}

.logo { letter-spacing: -.4px; }
.logo-box {
  background: linear-gradient(135deg, #55d5ff, #31aef2);
  box-shadow: 0 0 28px rgba(53,199,255,.22), inset 0 1px 0 rgba(255,255,255,.35);
}

.outline-btn, .small-btn, .location-chip {
  transition: .22s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
}
.outline-btn:hover, .small-btn:hover, .location-chip:hover {
  border-color: rgba(53,199,255,.35);
  background: rgba(53,199,255,.08);
  transform: translateY(-1px);
}

.primary-btn {
  background: linear-gradient(135deg, #55d5ff, #24a9ee);
  box-shadow: 0 10px 30px rgba(36,169,238,.18), inset 0 1px 0 rgba(255,255,255,.38);
  transition: .22s ease;
}
.primary-btn:hover {
  box-shadow: 0 14px 36px rgba(36,169,238,.28), inset 0 1px 0 rgba(255,255,255,.4);
}

.hero {
  min-height: 720px;
  padding: 95px 8%;
  position: relative;
  overflow: hidden;
}
.hero::before, .hero::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(2px);
}
.hero::before {
  width: 420px; height: 420px; right: -110px; top: 90px;
  background: radial-gradient(circle, rgba(53,199,255,.13), transparent 68%);
}
.hero::after {
  width: 300px; height: 300px; left: -100px; bottom: -90px;
  background: radial-gradient(circle, rgba(139,124,255,.11), transparent 68%);
}
.hero-copy, .hero-card { position: relative; z-index: 1; }
.hero h1 {
  text-shadow: 0 0 55px rgba(53,199,255,.07);
}
.hero h1 span {
  background: linear-gradient(90deg, #69dcff, #8ea6ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-card, .current-panel, .feature-card, .info-card, .forecast-card,
.daily-list, .quick-card, .alert-main, .agri-hero, .beach-hero,
.travel-hero, .recommendation, .profile-card, .settings, .map-wrap,
.map-info, .comfort-card, .loading, .auth-card, .location-card {
  box-shadow: 0 20px 70px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.025);
}

.hero-card {
  background: linear-gradient(145deg, rgba(18,37,60,.92), rgba(8,19,33,.92));
  border-color: rgba(124,205,238,.13);
  transform: perspective(900px) rotateY(-2deg);
  transition: transform .35s ease, box-shadow .35s ease;
}
.hero-card:hover {
  transform: perspective(900px) rotateY(0deg) translateY(-4px);
  box-shadow: 0 30px 90px rgba(0,0,0,.32), 0 0 50px rgba(53,199,255,.06);
}

.section { background: rgba(6,15,27,.72); }
.landing-section { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.feature-card, .info-card, .forecast-card, .quick-card {
  background: linear-gradient(145deg, rgba(15,31,50,.86), rgba(8,19,33,.86));
  border-color: var(--line);
  transition: .22s ease;
}
.feature-card:hover, .info-card:hover, .quick-card:hover, .forecast-card:hover {
  transform: translateY(-3px);
  border-color: rgba(53,199,255,.2);
  box-shadow: 0 18px 45px rgba(0,0,0,.22);
}
.feature-card > span { filter: drop-shadow(0 6px 14px rgba(53,199,255,.16)); }

.dashboard-layout { background: transparent; }
.sidebar {
  background: rgba(5,12,23,.55);
  border-right-color: var(--line);
  backdrop-filter: blur(18px);
}
.side-item { transition: .18s ease; }
.side-item:hover { color: #c4d6e6; background: rgba(255,255,255,.035); }
.side-item.active {
  color: #75ddff;
  background: linear-gradient(90deg, rgba(53,199,255,.12), rgba(53,199,255,.025));
  box-shadow: inset 3px 0 0 #35c7ff;
}

.content { padding-top: 48px; }
.content-head h1, .mobile-title h1 { letter-spacing: -.8px; }
.current-panel {
  background:
    radial-gradient(circle at 15% 25%, rgba(53,199,255,.12), transparent 28%),
    radial-gradient(circle at 85% 80%, rgba(139,124,255,.08), transparent 30%),
    linear-gradient(145deg, rgba(16,34,55,.9), rgba(7,17,30,.9));
  border-color: rgba(120,197,231,.13);
}
.current-number { letter-spacing: -4px; }
.weather-emoji { filter: drop-shadow(0 12px 24px rgba(53,199,255,.12)); }

.hour-card {
  background: rgba(12,27,44,.82);
  border-color: var(--line);
  transition: .2s ease;
}
.hour-card:hover { transform: translateY(-3px); border-color: rgba(53,199,255,.2); }
.hour-card.selected {
  background: linear-gradient(180deg, rgba(53,199,255,.15), rgba(53,199,255,.05));
  border-color: rgba(53,199,255,.35);
  box-shadow: 0 10px 30px rgba(53,199,255,.08);
}

.daily-row { transition: .18s ease; }
.daily-row:hover { background: #102238; }
.daily-list { background: #0d1c2d; }

.bottom-nav { display: none; }

.alert-main.safe { box-shadow: 0 18px 55px rgba(67,224,174,.04); }
.alert-main.warning { box-shadow: 0 18px 55px rgba(251,191,36,.05); }
.alert-main.danger { box-shadow: 0 18px 55px rgba(248,113,113,.06); }

.agri-hero, .beach-hero, .travel-hero {
  background: linear-gradient(145deg, rgba(15,32,52,.9), rgba(8,19,33,.9));
}
.large-module-icon, .beach-visual { filter: drop-shadow(0 12px 25px rgba(53,199,255,.12)); }
.agri-status { border: 1px solid rgba(53,199,255,.14); box-shadow: inset 0 1px 0 rgba(255,255,255,.03); }

.recommendation { background: linear-gradient(145deg, rgba(14,31,49,.9), rgba(8,19,33,.9)); }
.recommendation > span { filter: drop-shadow(0 8px 15px rgba(53,199,255,.1)); }

.travel-toolbar select {
  background: #0b1a2c;
  border-color: var(--line);
  outline: none;
}
.travel-toolbar select:focus { border-color: rgba(53,199,255,.4); box-shadow: 0 0 0 3px rgba(53,199,255,.07); }
.saved-chip { transition: .18s ease; }
.saved-chip:hover { color: white; border-color: rgba(53,199,255,.28); background: rgba(53,199,255,.07); }

.date-btn { transition: .18s ease; }
.date-btn:hover { border-color: rgba(53,199,255,.25); transform: translateY(-2px); }
.date-btn.active { box-shadow: 0 10px 30px rgba(53,199,255,.08); }
.comfort-score { box-shadow: 0 0 35px rgba(53,199,255,.08); }

.map-wrap { background: #081421; }
.map-info { background: linear-gradient(145deg, #0e2033, #091726); }

.settings button { transition: .18s ease; }
.settings button:hover { background: #102238; padding-left: 22px; }

.loading {
  background: linear-gradient(145deg, rgba(15,31,50,.88), rgba(8,19,33,.88));
}
.spinner { box-shadow: 0 0 30px rgba(53,199,255,.14); }

.auth-card, .location-card {
  background: linear-gradient(145deg, rgba(15,31,50,.94), rgba(7,17,30,.94));
  box-shadow: 0 35px 100px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.035);
}
.auth-logo {
  box-shadow: 0 15px 35px rgba(53,199,255,.18), inset 0 1px 0 rgba(255,255,255,.35);
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #050c16; }
::-webkit-scrollbar-thumb { background: #1b354e; border-radius: 20px; }
::-webkit-scrollbar-thumb:hover { background: #275271; }

@media (max-width: 700px) {
  .topbar { height: 70px; }
  .hero { min-height: auto; padding-top: 65px; padding-bottom: 70px; }
  .hero-card { transform: none; }
  .hero-card:hover { transform: translateY(-3px); }
  .content { padding-top: 30px; }
  .mobile-nav {
    display: grid;
    background: rgba(4,10,19,.94);
    border-color: rgba(139,190,220,.13);
    box-shadow: 0 20px 55px rgba(0,0,0,.48), 0 0 30px rgba(53,199,255,.04);
  }
}


/* CITY SEARCH */
.header-actions{display:flex;align-items:center;gap:10px}
.search-trigger{display:flex;align-items:center;gap:9px;min-width:210px;height:42px;padding:0 11px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(15,23,42,.68);color:#94a3b8;cursor:pointer;transition:.2s}
.search-trigger:hover{border-color:rgba(34,211,238,.4);color:#e2e8f0;background:rgba(15,23,42,.9)}
.search-trigger>span:first-child{font-size:21px;line-height:1;color:#67e8f9}.search-trigger-text{flex:1;text-align:left;font-size:12px;font-weight:600}.search-trigger kbd,.search-input-wrap kbd{font-size:10px;padding:3px 6px;border:1px solid rgba(148,163,184,.18);border-radius:6px;color:#64748b;background:rgba(255,255,255,.04)}
.search-overlay{position:fixed;inset:0;z-index:1000;background:rgba(2,6,23,.72);backdrop-filter:blur(10px);display:flex;justify-content:center;align-items:flex-start;padding:9vh 20px 30px}
.search-modal{width:min(650px,100%);background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(9,16,31,.98));border:1px solid rgba(103,232,249,.18);border-radius:22px;box-shadow:0 30px 100px rgba(0,0,0,.6),0 0 60px rgba(34,211,238,.07);overflow:hidden}
.search-modal-head{display:flex;align-items:center;justify-content:space-between;padding:22px 22px 15px}.search-modal-head h2{margin:4px 0 0;font-size:22px;color:#f8fafc}.eyebrow{font-size:9px;letter-spacing:.18em;color:#67e8f9;font-weight:800}.icon-btn{width:34px;height:34px;border-radius:10px;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.04);color:#94a3b8;font-size:22px;cursor:pointer}.icon-btn:hover{color:#fff;border-color:rgba(103,232,249,.3)}
.search-input-wrap{display:flex;align-items:center;gap:11px;margin:0 20px 12px;padding:0 13px;height:56px;border-radius:14px;border:1px solid rgba(103,232,249,.22);background:rgba(2,6,23,.72);box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}.search-input-wrap>span{font-size:24px;color:#67e8f9}.search-input-wrap input{flex:1;border:0;outline:0;background:transparent;color:#f8fafc;font:600 15px Poppins,sans-serif}.search-input-wrap input::placeholder{color:#64748b}.search-status{padding:14px 22px;color:#64748b;font-size:12px}.search-results{padding:0 10px 10px;max-height:390px;overflow:auto}.search-result,.current-location-result{width:100%;display:flex;align-items:center;gap:13px;padding:13px 12px;border:1px solid transparent;border-radius:13px;background:transparent;color:#e2e8f0;text-align:left;cursor:pointer}.search-result:hover,.current-location-result:hover{background:rgba(34,211,238,.07);border-color:rgba(103,232,249,.12)}.result-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:rgba(34,211,238,.09)}.result-copy{display:flex;flex-direction:column;gap:2px;flex:1}.result-copy strong,.current-location-result strong{font-size:13px}.result-copy small,.current-location-result small{font-size:10px;color:#64748b}.result-arrow{color:#475569;font-size:18px}.current-location-result{margin:0 10px 12px;width:calc(100% - 20px);border-color:rgba(148,163,184,.12);background:rgba(255,255,255,.025)}.current-location-result>span:first-child{font-size:20px}.current-location-result>span:nth-child(2){display:flex;flex-direction:column;gap:2px}
@media(max-width:760px){.search-trigger{min-width:42px;width:42px;justify-content:center;padding:0}.search-trigger-text,.search-trigger kbd{display:none}.header-actions{gap:7px}.location-chip{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.search-overlay{padding:18px 12px}.search-modal-head{padding:18px 17px 12px}.search-input-wrap{margin:0 14px 10px}.search-results{padding:0 6px 8px}}

`;

export default function Root() {
  return (
    <>
      <style>{styles}
</style>
      <App />
    </>
  );
}
