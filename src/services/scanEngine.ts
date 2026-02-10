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
     * Fuzzy search via documents index
     */
    async fuzzySearch(keyword: string): Promise<any[]> {
        if (!keyword || keyword.length < 3) return [];

        const { data, error } = await supabase
            .from('documents')
            .select(`
                *,
                parcel:parcels(*)
            `)
            .ilike('doc_no', `%${keyword}%`)
            .limit(10);

        if (error || !data) return [];

        // Map to unique parcels
        const uniqueParcels = data
            .filter(d => d.parcel)
            .map(d => d.parcel);

        // Deduplicate by ID
        return Array.from(new Map(uniqueParcels.map(p => [p.id, p])).values());
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
