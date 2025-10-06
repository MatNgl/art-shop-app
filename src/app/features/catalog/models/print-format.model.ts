export type Unit = 'cm' | 'mm' | 'in';

export interface PrintFormat {
  id: number;
  name: string; // ex: "Marque-page"
  slug: string; // ex: "marque-page"
  width: number; // ex: 21
  height: number; // ex: 7
  unit: Unit; // 'cm' | 'mm' | 'in'
  isActive: boolean; // visible/activable dans le site et le formulaire
  description?: string | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
