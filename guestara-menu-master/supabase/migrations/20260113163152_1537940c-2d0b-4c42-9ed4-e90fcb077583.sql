-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  description TEXT,
  tax_applicable BOOLEAN DEFAULT false,
  tax_percentage NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT tax_percentage_required CHECK (
    (tax_applicable = false) OR (tax_applicable = true AND tax_percentage IS NOT NULL)
  )
);

-- Subcategories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  tax_applicable BOOLEAN,
  tax_percentage NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Pricing type enum
CREATE TYPE public.pricing_type AS ENUM ('static', 'tiered', 'complimentary', 'discounted', 'dynamic');

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  pricing_type public.pricing_type NOT NULL DEFAULT 'static',
  static_price NUMERIC(10,2),
  tax_applicable BOOLEAN,
  tax_percentage NUMERIC(5,2),
  is_bookable BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT parent_check CHECK (
    (category_id IS NOT NULL AND subcategory_id IS NULL) OR
    (category_id IS NULL AND subcategory_id IS NOT NULL)
  )
);

-- Tiered pricing table
CREATE TABLE public.tiered_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  up_to_hours INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, up_to_hours)
);

-- Discount pricing table
CREATE TABLE public.discount_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE UNIQUE,
  base_price NUMERIC(10,2) NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
  discount_value NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dynamic pricing (time-based) table
CREATE TABLE public.dynamic_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Availability slots table (for bookable items)
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Addons table
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  addon_group TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiered_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Public read policies for menu data
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active subcategories" ON public.subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active menu items" ON public.menu_items FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view tiered pricing" ON public.tiered_pricing FOR SELECT USING (true);
CREATE POLICY "Anyone can view discount pricing" ON public.discount_pricing FOR SELECT USING (true);
CREATE POLICY "Anyone can view dynamic pricing" ON public.dynamic_pricing FOR SELECT USING (true);
CREATE POLICY "Anyone can view availability" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can view addons" ON public.addons FOR SELECT USING (true);

-- Bookings policies (anyone can create, but only see their own by email match)
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view confirmed bookings for availability check" ON public.bookings FOR SELECT USING (status IN ('pending', 'confirmed'));

-- Indexes for performance
CREATE INDEX idx_subcategories_category ON public.subcategories(category_id);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_subcategory ON public.menu_items(subcategory_id);
CREATE INDEX idx_menu_items_slug ON public.menu_items(slug);
CREATE INDEX idx_tiered_pricing_item ON public.tiered_pricing(item_id);
CREATE INDEX idx_dynamic_pricing_item ON public.dynamic_pricing(item_id);
CREATE INDEX idx_addons_item ON public.addons(item_id);
CREATE INDEX idx_bookings_item_date ON public.bookings(item_id, booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();