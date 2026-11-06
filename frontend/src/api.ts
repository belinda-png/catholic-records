const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request to ${path} failed: ${res.status}`);
  return res.json();
}

const list = async (path: string): Promise<any[]> => {
  const data: any = await request(path);
  return Array.isArray(data) ? data : data?.results ?? [];
};

export const fetchParishes = () => list("/parishes/");
export const fetchBaptisms = () => list("/baptisms/");
export const fetchCommunions = () => list("/communions/");
export const fetchConfirmations = () => list("/confirmations/");
export const fetchMatrimonies = () => list("/matrimonies/");