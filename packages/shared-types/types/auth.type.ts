export interface AuthContextType {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  name: string;
  avatarUrl?: string;
}
