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