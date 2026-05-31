import { UserProfile } from './user.type';

export interface AuthContextType extends UserProfile {
  role?: string;
  permissions?: string[];
}
