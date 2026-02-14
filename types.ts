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
  date: string;
  count: number;
  status: 'active' | 'completed';
}

export interface BluetoothDevice {
  id: string;
  name: string;
  mac: string;
  rssi: number;
  status: 'connected' | 'available';
}
