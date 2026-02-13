/**
 * ReklamAI v2.0 — API Client
 * Replaces Supabase client. Talks to FastAPI backend.
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const TOKEN_KEY = 'reklamai_token';

// ── Token management ──
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

// ── Base fetch wrapper ──
export async function apiFetch<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        const error: any = new Error(body.detail || body.message || `API error ${res.status}`);
        error.status = res.status;
        error.body = body;
        throw error;
    }

    return res.json();
}

// ── Types ──
export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: string;
    created_at: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: UserResponse;
}

export interface CreditBalance {
    balance: number;
    total_earned: number;
    total_spent: number;
}

export interface GenerationItem {
    id: string;
    status: string;
    prompt: string;
    progress: number;
    result_url: string;
    result_urls: string[];
    thumbnail_url: string;
    error_message: string;
    credits_reserved: number;
    credits_final: number;
    created_at: string;
    completed_at: string | null;
    // Extended fields returned by backend
    modality?: string;
    preset_slug?: string;
    model_slug?: string;
    final_credits?: number;
    estimated_credits?: number;
    input?: Record<string, any>;
    preset?: { title_en?: string; title_ru?: string; type?: string };
    model?: { title?: string; provider?: string };
    assets?: { kind: string; url: string; storage_path?: string; storage_bucket?: string }[];
    board_id?: string;
    owner_id?: string;
}

export interface GenerationList {
    items: GenerationItem[];
    total: number;
}

export interface AIModelItem {
    id: string;
    name: string;
    slug: string;
    category: string;
    is_active: boolean;
    price_multiplier: number;
}

export interface GenerateRequest {
    prompt?: string;
    negative_prompt?: string;
    preset_slug?: string;
    model_slug?: string;
    aspect_ratio?: string;
    duration?: number;
    input_image_url?: string;
    reference_image_url?: string;
    params?: Record<string, any>;
}

// ── Auth API ──
export const authApi = {
    register: (email: string, password: string, full_name = '') =>
        apiFetch<TokenResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name }),
        }),

    login: (email: string, password: string) =>
        apiFetch<TokenResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getMe: () => apiFetch<UserResponse>('/auth/me'),
};

// ── Credits API ──
export const creditsApi = {
    getBalance: () => apiFetch<CreditBalance>('/api/credits'),
};

// ── Generations API ──
export interface GenerationListParams {
    limit?: number;
    offset?: number;
    status?: string;
}

export const generationsApi = {
    create: (req: GenerateRequest) =>
        apiFetch<GenerationItem>('/api/generate', {
            method: 'POST',
            body: JSON.stringify(req),
        }),

    get: (id: string) => apiFetch<GenerationItem>(`/api/generations/${id}`),

    list: (params: GenerationListParams = {}) => {
        const { limit = 20, offset = 0, status } = params;
        const qs = new URLSearchParams();
        qs.set('limit', String(limit));
        qs.set('offset', String(offset));
        if (status) qs.set('status', status);
        return apiFetch<GenerationList>(`/api/generations?${qs.toString()}`);
    },
};

// ── Models API ──
export const modelsApi = {
    list: () => apiFetch<AIModelItem[]>('/api/models'),
};
