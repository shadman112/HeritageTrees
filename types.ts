
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  birthDate: string;
  deathDate?: string;
  bio?: string;
  photoUrl?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  placeOfBirth?: string;
  occupation?: string;
}

export interface FamilyHierarchyNode {
  person: Person;
  children: FamilyHierarchyNode[];
}

export type ViewType = 'tree' | 'list';
