export interface SalesRecord {
  id: number;
  machineId: number;
  machineName: string;
  region: string;
  quantitySold: number;
  revenue: number;
  saleDate: string;
  dealerName: string;
}
export type SalesDraft = Omit<SalesRecord, 'id'>;