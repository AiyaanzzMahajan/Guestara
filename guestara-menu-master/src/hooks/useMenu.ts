import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItem, Category, Subcategory } from '@/types/menu';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}

export function useSubcategories() {
  return useQuery({
    queryKey: ['subcategories'],
    queryFn: async (): Promise<Subcategory[]> => {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Subcategory[];
    },
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async (): Promise<MenuItem[]> => {
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      const itemIds = items.map(item => item.id);

      const [tieredRes, discountRes, dynamicRes, addonsRes, availRes, catRes, subRes] = await Promise.all([
        supabase.from('tiered_pricing').select('*').in('item_id', itemIds),
        supabase.from('discount_pricing').select('*').in('item_id', itemIds),
        supabase.from('dynamic_pricing').select('*').in('item_id', itemIds),
        supabase.from('addons').select('*').in('item_id', itemIds),
        supabase.from('availability_slots').select('*').in('item_id', itemIds),
        supabase.from('categories').select('*'),
        supabase.from('subcategories').select('*'),
      ]);

      const tieredMap = new Map<string, any[]>();
      (tieredRes.data || []).forEach(t => {
        if (!tieredMap.has(t.item_id)) tieredMap.set(t.item_id, []);
        tieredMap.get(t.item_id)!.push(t);
      });

      const discountMap = new Map<string, any>();
      (discountRes.data || []).forEach(d => discountMap.set(d.item_id, d));

      const dynamicMap = new Map<string, any[]>();
      (dynamicRes.data || []).forEach(d => {
        if (!dynamicMap.has(d.item_id)) dynamicMap.set(d.item_id, []);
        dynamicMap.get(d.item_id)!.push(d);
      });

      const addonsMap = new Map<string, any[]>();
      (addonsRes.data || []).forEach(a => {
        if (!addonsMap.has(a.item_id)) addonsMap.set(a.item_id, []);
        addonsMap.get(a.item_id)!.push(a);
      });

      const availMap = new Map<string, any[]>();
      (availRes.data || []).forEach(a => {
        if (!availMap.has(a.item_id)) availMap.set(a.item_id, []);
        availMap.get(a.item_id)!.push(a);
      });

      const catMap = new Map<string, any>();
      (catRes.data || []).forEach(c => catMap.set(c.id, c));

      const subMap = new Map<string, any>();
      (subRes.data || []).forEach(s => subMap.set(s.id, s));

      return items.map(item => ({
        ...item,
        tiered_pricing: tieredMap.get(item.id)?.sort((a, b) => a.up_to_hours - b.up_to_hours),
        discount_pricing: discountMap.get(item.id) || null,
        dynamic_pricing: dynamicMap.get(item.id),
        addons: addonsMap.get(item.id),
        availability_slots: availMap.get(item.id),
        category: item.category_id ? catMap.get(item.category_id) : null,
        subcategory: item.subcategory_id ? subMap.get(item.subcategory_id) : null,
      })) as MenuItem[];
    },
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menu-item', id],
    queryFn: async (): Promise<MenuItem | null> => {
      const { data: item, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      if (!item) return null;

      const [tieredRes, discountRes, dynamicRes, addonsRes, availRes] = await Promise.all([
        supabase.from('tiered_pricing').select('*').eq('item_id', id),
        supabase.from('discount_pricing').select('*').eq('item_id', id).maybeSingle(),
        supabase.from('dynamic_pricing').select('*').eq('item_id', id),
        supabase.from('addons').select('*').eq('item_id', id),
        supabase.from('availability_slots').select('*').eq('item_id', id),
      ]);

      let category = null;
      let subcategory = null;
      
      if (item.category_id) {
        const { data } = await supabase.from('categories').select('*').eq('id', item.category_id).single();
        category = data;
      }
      if (item.subcategory_id) {
        const { data } = await supabase.from('subcategories').select('*').eq('id', item.subcategory_id).single();
        subcategory = data;
      }

      return {
        ...item,
        tiered_pricing: tieredRes.data?.sort((a, b) => a.up_to_hours - b.up_to_hours),
        discount_pricing: discountRes.data || null,
        dynamic_pricing: dynamicRes.data,
        addons: addonsRes.data,
        availability_slots: availRes.data,
        category,
        subcategory,
      } as MenuItem;
    },
    enabled: !!id,
  });
}
