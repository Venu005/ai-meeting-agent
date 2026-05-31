import { UserPersonaEnum } from '@repo/shared-types/enums';

const PERSONA_DOC_TITLES: Record<UserPersonaEnum, string> = {
  [UserPersonaEnum.SOLO_FOUNDER]: 'Product spec',
  [UserPersonaEnum.PRODUCT_MANAGER]: 'PRD',
  [UserPersonaEnum.ENGINEERING_LEAD]: 'Technical RFC',
};

export const getPersonaDocTitle = (persona: UserPersonaEnum | null | undefined): string => {
  if (!persona) {
    return 'Structured document';
  }
  return PERSONA_DOC_TITLES[persona];
};
