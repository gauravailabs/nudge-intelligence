export type RelationshipType = 'hot' | 'warm' | 'cold';
export interface InsightPerson {
  id: string;
  name: string;
  designation: string;
  relationship: RelationshipType;
  managerId: string | null;
}
