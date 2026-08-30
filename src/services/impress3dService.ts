import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Impress3DTransaction,
  Impress3DInvestment,
  Impress3DProduct,
  Impress3DSettings
} from '../types/impress3d';

export const impress3dService = {
  // SETTINGS
  async getSettings(userId: string): Promise<Impress3DSettings> {
    const defaultSettings: Impress3DSettings = {
      user_id: userId,
      kwh_price: 0.85,
      printer_power_w: 350,
      filament_default_price_kg: 100
    };

    if (!isSupabaseConfigured) return defaultSettings;

    try {
      const { data, error } = await supabase
        .from('impress3d_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Impress 3D settings:', error);
        return defaultSettings;
      }

      return data || defaultSettings;
    } catch (err) {
      console.error('Exception fetching Impress 3D settings:', err);
      return defaultSettings;
    }
  },

  async saveSettings(settings: Impress3DSettings): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!isSupabaseConfigured) return { success: true, data: settings };

    try {
      const { data, error } = await supabase
        .from('impress3d_settings')
        .upsert({
          user_id: settings.user_id,
          kwh_price: settings.kwh_price,
          printer_power_w: settings.printer_power_w,
          filament_default_price_kg: settings.filament_default_price_kg,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  // TRANSACTIONS
  async getTransactions(userId: string): Promise<Impress3DTransaction[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('impress3d_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching Impress 3D transactions:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Exception fetching Impress 3D transactions:', err);
      return [];
    }
  },

  async createTransaction(tx: Omit<Impress3DTransaction, 'id'>): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { data, error } = await supabase
        .from('impress3d_transactions')
        .insert([tx])
        .select()
        .single();

      if (error) return { success: false, error };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  async updateTransaction(id: string, tx: Partial<Impress3DTransaction>): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase
        .from('impress3d_transactions')
        .update({
          ...tx,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  async deleteTransaction(id: string): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase
        .from('impress3d_transactions')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  // INVESTMENTS
  async getInvestments(userId: string): Promise<Impress3DInvestment[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('impress3d_investments')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching Impress 3D investments:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Exception fetching Impress 3D investments:', err);
      return [];
    }
  },

  async createInvestment(inv: Omit<Impress3DInvestment, 'id'>): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      // Automatic integration: adding an investment here also creates a transaction of type 'investimento'
      const { data, error } = await supabase
        .from('impress3d_investments')
        .insert([inv])
        .select()
        .single();

      if (error) return { success: false, error };

      // Create matching transaction
      await this.createTransaction({
        user_id: inv.user_id,
        type: 'investimento',
        date: inv.purchase_date,
        description: inv.item,
        category: inv.category,
        amount: inv.amount,
        payment_method: 'Outro',
        notes: inv.notes || `Referência ao investimento registrado: ${inv.supplier || ''}`,
        is_demo: inv.is_demo
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  async updateInvestment(id: string, inv: Partial<Impress3DInvestment>): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase
        .from('impress3d_investments')
        .update({
          ...inv,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  async deleteInvestment(id: string): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase
        .from('impress3d_investments')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  // PRODUCTS
  async getProducts(userId: string): Promise<Impress3DProduct[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('impress3d_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Impress 3D products:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Exception fetching Impress 3D products:', err);
      return [];
    }
  },

  async createProduct(prod: Omit<Impress3DProduct, 'id'>): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { data, error } = await supabase
        .from('impress3d_products')
        .insert([prod])
        .select()
        .single();

      if (error) return { success: false, error };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  async updateProduct(id: string, prod: Partial<Impress3DProduct>): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase
        .from('impress3d_products')
        .update({
          ...prod,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase
        .from('impress3d_products')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  // DEMO DATA CONTROLLER
  async loadDemoData(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    try {
      // 1. Demo Investments
      const demoInvestments: Omit<Impress3DInvestment, 'id'>[] = [
        {
          user_id: userId,
          item: 'Impressora 3D',
          category: 'Impressora',
          purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 4500,
          supplier: 'Creality Store',
          notes: 'Equipamento principal de demonstração',
          is_demo: true
        },
        {
          user_id: userId,
          item: 'Filamentos Iniciais',
          category: 'Filamentos',
          purchase_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 800,
          supplier: '3D Lab',
          notes: 'Lote de teste PLA/PETG',
          is_demo: true
        }
      ];

      // Insert Investments (which automatically register matching transactions)
      for (const inv of demoInvestments) {
        await supabase.from('impress3d_investments').insert([inv]);
      }

      // 2. Demo Aporte (to cover initial expenses/investments)
      const demoAporte: Omit<Impress3DTransaction, 'id'> = {
        user_id: userId,
        type: 'aporte',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Aporte de Capital Inicial',
        category: 'Aporte',
        amount: 6000,
        payment_method: 'PIX',
        notes: 'Aporte financeiro inicial para demonstração',
        is_demo: true
      };
      await supabase.from('impress3d_transactions').insert([demoAporte]);

      // 3. Demo Transactions (Receitas & Despesas)
      const demoTransactions: Omit<Impress3DTransaction, 'id'>[] = [
        {
          user_id: userId,
          type: 'despesa',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Energia Elétrica',
          category: 'Energia',
          amount: 150,
          payment_method: 'Transferência',
          notes: 'Consumo proporcional das impressões do mês',
          is_demo: true
        },
        {
          user_id: userId,
          type: 'despesa',
          date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Embalagens',
          category: 'Embalagem',
          amount: 100,
          payment_method: 'Cartão',
          notes: 'Caixas de envio e plástico bolha',
          is_demo: true
        },
        {
          user_id: userId,
          type: 'receita',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Venda de peça personalizada',
          category: 'Venda de produto',
          amount: 350,
          payment_method: 'PIX',
          notes: 'Estátua decorativa impressa em resina',
          is_demo: true
        },
        {
          user_id: userId,
          type: 'receita',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Venda de suporte de celular',
          category: 'Venda de produto',
          amount: 180,
          payment_method: 'PIX',
          notes: 'Lote de 5 suportes articulados',
          is_demo: true
        }
      ];

      for (const tx of demoTransactions) {
        await supabase.from('impress3d_transactions').insert([tx]);
      }

      // 4. Demo Product
      const demoProduct: Omit<Impress3DProduct, 'id'> = {
        user_id: userId,
        name: 'Suporte de Celular Articulado',
        code: 'SUP-CELL-01',
        category: 'Acessórios',
        filament_weight_g: 85,
        printing_time_minutes: 200,
        filament_cost: 8.50,
        energy_cost: 2.30,
        packaging_cost: 1.50,
        other_cost: 0.00,
        total_cost: 12.30,
        sale_price: 35.00,
        profit: 22.70,
        profit_margin: 64.86,
        active: true,
        is_demo: true
      };

      await supabase.from('impress3d_products').insert([demoProduct]);

      return true;
    } catch (err) {
      console.error('Error loading demo data:', err);
      return false;
    }
  },

  async clearDemoData(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    try {
      await supabase.from('impress3d_transactions').delete().eq('user_id', userId).eq('is_demo', true);
      await supabase.from('impress3d_investments').delete().eq('user_id', userId).eq('is_demo', true);
      await supabase.from('impress3d_products').delete().eq('user_id', userId).eq('is_demo', true);
      return true;
    } catch (err) {
      console.error('Error clearing demo data:', err);
      return false;
    }
  }
};
