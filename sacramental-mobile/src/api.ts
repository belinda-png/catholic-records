import { Platform } from "react-native";

const LOCAL_IP = "192.168.1.5"; // Replace with your laptop's IPv4 address

export const API_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:8000/api"
    : `http://${LOCAL_IP}:8000/api`;