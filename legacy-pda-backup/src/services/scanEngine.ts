import { supabase } from '../lib/supabase';
import { notification } from 'antd';

// Standard Action Types
export type ScanActionType =
    | 'OPEN_PARCEL'
    | 'OPEN_TRANSFER'
    | 'SWITCH_BATCH'
    | 'SHOW_ERROR'
    | 'NEW_PARCEL_PROMPT'
    | 'IGNORE';

export interface ScanActionResult {
    type: ScanActionType;
    payload?: any;
    message?: string;
    results?: any[]; // For ambiguous/multiple results
}

export interface ScanContext {
    userId: string;
    role: string;
    activeBatchId: string | null;
    currentPath: string;
}

export class ScanEngine {

    /**
     * Main Entry Point: Identify -> Check Permissions -> Return Action
     */
    async processScan(code: string, context: ScanContext): Promise<ScanActionResult> {
        if (!context.userId) {
            return { type: 'SHOW_ERROR', message: 'User not logged in' };
        }

        // 1. Identify Code (Exact Match: Transfer -> Parcel -> Batch)
        const identification = await this.identifyCode(code);

        if (!identification) {
            // 2. Fallback: Fuzzy Search
            const fuzzyResults = await this.fuzzySearch(code);
            if (fuzzyResults.length === 1) {
                // Single match found via fuzzy search
                return this.validateAndDecide({ type: 'PARCEL', data: fuzzyResults[0] }, context);
            } else if (fuzzyResults.length > 1) {
                // Ambiguous results: Return list to UI to let user choose
                return {
                    type: 'IGNORE', // Or 'SHOW_MODAL'? Let's use SHOW_RESULTS
                    results: fuzzyResults,
                    message: 'Multiple partial matches found.'
                };
            }

            return { type: 'NEW_PARCEL_PROMPT', payload: { code }, message: 'Unknown barcode. Create new?' };
        }

        // 3. Permission & State Validation
        return this.validateAndDecide(identification, context);
    }

    /**
     * Advanced Fuzzy Search:
     * - Searches doc_no (documents), sender_name, pinyin, and initials (parcels).
     * - Weights results: Active Batch > Recent Work > 0.
     */
    async fuzzySearch(keyword: string, activeBatchId?: string | null): Promise<any[]> {
        if (!keyword || keyword.length < 2) return [];

        // 1. Fetch from Documents (Barcodes/IDs)
        const { data: docData } = await supabase
            .from('documents')
            .select('parcel_id, doc_no')
            .ilike('doc_no', `%${keyword}%`)
            .limit(10);

        // 2. Fetch from Parcels (Names/Pinyin)
        const { data: parcelData } = await supabase
            .from('parcels')
            .select('*')
            .or(`sender_name.ilike.%${keyword}%,sender_name_pinyin.ilike.%${keyword}%,sender_name_initial.ilike.%${keyword}%`)
            .limit(10);

        // 3. Combine and Deduplicate
        const parcelIds = new Set([
            ...(docData?.map(d => d.parcel_id) || []),
            ...(parcelData?.map(p => p.id) || [])
        ]);

        if (parcelIds.size === 0) return [];

        // 4. Fetch full details with weighting
        const { data: results, error } = await supabase
            .from('parcels')
            .select(`
                *,
                batches(batch_number)
            `)
            .in('id', Array.from(parcelIds))
            .order('updated_at', { ascending: false });

        if (error || !results) return [];

        // 5. Intelligent Sorting (Weighted)
        return results.sort((a, b) => {
            // Priority 1: Current Batch
            if (activeBatchId) {
                const aInBatch = a.batch_id === activeBatchId ? 1 : 0;
                const bInBatch = b.batch_id === activeBatchId ? 1 : 0;
                if (aInBatch !== bInBatch) return bInBatch - aInBatch;
            }
            // Priority 2: Exact Barcode match (if user typed full code)
            const aExact = a.barcode === keyword ? 1 : 0;
            const bExact = b.barcode === keyword ? 1 : 0;
            if (aExact !== bExact) return bExact - aExact;

            return 0; // Fallback to recency from SQL order
        });
    }

