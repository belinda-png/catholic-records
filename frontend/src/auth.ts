const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api/auth";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "staff";
  parish_id: number | null;
  parish_name: string | null;
}

export const getToken = () => localStorage.getItem("token");
export const getUser = (): AuthUser | null => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
};
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.reload();
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Something went wrong. Try again.");
  return data;
}

const save = (data: { token: string; user: AuthUser }) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
};

export const fetchPublicParishes = async (): Promise<{ id: number; name: string }[]> => {
  const res = await fetch(`${BASE}/parishes/`);
  return res.json();
};

export const requestLoginCode = (email: string) => post("/login/", { email });
export const verifyLoginCode = async (email: string, otp: string) => save(await post("/login/verify/", { email, otp }));

export const requestSignupCode = (full_name: string, email: string, parish_id: string) =>
  post("/register/", { full_name, email, parish_id });
export const completeSignup = async (email: string, otp: string, parish_access_code: string) =>
  save(await post("/register/complete/", { email, otp, parish_access_code }));