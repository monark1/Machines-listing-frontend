export interface Machine {
  id: number;
  name: string;
  category: string;
  launchYear: number;
  status: 'active' | 'discontinued';
  specs: {
    width: number;
    speed: number;
    printColors: number;
  };
  unitPrice: number;
}
export type MachineDraft = Omit<Machine, 'id'>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}