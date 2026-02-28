const cityMap = {
  東京: { name: "東京", latitude: 35.6762, longitude: 139.6503 },
  tokyo: { name: "東京", latitude: 35.6762, longitude: 139.6503 },
  大阪: { name: "大阪", latitude: 34.6937, longitude: 135.5023 },
  osaka: { name: "大阪", latitude: 34.6937, longitude: 135.5023 },
  京都: { name: "京都", latitude: 35.0116, longitude: 135.7681 },
  kyoto: { name: "京都", latitude: 35.0116, longitude: 135.7681 },
};

const weatherCodeMap = {
  0: ["快晴", "☀️"],
  1: ["晴れ", "🌤️"],
  2: ["一部くもり", "⛅"],
  3: ["くもり", "☁️"],
  45: ["霧", "🌫️"],
  48: ["着氷性の霧", "🌫️"],
  51: ["弱い霧雨", "🌦️"],
  53: ["霧雨", "🌦️"],
  55: ["強い霧雨", "🌧️"],
  56: ["弱い凍雨", "🌨️"],
  57: ["強い凍雨", "🌨️"],
  61: ["弱い雨", "🌦️"],
  63: ["雨", "🌧️"],
  65: ["強い雨", "🌧️"],
  66: ["弱い凍雨", "🌨️"],
  67: ["強い凍雨", "🌨️"],
  71: ["弱い雪", "🌨️"],
  73: ["雪", "❄️"],
  75: ["強い雪", "❄️"],
  77: ["雪の粒", "🌨️"],
  80: ["弱いにわか雨", "🌦️"],
  81: ["にわか雨", "🌧️"],
  82: ["激しいにわか雨", "⛈️"],
  85: ["弱いにわか雪", "🌨️"],
  86: ["強いにわか雪", "❄️"],
  95: ["雷雨", "⛈️"],
  96: ["雷雨・ひょう", "⛈️"],
  99: ["激しい雷雨・ひょう", "⛈️"],
};

const STORAGE_KEY = "weather-recent-cities";

const refs = {
  themeToggle: document.getElementById("themeToggle"),
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  statusArea: document.getElementById("statusArea"),
  weatherArea: document.getElementById("weatherArea"),
  currentWeather: document.getElementById("currentWeather"),
  todayForecast: document.getElementById("todayForecast"),
  tomorrowForecast: document.getElementById("tomorrowForecast"),
  hourlyForecast: document.getElementById("hourlyForecast"),
  recentList: document.getElementById("recentList"),
};

function normalizeCity(input) {
  if (!input) return "";
  return input.trim().toLowerCase();
}

function resolveCity(input) {
  const key = normalizeCity(input);
  return cityMap[key] || null;
}

function getWeatherLabelAndIcon(code) {
  return weatherCodeMap[code] || ["不明", "❔"];
}

function setStatus(message, type = "") {
  refs.statusArea.textContent = message;
  refs.statusArea.className = `status ${type}`.trim();
}

