import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, type ColorSchemeName } from "react-native";

export type BridgeXThemePreference = "system" | "light" | "dark";

const THEME_KEY = "bridgex:theme-preference";

export type BridgeXPalette = {
  mode: "light" | "dark";
  background: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  success: string;
  danger: string;
};

const light: BridgeXPalette = {
  mode: "light",
  background: "#f7f6ff",
  surface: "#ffffff",
  surfaceSoft: "#f0edff",
  text: "#1d2030",
  muted: "#647079",
  border: "#ded8f5",
  primary: "#5e48d7",
  primarySoft: "#eeeaff",
  accent: "#f3a71f",
  success: "#188a51",
  danger: "#a6423b",
};

const dark: BridgeXPalette = {
  mode: "dark",
  background: "#151423",
  surface: "#211f35",
  surfaceSoft: "#2b2847",
  text: "#f6f3ff",
  muted: "#c5c0d4",
  border: "#4b466d",
  primary: "#a99bff",
  primarySoft: "#383260",
  accent: "#ffc45a",
  success: "#77d99a",
  danger: "#ff9c90",
};

export function resolveBridgeXPalette(preference: BridgeXThemePreference, systemScheme?: ColorSchemeName | null): BridgeXPalette {
  const effective = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;
  return effective === "dark" ? dark : light;
}

export async function loadThemePreference(): Promise<BridgeXThemePreference> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === "dark" || value === "light" || value === "system" ? value : "system";
}

export async function saveThemePreference(value: BridgeXThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, value);
}
