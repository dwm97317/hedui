export interface Waybill {
  id: string;
  number: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  shipper: string;
  timestamp: string;
  status: 'pending' | 'scanned' | 'shipped' | 'transit' | 'completed';
}

export interface Batch {
  id: string;
  batch_no: string;
  status: 'active' | 'completed' | 'sealed' | 'in_transit' | 'received';
  total_weight: number;
  item_count: number;
  created_at: string;

  // Compatibility fields (mapped or deprecated)
  date?: string;
  count?: number;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  mac: string;
  rssi: number;
  status: 'connected' | 'available';
}

export type BillType = 'SENDER_TO_ADMIN' | 'ADMIN_TO_TRANSIT' | 'SENDER_TO_RECEIVER';
export type CurrencyCode = 'VND' | 'CNY';

export interface BillTemplate {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
  is_active: boolean;
}

export interface BatchBillConfig {
  id: string;
  batch_id: string;
  bill_type: BillType;
  template_id: string;
  is_enabled: boolean;
  template?: BillTemplate; // Joined field
}

export interface BatchPriceRule {
  id: string;
  batch_id: string;
  bill_type: BillType;
  category: string;
  unit_price: number;
  currency: CurrencyCode;
}

export interface Bill {
  id: string;
  batch_id: string;
  bill_type: BillType;
  payer_company_id: string;
  payee_company_id: string;
  currency: CurrencyCode;
  total_weight: number;
  unit_price: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}
