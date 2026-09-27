// Varje stad har ett namn, en latitud och en longitud. Inget extra API behövs.
const cities = {
  stockholm: { name: "Stockholm", latitude: 59.3293, longitude: 18.0686 },
  goteborg: { name: "Göteborg", latitude: 57.7089, longitude: 11.9746 },
  malmo: { name: "Malmö", latitude: 55.6050, longitude: 13.0038 },
  umea: { name: "Umeå", latitude: 63.8258, longitude: 20.2630 },
};

// Open-Meteos WMO-koder översätts till svenska. Vädret bestäms av API-svaret.
const weatherDescriptions = {
  0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Heavy drizzle",
  56: "Light freezing drizzle", 57: "Heavy freezing drizzle",
  61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Light freezing rain", 67: "Heavy freezing rain",
  71: "Light snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall", 77: "Snow grains",
  80: "Light rain showers", 81: "Moderate rain showers", 82: "Heavy rain showers",
  85: "Light snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with light hail", 99: "Thunderstorm with heavy hail",
};

const form = document.getElementById("weather-form");
const citySelect = document.getElementById("city");
const button = document.getElementById("weather-button");
const statusText = document.getElementById("weather-status");
const result = document.getElementById("weather-result");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Stoppar formuläret från att ladda om sidan.
  if (button.disabled) return;
  const city = cities[citySelect.value];
  if (!city) return;

  button.disabled = true;
  citySelect.disabled = true;
  button.textContent = "Loading…";
  statusText.textContent = "Fetching weather data…";
  result.hidden = true; // Visa inte tidigare väder medan ett nytt anrop pågår.

  // Avbryt efter 15 sekunder så att användaren kan försöka igen vid nätverksproblem.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", city.latitude);
    url.searchParams.set("longitude", city.longitude);
    url.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");
    url.searchParams.set("wind_speed_unit", "ms");

    // Här skickas det riktiga HTTPS-anropet till Open-Meteo.
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("API request failed");

    // Gör JSON-svaret till ett JavaScript-objekt och läs aktuell data och enheter.
    const data = await response.json();
    const current = data.current;
    const units = data.current_units;
    if (!current || !units ||
        !Number.isFinite(current.temperature_2m) ||
        !Number.isFinite(current.wind_speed_10m) ||
        !Number.isInteger(current.weather_code) ||
        typeof units.temperature_2m !== "string" ||
        typeof units.wind_speed_10m !== "string") {
      throw new Error("Weather data is missing from the API response");
    }

    // textContent skriver API-värdena som text i de tomma HTML-elementen.
    document.getElementById("weather-city").textContent = city.name;
    document.getElementById("weather-temperature").textContent =
      `${current.temperature_2m.toLocaleString("en-GB")} ${units.temperature_2m}`;
    document.getElementById("weather-wind").textContent =
      `${current.wind_speed_10m.toLocaleString("en-GB")} ${units.wind_speed_10m}`;
    document.getElementById("weather-description").textContent =
      weatherDescriptions[current.weather_code] ?? `Weather code ${current.weather_code}`;
    result.hidden = false;
    statusText.textContent = `Weather for ${city.name} loaded.`;
  } catch (error) {
    statusText.textContent = "Could not fetch weather data. Please try again.";
  } finally {
    // Körs både vid lyckat anrop och vid fel.
    clearTimeout(timeout);
    button.disabled = false;
    citySelect.disabled = false;
    button.textContent = "Get weather";
  }
});
