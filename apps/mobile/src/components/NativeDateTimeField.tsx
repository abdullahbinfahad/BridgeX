import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Mode = "date" | "datetime";
type Props = { value: string; onChange: (value: string) => void; mode?: Mode; label: string; required?: boolean };
const parseDate = (value: string) => { const parsed = value ? new Date(value) : new Date(); return Number.isNaN(parsed.getTime()) ? new Date() : parsed; };
const formatDate = (value: Date, includeTime: boolean) => includeTime ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}` : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const displayDate = (value: string, includeTime: boolean) => value ? new Intl.DateTimeFormat(undefined, includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(parseDate(value)) : includeTime ? "Choose date and time" : "Choose a date";

export function NativeDateTimeField({ value, onChange, mode = "date", label, required = false }: Props) {
  const [showDate, setShowDate] = useState(false); const [showTime, setShowTime] = useState(false); const selected = parseDate(value); const includeTime = mode === "datetime";
  const updateDate = (_event: DateTimePickerEvent, next?: Date) => { setShowDate(Platform.OS === "ios"); if (next) { const current = parseDate(value); next.setHours(current.getHours(), current.getMinutes(), 0, 0); onChange(formatDate(next, includeTime)); if (includeTime && Platform.OS === "android") setShowTime(true); } };
  const updateTime = (_event: DateTimePickerEvent, next?: Date) => { setShowTime(Platform.OS === "ios"); if (next) { const current = parseDate(value); current.setHours(next.getHours(), next.getMinutes(), 0, 0); onChange(formatDate(current, true)); } };
  return <View style={styles.wrap}><Pressable accessibilityLabel={`${label}${required ? ", required" : ""}`} onPress={() => setShowDate(true)} style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}><Ionicons name="calendar-outline" size={19} color="#176447" /><Text style={[styles.value, !value && styles.placeholder]}>{displayDate(value, includeTime)}</Text><Ionicons name="chevron-down" size={16} color="#627073" /></Pressable>{showDate ? <DateTimePicker value={selected} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} onChange={updateDate} minimumDate={new Date()} /> : null}{showTime ? <DateTimePicker value={parseDate(value)} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={updateTime} /> : null}</View>;
}

const styles = StyleSheet.create({ wrap: { gap: 7 }, trigger: { alignItems: "center", backgroundColor: "#fff", borderColor: "#b6c3b7", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 48, paddingHorizontal: 13 }, value: { color: "#172126", flex: 1, fontSize: 14, fontWeight: "700" }, placeholder: { color: "#657377", fontWeight: "500" }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] } });
