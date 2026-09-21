// Varje stad har ett namn, en latitud och en longitud. Inget extra API behövs.
const cities = {
  stockholm: { name: "Stockholm", latitude: 59.3293, longitude: 18.0686 },
  goteborg: { name: "Göteborg", latitude: 57.7089, longitude: 11.9746 },
  malmo: { name: "Malmö", latitude: 55.6050, longitude: 13.0038 },
  umea: { name: "Umeå", latitude: 63.8258, longitude: 20.2630 },
};

// Open-Meteos WMO-koder översätts till svenska. Vädret bestäms av API-svaret.
const weatherDescriptions = {
  0: "Klart", 1: "Mestadels klart", 2: "Delvis molnigt", 3: "Mulet",
  45: "Dimma", 48: "Dimma med rimfrost",
  51: "Lätt duggregn", 53: "Måttligt duggregn", 55: "Kraftigt duggregn",
  56: "Lätt underkylt duggregn", 57: "Kraftigt underkylt duggregn",
  61: "Lätt regn", 63: "Måttligt regn", 65: "Kraftigt regn",
  66: "Lätt underkylt regn", 67: "Kraftigt underkylt regn",
  71: "Lätt snöfall", 73: "Måttligt snöfall", 75: "Kraftigt snöfall", 77: "Snökorn",
  80: "Lätta regnskurar", 81: "Måttliga regnskurar", 82: "Kraftiga regnskurar",
  85: "Lätta snöbyar", 86: "Kraftiga snöbyar",
  95: "Åska", 96: "Åska med lätt hagel", 99: "Åska med kraftigt hagel",
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
  button.textContent = "Hämtar…";
  statusText.textContent = "Hämtar väderdata…";
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
    if (!response.ok) throw new Error("API-anropet misslyckades");

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
      throw new Error("API-svaret saknar väderdata");
    }

    // textContent skriver API-värdena som text i de tomma HTML-elementen.
    document.getElementById("weather-city").textContent = city.name;
    document.getElementById("weather-temperature").textContent =
      `${current.temperature_2m.toLocaleString("sv-SE")} ${units.temperature_2m}`;
    document.getElementById("weather-wind").textContent =
      `${current.wind_speed_10m.toLocaleString("sv-SE")} ${units.wind_speed_10m}`;
    document.getElementById("weather-description").textContent =
      weatherDescriptions[current.weather_code] ?? `Väderkod ${current.weather_code}`;
    result.hidden = false;
    statusText.textContent = `Vädret för ${city.name} har hämtats.`;
  } catch (error) {
    statusText.textContent = "Det gick inte att hämta väderdata. Försök igen.";
  } finally {
    // Körs både vid lyckat anrop och vid fel.
    clearTimeout(timeout);
    button.disabled = false;
    citySelect.disabled = false;
    button.textContent = "Hämta väder";
  }
});