    // --- Search History ---

    async getRecentSearches(userId: string): Promise<string[]> {
        const { data } = await supabase
            .from('search_history')
            .select('keyword')
            .eq('user_id', userId)
            .order('searched_at', { ascending: false })
            .limit(10);

        return Array.from(new Set(data?.map(h => h.keyword) || []));
    }

    async saveSearch(userId: string, keyword: string) {
        if (!keyword || keyword.length < 2) return;
        await supabase.from('search_history').upsert({
            user_id: userId,
            keyword,
            searched_at: new Date().toISOString()
        }, { onConflict: 'user_id,keyword' }); // Note: unique constraint might be needed or handled by logic
    }

    // --- Favorites ---

    async toggleFavorite(userId: string, parcelId: string) {
        const { data: existing } = await supabase
            .from('favorite_packages')
            .select('id')
            .eq('user_id', userId)
            .eq('package_id', parcelId)
            .maybeSingle();

        if (existing) {
            await supabase.from('favorite_packages').delete().eq('id', existing.id);
            return false;
        } else {
            await supabase.from('favorite_packages').insert({ user_id: userId, package_id: parcelId });
            return true;
        }
    }

    async getFavorites(userId: string): Promise<string[]> {
        const { data } = await supabase
            .from('favorite_packages')
            .select('package_id')
            .eq('user_id', userId);
        return data?.map(f => f.package_id) || [];
    }

    private async identifyCode(code: string): Promise<{ type: 'TRANSFER' | 'PARCEL' | 'BATCH', data: any } | null> {
        // A. Check Transfer (Higher Priority)
        // (Assuming we have a transfers table or structure, for now we mock or check parcels with status?)
        // Let's assume Transfer is not fully implemented in schema yet or uses 'parcels' with specific flag?
        // Wait, 'package_relations' is for consolidation.
        // Let's check 'parcels' first as that's the core.

        // Check Parcel
        const { data: parcel, error: parcelError } = await supabase
            .from('parcels')
            .select('*')
            .or(`barcode.eq.${code},custom_id.eq.${code}`)
            .maybeSingle();

        if (parcel) {
            return { type: 'PARCEL', data: parcel };
        }

        // Check Batch
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .select('*')
            .eq('id', code) // Assuming Batch ID is scanned? Or Batch Name? 
            // In reality, batch might have a specialized barcode.
            .maybeSingle();

        if (batch) {
            return { type: 'BATCH', data: batch };
        }

        return null;
    }

    private async validateAndDecide(
        idHelper: { type: 'TRANSFER' | 'PARCEL' | 'BATCH', data: any },
        context: ScanContext
    ): Promise<ScanActionResult> {
        const { type, data } = idHelper;

        if (type === 'BATCH') {
            // Check Access to this batch
            // (Assuming RLS handles it, but we can double check logic here)
            if (data.id === context.activeBatchId) {
                return { type: 'IGNORE', message: 'Already in this batch' };
            }
            return { type: 'SWITCH_BATCH', payload: data };
        }

        if (type === 'PARCEL') {
            // Check Batch Consistency
            if (data.batch_id !== context.activeBatchId) {
                return {
                    type: 'SWITCH_BATCH',
                    payload: { id: data.batch_id, reason: 'Parcel belongs to another batch' },
                    message: `Parcel belongs to batch ${data.batch_id}. Switch?`
                };
            }

            // Check Permission (Role) - Logic is enforced by UI usually, but here we can hint
            // e.g. Receiver scanning a Sender parcel -> View Only

            // Check Locked Status
            if (data.printed) {
                // If Printed, it is Locked for Editing, but Openable for Viewing/Reprinting
                return { type: 'OPEN_PARCEL', payload: { ...data, readOnly: true }, message: 'Parcel is Locked (Printed)' };
            }

            return { type: 'OPEN_PARCEL', payload: data };
        }

        return { type: 'SHOW_ERROR', message: 'Unhandled Code Type' };
    }
}

export const scanEngine = new ScanEngine();
