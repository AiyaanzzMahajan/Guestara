export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  tax_applicable: boolean;
  tax_percentage: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  tax_applicable: boolean | null;
  tax_percentage: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PricingType = 'static' | 'tiered' | 'complimentary' | 'discounted' | 'dynamic';

export interface TierPricing {
  id: string;
  item_id: string;
  up_to_hours: number;
  price: number;
  created_at: string;
}

export interface DiscountPricing {
  id: string;
  item_id: string;
  base_price: number;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  created_at: string;
}

export interface DynamicPricing {
  id: string;
  item_id: string;
  start_time: string;
  end_time: string;
  price: number;
  created_at: string;
}

export interface Addon {
  id: string;
  item_id: string;
  name: string;
  price: number;
  is_required: boolean;
  addon_group: string | null;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  item_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  pricing_type: PricingType;
  static_price: number | null;
  tax_applicable: boolean | null;
  tax_percentage: number | null;
  is_bookable: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
  tiered_pricing?: TierPricing[];
  discount_pricing?: DiscountPricing | null;
  dynamic_pricing?: DynamicPricing[];
  addons?: Addon[];
  availability_slots?: AvailabilitySlot[];
  category?: Category | null;
  subcategory?: Subcategory | null;
}

export interface Booking {
  id: string;
  item_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceBreakdown {
  applied_rule: string;
  base_price: number;
  discount: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  addons_total: number;
  grand_total: number;
}
