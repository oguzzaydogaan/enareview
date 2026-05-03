import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BACKEND_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5146"
    : "http://172.20.10.2:5146";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("jwtToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token from SecureStore", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
