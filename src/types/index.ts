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
    created_at: string;
    updated_at: string;
    batches?: { batch_number: string };
}
