import { UserPersonaEnum } from '../enums';
import { Usage } from '../schemas/billing.schema';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  persona: UserPersonaEnum | null;
  onboardingCompleted: boolean;
  usage: Usage;
}
