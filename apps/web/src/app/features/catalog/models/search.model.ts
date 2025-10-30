import { Product } from './product.model';
import { Category } from './category.model';

export type QuickSuggestionData = Product | Category | { name: string; slug: string };

export interface QuickSuggestion {
  type: 'product' | 'category' | 'tag';
  label: string;
  value: number;
  image?: string | null;
  data?: QuickSuggestionData;
}
