export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'stakeholder' | 'employee';
  fullName: string;
  email: string;
  department: string;
  dateJoined: string;
  status: 'active' | 'inactive';
}