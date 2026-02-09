export type Role = 'sender' | 'transit' | 'receiver';

export type ParcelStatus = 'pending' | 'sent' | 'in_transit' | 'received' | 'anomaly';

export interface Batch {
    id: string;
    batch_number: string;
    status: 'active' | 'completed';
    business_date: string;
    merged_weight: number | null;
    receiver_weight: number | null;
    created_at: string;
}

export interface Parcel {
    id: string;
    barcode: string;
    sender_weight: number | null;
    transit_weight: number | null;
    receiver_weight: number | null;
    batch_id: string | null;
    status: 'pending' | 'sent' | 'in_transit' | 'received' | 'anomaly' | 'relabeled';
    package_type: 'original' | 'derived';
    printed?: boolean;
    printed_at?: string | null;
    printed_by?: string | null;
    custom_id?: string | null;
    sender_user_id?: string | null;
    transit_user_id?: string | null;
    receiver_user_id?: string | null;
    sender_updated_at?: string | null;
    transit_updated_at?: string | null;
    receiver_updated_at?: string | null;
    weight_source?: 'BLE' | 'HID' | 'MANUAL' | null;
    created_at: string;
    updated_at: string;
    batches?: { batch_number: string };
}
