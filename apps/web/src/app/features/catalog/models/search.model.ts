export interface QuickSuggestion {
  type: 'product' | 'category' | 'tag';
  label: string;
  value: number;
  image?: string | null;
  data?: any;
}
