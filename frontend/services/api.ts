import type {
  CarbonSummary, EmissionFactor, Token, User, VillageBoundary, VillageDetail, VillagePage, VillageSummary,
} from "@/interface/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7200";
export const GEOSERVER_URL = process.env.NEXT_PUBLIC_GEOSERVER_URL ?? "http://localhost:8095/geoserver";

const TOKEN_KEY = "vcd_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Called on any 401 so the app can drop the session and go to /login. */
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {}
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<Token>("/auth/login", { method: "POST", body: new URLSearchParams({ username, password }) }),
  me: () => request<User>("/auth/me"),

  villages: (params: { search?: string; has_carbon?: boolean; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.has_carbon != null) q.set("has_carbon", String(params.has_carbon));
    q.set("limit", String(params.limit ?? 20));
    return request<VillagePage>(`/villages?${q}`);
  },
  village: (vlcode: string) => request<VillageDetail>(`/villages/${vlcode}`),
  boundary: (vlcode: string) => request<VillageBoundary>(`/villages/${vlcode}/boundary`),
  villageAt: (lon: number, lat: number) => request<VillageSummary>(`/villages/at?lon=${lon}&lat=${lat}`),
  compare: (vlcodes: string[]) => request<VillageDetail[]>(`/villages/compare?vlcodes=${vlcodes.join(",")}`),

  summary: () => request<CarbonSummary>("/carbon/summary"),
  emissionFactors: () => request<EmissionFactor[]>("/carbon/emission-factors"),
};
