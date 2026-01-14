import type { MenuItem, Addon, PriceBreakdown, Category, Subcategory } from '@/types/menu';

function getEffectiveTax(item: MenuItem): number {
  if (item.tax_applicable !== null && item.tax_percentage !== null) {
    return item.tax_applicable ? (item.tax_percentage || 0) : 0;
  }

  if (item.subcategory) {
    if (item.subcategory.tax_applicable !== null && item.subcategory.tax_percentage !== null) {
      return item.subcategory.tax_applicable ? (item.subcategory.tax_percentage || 0) : 0;
    }
    if (item.category && item.category.tax_applicable && item.category.tax_percentage) {
      return item.category.tax_percentage;
    }
  }

  if (item.category && item.category.tax_applicable && item.category.tax_percentage) {
    return item.category.tax_percentage;
  }

  return 0;
}

function getCurrentTimePrice(item: MenuItem): { price: number; rule: string } | null {
  if (item.pricing_type !== 'dynamic' || !item.dynamic_pricing) {
    return null;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  for (const window of item.dynamic_pricing) {
    if (currentTime >= window.start_time && currentTime < window.end_time) {
      return {
        price: window.price,
        rule: `Time-based: ${window.start_time}–${window.end_time}`,
      };
    }
  }

  return null;
}

function getTieredPrice(item: MenuItem, hours: number = 1): { price: number; rule: string } {
  if (item.pricing_type !== 'tiered' || !item.tiered_pricing) {
    return { price: 0, rule: 'No tiered pricing' };
  }

  const sortedTiers = [...item.tiered_pricing].sort((a, b) => a.up_to_hours - b.up_to_hours);

  for (const tier of sortedTiers) {
    if (hours <= tier.up_to_hours) {
      return {
        price: tier.price,
        rule: `Up to ${tier.up_to_hours} hour${tier.up_to_hours > 1 ? 's' : ''}`,
      };
    }
  }

  const highestTier = sortedTiers[sortedTiers.length - 1];
  return {
    price: highestTier.price,
    rule: `${highestTier.up_to_hours}+ hours (max tier)`,
  };
}

export function calculatePrice(
  item: MenuItem,
  options: {
    hours?: number;
    selectedAddons?: Addon[];
  } = {}
): PriceBreakdown {
  const { hours = 1, selectedAddons = [] } = options;

  let basePrice = 0;
  let discount = 0;
  let appliedRule = '';

  switch (item.pricing_type) {
    case 'static':
      basePrice = item.static_price || 0;
      appliedRule = 'Fixed price';
      break;

    case 'tiered': {
      const tiered = getTieredPrice(item, hours);
      basePrice = tiered.price;
      appliedRule = tiered.rule;
      break;
    }

    case 'complimentary':
      basePrice = 0;
      appliedRule = 'Complimentary';
      break;

    case 'discounted':
      if (item.discount_pricing) {
        basePrice = item.discount_pricing.base_price;
        if (item.discount_pricing.discount_type === 'flat') {
          discount = item.discount_pricing.discount_value;
          appliedRule = `₹${item.discount_pricing.discount_value} off`;
        } else {
          discount = (basePrice * item.discount_pricing.discount_value) / 100;
          appliedRule = `${item.discount_pricing.discount_value}% off`;
        }
      }
      break;

    case 'dynamic': {
      const dynamicPrice = getCurrentTimePrice(item);
      if (dynamicPrice) {
        basePrice = dynamicPrice.price;
        appliedRule = dynamicPrice.rule;
      } else {
        appliedRule = 'Currently unavailable';
      }
      break;
    }
  }

  const subtotal = Math.max(0, basePrice - discount);
  const taxRate = getEffectiveTax(item);
  const taxAmount = (subtotal * taxRate) / 100;
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const grandTotal = subtotal + taxAmount + addonsTotal;

  return {
    applied_rule: appliedRule,
    base_price: basePrice,
    discount,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    addons_total: addonsTotal,
    grand_total: grandTotal,
  };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getItemParent(item: MenuItem): { type: 'category' | 'subcategory'; name: string } | null {
  if (item.subcategory) {
    return { type: 'subcategory', name: item.subcategory.name };
  }
  if (item.category) {
    return { type: 'category', name: item.category.name };
  }
  return null;
}
