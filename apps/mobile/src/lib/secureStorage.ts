import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 1600;
const metadataKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

/**
 * Supabase session persistence adapter backed by encrypted device storage.
 * Values are chunked because some native secure-storage providers reject large values.
 */
export const secureStorage = {
  async getItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(metadataKey(key)) ?? "0");
    if (!count) return SecureStore.getItemAsync(key);
    const chunks = await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index))));
    return chunks.every((chunk): chunk is string => typeof chunk === "string") ? chunks.join("") : null;
  },
  async setItem(key: string, value: string) {
    const previous = Number(await SecureStore.getItemAsync(metadataKey(key)) ?? "0");
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      await SecureStore.deleteItemAsync(metadataKey(key));
      await Promise.all(Array.from({ length: previous }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))));
      return;
    }
    const parts = Array.from({ length: Math.ceil(value.length / CHUNK_SIZE) }, (_, index) => value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE));
    await SecureStore.deleteItemAsync(key);
    await Promise.all(parts.map((part, index) => SecureStore.setItemAsync(chunkKey(key, index), part)));
    await SecureStore.setItemAsync(metadataKey(key), String(parts.length));
    await Promise.all(Array.from({ length: Math.max(0, previous - parts.length) }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, parts.length + index))));
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(metadataKey(key)) ?? "0");
    await SecureStore.deleteItemAsync(key);
    await SecureStore.deleteItemAsync(metadataKey(key));
    await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))));
  },
};
