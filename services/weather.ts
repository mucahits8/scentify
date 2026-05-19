import * as Location from "expo-location";

import { mockWeather } from "@/services/mock-data";
import type { WeatherSnapshot } from "@/utils/types";

export async function requestWeatherPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  return mockWeather;
}