function formatTime(isoString) {
  try {
    return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatDate(isoString) {
  try {
    return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function loadRecentCities() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveRecentCity(cityName) {
  const current = loadRecentCities().filter((c) => c !== cityName);
  current.unshift(cityName);
  const latest = current.slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(latest));
  renderRecentCities();
}

function renderRecentCities() {
  const cities = loadRecentCities();
  refs.recentList.innerHTML = "";
  if (!cities.length) {
    refs.recentList.innerHTML = '<span class="meta">まだ履歴がありません</span>';
    return;
  }

  cities.forEach((city) => {
    const btn = document.createElement("button");
    btn.className = "recent-btn";
    btn.textContent = city;
    btn.addEventListener("click", () => fetchWeatherByCity(city));
    refs.recentList.appendChild(btn);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  refs.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initializeTheme() {
  const stored = localStorage.getItem("weather-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  applyTheme(initial);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("weather-theme", next);
  applyTheme(next);
}

async function fetchWeatherByCity(inputCity) {
  const city = resolveCity(inputCity);
  if (!city) {
    refs.weatherArea.classList.add("hidden");
    setStatus("対応していない都市です。東京・大阪・京都（英語表記可）で試してください。", "error");
    return;
  }

  setStatus(`${city.name} の天気を取得中...`, "loading");
  refs.weatherArea.classList.add("hidden");

  try {
    const params = new URLSearchParams({
      latitude: city.latitude,
      longitude: city.longitude,
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation",
      hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
      timezone: "Asia/Tokyo",
      forecast_days: "2",
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) throw new Error(`APIエラー: ${res.status}`);

    const data = await res.json();
    validateWeatherData(data);
    renderWeather(city.name, data);
    saveRecentCity(city.name);
    setStatus(`${city.name} の天気を表示しています。`, "success");
  } catch (error) {
    console.error(error);
    refs.weatherArea.classList.add("hidden");
    setStatus("天気情報の取得に失敗しました。ネットワークまたは時間をおいて再試行してください。", "error");
  }
}

function validateWeatherData(data) {
  if (!data || !data.current || !data.daily || !data.hourly) {
    throw new Error("天気データが不完全です");
  }
}

function renderWeather(cityName, data) {
  const { current, daily, hourly } = data;
  const [currentLabel, currentIcon] = getWeatherLabelAndIcon(current.weather_code);

  refs.currentWeather.innerHTML = `
    <h2>現在の天気（${cityName}）</h2>
    <div class="current-main">
      <div class="weather-icon">${currentIcon}</div>
      <div>
        <div class="temp">${Math.round(current.temperature_2m)}°C</div>
        <div>${currentLabel}</div>
        <div class="meta">
          <span>体感温度: ${Math.round(current.apparent_temperature)}°C</span>
          <span>風速: ${Math.round(current.wind_speed_10m)} km/h</span>
          <span>降水量: ${current.precipitation ?? 0} mm</span>
        </div>
      </div>
    </div>
  `;

  refs.todayForecast.innerHTML = renderDailyCard("今日", daily, 0);
  refs.tomorrowForecast.innerHTML = renderDailyCard("明日", daily, 1);
  refs.hourlyForecast.innerHTML = renderHourlyCard(hourly);

  refs.weatherArea.classList.remove("hidden");
}

function renderDailyCard(title, daily, index) {
  const [label, icon] = getWeatherLabelAndIcon(daily.weather_code[index]);
  return `
    <h3>${title} (${formatDate(daily.time[index])})</h3>
    <div class="day-list">
      <span>${icon} ${label}</span>
      <span>最高 / 最低: ${Math.round(daily.temperature_2m_max[index])}°C / ${Math.round(daily.temperature_2m_min[index])}°C</span>
      <span>降水量: ${daily.precipitation_sum[index]} mm</span>
      <span>最大風速: ${Math.round(daily.wind_speed_10m_max[index])} km/h</span>
    </div>
  `;
}

function renderHourlyCard(hourly) {
  const now = Date.now();
  const indexes = [];

  for (let i = 0; i < hourly.time.length; i += 1) {
    const ts = new Date(hourly.time[i]).getTime();
    if (ts >= now) indexes.push(i);
    if (indexes.length >= 12) break;
  }

  if (!indexes.length) {
    return `<h3>12時間予報</h3><p class="meta">時間別データがありません。</p>`;
  }

  const items = indexes
    .map((i) => {
      const [label, icon] = getWeatherLabelAndIcon(hourly.weather_code[i]);
      return `
        <div class="hour-item">
          <strong>${formatTime(hourly.time[i])}</strong><br>
          ${icon} ${label}<br>
          気温: ${Math.round(hourly.temperature_2m[i])}°C<br>
          体感: ${Math.round(hourly.apparent_temperature[i])}°C<br>
          降水確率: ${hourly.precipitation_probability[i] ?? "-"}%<br>
          風速: ${Math.round(hourly.wind_speed_10m[i])} km/h
        </div>
      `;
    })
    .join("");

  return `<h3>12時間予報</h3><div class="hour-list">${items}</div>`;
}

refs.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  fetchWeatherByCity(refs.cityInput.value);
});

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => fetchWeatherByCity(btn.dataset.city));
});

refs.themeToggle.addEventListener("click", toggleTheme);

initializeTheme();
renderRecentCities();
fetchWeatherByCity("東京");
