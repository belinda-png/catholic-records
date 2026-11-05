const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// Dashboard
export const getParishes = () => request<any[]>("/parishes/");
export const getParishStatistics = (parishId: number) =>
  request<any>(`/parishes/${parishId}/statistics/`);

// People
export const searchPeople = (query: string) =>
  request<any[]>(`/people/search/?q=${encodeURIComponent(query)}`);
export const getPersonHistory = (personId: number) =>
  request<any>(`/people/${personId}/history/`);

// Sacramental records (list + create)
export const getBaptisms = () => request<any[]>("/baptisms/");
export const createBaptism = (data: unknown) =>
  request<any>("/baptisms/", { method: "POST", body: JSON.stringify(data) });

export const getCommunions = () => request<any[]>("/communions/");
export const createCommunion = (data: unknown) =>
  request<any>("/communions/", { method: "POST", body: JSON.stringify(data) });

export const getConfirmations = () => request<any[]>("/confirmations/");
export const createConfirmation = (data: unknown) =>
  request<any>("/confirmations/", { method: "POST", body: JSON.stringify(data) });

export const getMatrimonies = () => request<any[]>("/matrimonies/");
export const createMatrimony = (data: unknown) =>
  request<any>("/matrimonies/", { method: "POST", body: JSON.stringify(data) });