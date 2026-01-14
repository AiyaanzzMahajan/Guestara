import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceResponse {
  applied_rule: string;
  base_price: number;
  discount: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  addons_total: number;
  grand_total: number;
  item_name: string;
  pricing_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const itemId = pathParts[pathParts.length - 2];
    
    const hoursParam = url.searchParams.get("hours");
    const addonsParam = url.searchParams.get("addons");
    
    const hours = hoursParam ? parseInt(hoursParam, 10) : 1;
    const selectedAddonIds = addonsParam ? addonsParam.split(",") : [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching price for item: ${itemId}, hours: ${hours}`);

    const { data: item, error: itemError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error("Item not found:", itemError);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let category = null;
    let subcategory = null;
    
    if (item.category_id) {
      const { data } = await supabase.from("categories").select("*").eq("id", item.category_id).single();
      category = data;
    }
    if (item.subcategory_id) {
      const { data } = await supabase.from("subcategories").select("*").eq("id", item.subcategory_id).single();
      subcategory = data;
      if (subcategory && subcategory.category_id) {
        const { data: cat } = await supabase.from("categories").select("*").eq("id", subcategory.category_id).single();
        category = cat;
      }
    }

    const [tieredRes, discountRes, dynamicRes, addonsRes] = await Promise.all([
      supabase.from("tiered_pricing").select("*").eq("item_id", itemId).order("up_to_hours"),
      supabase.from("discount_pricing").select("*").eq("item_id", itemId).maybeSingle(),
      supabase.from("dynamic_pricing").select("*").eq("item_id", itemId),
      supabase.from("addons").select("*").eq("item_id", itemId),
    ]);

    const tieredPricing = tieredRes.data || [];
    const discountPricing = discountRes.data;
    const dynamicPricing = dynamicRes.data || [];
    const addons = addonsRes.data || [];

    const getEffectiveTax = (): number => {
      if (item.tax_applicable !== null && item.tax_percentage !== null) {
        return item.tax_applicable ? (item.tax_percentage || 0) : 0;
      }
      if (subcategory) {
        if (subcategory.tax_applicable !== null && subcategory.tax_percentage !== null) {
          return subcategory.tax_applicable ? (subcategory.tax_percentage || 0) : 0;
        }
      }
      if (category && category.tax_applicable && category.tax_percentage) {
        return category.tax_percentage;
      }
      return 0;
    };

    let basePrice = 0;
    let discount = 0;
    let appliedRule = "";

    switch (item.pricing_type) {
      case "static":
        basePrice = item.static_price || 0;
        appliedRule = "Fixed price";
        break;

      case "tiered": {
        if (tieredPricing.length > 0) {
          let selectedTier = tieredPricing[tieredPricing.length - 1];
          for (const tier of tieredPricing) {
            if (hours <= tier.up_to_hours) {
              selectedTier = tier;
              break;
            }
          }
          basePrice = selectedTier.price;
          appliedRule = `Up to ${selectedTier.up_to_hours} hour${selectedTier.up_to_hours > 1 ? "s" : ""}`;
        }
        break;
      }

      case "complimentary":
        basePrice = 0;
        appliedRule = "Complimentary";
        break;

      case "discounted":
        if (discountPricing) {
          basePrice = discountPricing.base_price;
          if (discountPricing.discount_type === "flat") {
            discount = discountPricing.discount_value;
            appliedRule = `₹${discountPricing.discount_value} off`;
          } else {
            discount = (basePrice * discountPricing.discount_value) / 100;
            appliedRule = `${discountPricing.discount_value}% off`;
          }
        }
        break;

      case "dynamic": {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        
        let foundWindow = false;
        for (const window of dynamicPricing) {
          if (currentTime >= window.start_time && currentTime < window.end_time) {
            basePrice = window.price;
            appliedRule = `Time-based: ${window.start_time}–${window.end_time}`;
            foundWindow = true;
            break;
          }
        }
        if (!foundWindow) {
          appliedRule = "Currently unavailable";
        }
        break;
      }
    }

    const subtotal = Math.max(0, basePrice - discount);
    const taxRate = getEffectiveTax();
    const taxAmount = (subtotal * taxRate) / 100;

    const selectedAddons = addons.filter((a: any) => selectedAddonIds.includes(a.id));
    const addonsTotal = selectedAddons.reduce((sum: number, a: any) => sum + a.price, 0);
    
    const grandTotal = subtotal + taxAmount + addonsTotal;

    const response: PriceResponse = {
      applied_rule: appliedRule,
      base_price: basePrice,
      discount,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      addons_total: addonsTotal,
      grand_total: grandTotal,
      item_name: item.name,
      pricing_type: item.pricing_type,
    };

    console.log("Price calculated:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calculating price:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
