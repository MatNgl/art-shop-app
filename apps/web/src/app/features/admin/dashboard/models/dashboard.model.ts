export type PeriodType = '7d' | '30d' | '90d' | '1y';
export type GranularityType = 'day' | 'week' | 'month';

export interface DashboardFilters {
  period: PeriodType;
  granularity: GranularityType;
  category?: string;
  compareWithPrevious: boolean;
}

export interface KpiData {
  label: string;
  value: number;
  unit?: 'currency' | 'number' | 'percentage';
  variation?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  iconColor?: string;
  description?: string;
}

export interface ChartCardConfig {
  title: string;
  subtitle?: string;
  showFilters?: boolean;
  showToggle?: boolean;
  toggleLabel?: string;
  footerText?: string;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  averageBasket: number;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  sales: number;
  revenue: number;
  variation: number;
}

export interface StockData {
  productId: string;
  productName: string;
  stock: number;
  category: string;
  format: string;
  daysInStock: number;
  rotationRate: number;
}

export interface UserActivityData {
  date: string;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  activeUsers: number;
}

export interface AdminActionData {
  id: string;
  adminName: string;
  action: string;
  entityType: 'product' | 'category' | 'user' | 'stock' | 'order';
  entityId: string;
  timestamp: Date;
  severity: 'normal' | 'warning' | 'critical';
  ipAddress?: string;
}

export interface AlertData {
  id: string;
  type: 'stock' | 'sales' | 'security';
  severity: 'low' | 'medium' | 'high';
  message: string;
  productId?: string;
  timestamp: Date;
}
