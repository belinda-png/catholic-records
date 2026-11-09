const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {}
    throw new Error(`Request to ${path} failed (${res.status}) ${detail}`);
  }
  return res.json();
}

const list = async (path: string): Promise<any[]> => {
  const data: any = await request(path);
  return Array.isArray(data) ? data : data?.results ?? [];
};

const post = (path: string, body: unknown) =>
  request<any>(path, { method: "POST", body: JSON.stringify(body) });

export const fetchParishes = () => list("/parishes/");
export const fetchBaptisms = () => list("/baptisms/");
export const fetchCommunions = () => list("/communions/");
export const fetchConfirmations = () => list("/confirmations/");
export const fetchMatrimonies = () => list("/matrimonies/");

export const postBaptism = (b: unknown) => post("/baptisms/", b);
export const postCommunion = (b: unknown) => post("/communions/", b);
export const postConfirmation = (b: unknown) => post("/confirmations/", b);
export const postMatrimony = (b: unknown) => post("/matrimonies/", b);
export const fetchDocuments = () => list("/documents/");

export async function uploadDocument(file: File, category: string, baptismId?: number) {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  if (baptismId) form.append("baptism", String(baptismId));
  const res = await fetch(`${BASE}/documents/`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status}) ${await res.text()}`);
  return res.json();
}

export async function deleteDocument(id: string) {
  const res = await fetch(`${BASE}/documents/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
}