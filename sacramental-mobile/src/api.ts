import { Platform } from "react-native";

// Your laptop's IPv4 address (run `ipconfig` and look for "IPv4 Address")
const LOCAL_IP = "192.168.6.110";

export const API_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:8000/api"
    : `http://${LOCAL_IP}:8000/api`;