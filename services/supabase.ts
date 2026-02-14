import { createClient } from '@supabase/supabase-js';

// Load directly from env, no proxy needed for Supabase usually as it handles CORS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Standard API Response Structure
 */
export interface ServiceResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

/**
 * Helper to wrap Supabase calls with retry logic
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: any): boolean => {
    // Retry on network errors, timeouts, or 5xx server errors
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch') ||
        error.code === 'PGRST301' // PostgREST timeout
    );
};

export async function handleServiceCall<T>(
    promise: any,
    retries = 2
): Promise<ServiceResponse<T>> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const { data, error } = await promise;
            if (error) {
                // Retry on retryable errors
                if (attempt < retries && isRetryableError(error)) {
                    console.warn(`Retrying request (attempt ${attempt + 1}/${retries})...`);
                    await delay(1000 * (attempt + 1)); // Exponential backoff
                    continue;
                }
                console.error('Supabase Error:', error);
                return { data: null, error: error.message, success: false };
            }
            return { data, error: null, success: true };
        } catch (err: any) {
            if (attempt < retries && isRetryableError(err)) {
                console.warn(`Retrying request (attempt ${attempt + 1}/${retries})...`);
                await delay(1000 * (attempt + 1));
                continue;
            }
            console.error('Unexpected Error:', err);
            return { data: null, error: err.message || 'Unknown error', success: false };
        }
    }
    // Should never reach here, but TypeScript needs it
    return { data: null, error: 'Max retries exceeded', success: false };
}
