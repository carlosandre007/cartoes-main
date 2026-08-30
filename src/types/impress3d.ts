export type Impress3DTransactionType = 'receita' | 'despesa' | 'investimento' | 'aporte';

export interface Impress3DTransaction {
  id: string;
  user_id: string;
  type: Impress3DTransactionType;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  payment_method: string;
  notes?: string;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Impress3DInvestment {
  id: string;
  user_id: string;
  item: string;
  category: string;
  purchase_date: string; // YYYY-MM-DD
  amount: number;
  supplier?: string;
  notes?: string;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Impress3DProduct {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  category?: string;
  filament_weight_g: number;
  printing_time_minutes: number;
  filament_cost: number;
  energy_cost: number;
  packaging_cost: number;
  other_cost: number;
  total_cost: number;
  sale_price: number;
  profit: number;
  profit_margin: number;
  active: boolean;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Impress3DSettings {
  id?: string;
  user_id: string;
  kwh_price: number;
  printer_power_w: number;
  filament_default_price_kg: number;
}
