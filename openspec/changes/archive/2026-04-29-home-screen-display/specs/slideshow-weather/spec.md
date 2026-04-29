## ADDED Requirements

### Requirement: Weather config
The `config.json` file SHALL support a `weather` object with fields: `provider` (`"open-meteo"` | `"openweathermap"`, default `"open-meteo"`), `apiKey` (string, required only for `openweathermap`), `latitude` (number), `longitude` (number), `locationName` (string), and `units` (`"metric"` | `"imperial"`, default `"metric"`).

#### Scenario: Open-Meteo config (no key)
- **WHEN** `config.json` specifies `provider: "open-meteo"` with latitude and longitude
- **THEN** the build succeeds and weather is fetched at runtime without an API key

#### Scenario: OpenWeatherMap config
- **WHEN** `config.json` specifies `provider: "openweathermap"` with a valid `apiKey`
- **THEN** weather is fetched from the OpenWeatherMap API at runtime using the provided key

#### Scenario: Missing required apiKey for OpenWeatherMap
- **WHEN** `config.json` specifies `provider: "openweathermap"` without `apiKey`
- **THEN** the build emits a warning and the weather panel displays an error message at runtime

### Requirement: Weather panel layout
In `slideshow-weather` mode the slideshow SHALL occupy the left portion of the screen and a weather panel SHALL occupy the right side. The weather panel SHALL be approximately 30% of the viewport width.

#### Scenario: Mode active
- **WHEN** the display is in `slideshow-weather` mode
- **THEN** the slideshow renders in the left 70% and the weather panel renders in the right 30% of the viewport

### Requirement: Current weather display
The weather panel SHALL display the location name, current temperature (with unit), weather condition description, and a weather condition icon at the top of the panel.

#### Scenario: Weather data loaded
- **WHEN** weather data has been successfully fetched
- **THEN** the panel shows location name, temperature, condition text, and icon

#### Scenario: Weather data unavailable
- **WHEN** the weather API request fails or returns an error
- **THEN** the panel shows the location name and an error/offline indicator instead of weather data

### Requirement: Hourly forecast
Below the current conditions the weather panel SHALL display an hourly forecast for the next 12 hours, listed vertically. Each hour entry SHALL show the time, temperature, and a small condition icon.

#### Scenario: Hourly forecast rendered
- **WHEN** weather data includes hourly forecast data
- **THEN** 12 entries are shown vertically, each with time, temperature, and icon

### Requirement: Multi-day forecast row
Below the hourly forecast the weather panel SHALL display a horizontal row of daily forecasts for the next 5 days. Each day entry SHALL show the day name (e.g., "Mon"), high temperature, low temperature, and a condition icon.

#### Scenario: Daily forecast rendered
- **WHEN** weather data includes daily forecast data
- **THEN** 5 day entries are shown in a horizontal row at the bottom of the panel

### Requirement: Weather refresh
The weather data SHALL be refreshed every 15 minutes. The last successful response SHALL be cached in `localStorage` and used as a fallback if a subsequent fetch fails.

#### Scenario: Successful refresh
- **WHEN** 15 minutes have elapsed since the last fetch
- **THEN** new weather data is fetched and the panel updates

#### Scenario: Failed refresh with cached data
- **WHEN** a weather fetch fails and a cached response exists in localStorage
- **THEN** the panel continues to display the cached data without showing an error
