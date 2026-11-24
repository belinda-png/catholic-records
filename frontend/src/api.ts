import { getToken, logout } from "./auth";
export const deleteBaptism = (id: string) => request<void>(`/baptisms/${id}/`, { method: "DELETE" });
export const fetchAdminOverview = () => request<any>("/auth/admin-overview/");
const BASE =
  (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api";

const authHeader = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Token ${t}` } : {};
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    logout();
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {}
    throw new Error(`Request to ${path} failed (${res.status}) ${detail}`);
  }

  // DELETE and some PATCH responses have no body
  if (res.status === 204) return undefined as T;
  return res.json();
}

const list = async (path: string): Promise<any[]> => {
  const data: any = await request(path);
  return Array.isArray(data) ? data : data?.results ?? [];
};

const post = (path: string, body: unknown) =>
  request<any>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const fetchParishes = () => list("/parishes/");
export const fetchBaptisms = () => list("/baptisms/");
export const fetchCommunions = () => list("/communions/");
export const fetchConfirmations = () => list("/confirmations/");
export const fetchMatrimonies = () => list("/matrimonies/");
export const fetchDocuments = () => list("/documents/");

export const postBaptism = (b: unknown) => post("/baptisms/", b);
export const postCommunion = (b: unknown) => post("/communions/", b);
export const postConfirmation = (b: unknown) => post("/confirmations/", b);
export const postMatrimony = (b: unknown) => post("/matrimonies/", b);

export const patchBaptism = (id: string, body: unknown) =>
  request<any>(`/baptisms/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export async function uploadDocument(
  file: File,
  category: string,
  baptismId?: number,
  parishId?: string
) {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  if (baptismId) form.append("baptism", String(baptismId));
  if (parishId) form.append("parish", parishId);

  // No Content-Type here: the browser sets it for file uploads
  const res = await fetch(`${BASE}/documents/`, {
    method: "POST",
    body: form,
    headers: authHeader(),
  });
  if (res.status === 401) logout();
  if (!res.ok) throw new Error(`Upload failed (${res.status}) ${await res.text()}`);
  return res.json();
}

export async function deleteDocument(id: string) {
  const res = await fetch(`${BASE}/documents/${id}/`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (res.status === 401) logout();
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
}
export const createParish = (name: string, location: string) =>
  post("/auth/admin-parishes/", { name, location });

export const resetParishCode = (id: number) =>
  post(`/auth/admin-parishes/${id}/reset-code/`, {});