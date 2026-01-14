import { useState } from 'react';
import { MenuItem as MenuItemType, Addon } from '@/types/menu';
import { calculatePrice, formatCurrency, getItemParent } from '@/lib/pricing';
import { Check, Clock, Minus, Plus, Info } from 'lucide-react';

interface PriceBreakdownProps {
  item: MenuItemType;
}

export function PriceBreakdown({ item }: PriceBreakdownProps) {
  const [hours, setHours] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);

  const price = calculatePrice(item, { hours, selectedAddons });
  const parent = getItemParent(item);

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  return (
    <div className="card-handcrafted p-6 animate-fade-up">
      <div className="mb-6">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {parent?.name || 'Menu Item'}
        </span>
        <h2 className="font-serif text-2xl mt-1 text-gradient-warm">
          {item.name}
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="divider-organic mb-6" />

      {item.pricing_type === 'tiered' && item.tiered_pricing && (
        <div className="mb-6 animate-fade-up-delay-1">
          <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            How long do you need it?
          </label>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setHours(Math.max(1, hours - 1))}
              className="btn-ghost-warm p-2"
              disabled={hours <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-serif text-xl w-20 text-center">
              {hours} hr{hours > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setHours(hours + 1)}
              className="btn-ghost-warm p-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {item.tiered_pricing.map(tier => (
              <button
                key={tier.up_to_hours}
                onClick={() => setHours(tier.up_to_hours)}
                className={`
                  p-3 rounded-xl text-left transition-all duration-200
                  ${hours === tier.up_to_hours
                    ? 'bg-primary/10 border-2 border-primary/40'
                    : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'}
                `}
              >
                <div className="text-sm font-medium">Up to {tier.up_to_hours}h</div>
                <div className="font-serif text-lg">{formatCurrency(tier.price)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {item.pricing_type === 'dynamic' && item.dynamic_pricing && (
        <div className="mb-6 p-4 bg-muted/30 rounded-xl animate-fade-up-delay-1">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-2">Time-based pricing</h4>
              {item.dynamic_pricing.map((window, i) => (
                <div key={i} className="text-sm text-muted-foreground">
                  {window.start_time}–{window.end_time}: {formatCurrency(window.price)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {item.addons && item.addons.length > 0 && (
        <div className="mb-6 animate-fade-up-delay-2">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Make it yours
          </h4>
          <div className="space-y-2">
            {item.addons.map(addon => {
              const isSelected = selectedAddons.find(a => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl
                    transition-all duration-200 text-left
                    ${isSelected
                      ? 'bg-primary/10 border-2 border-primary/40'
                      : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-5 h-5 rounded-md flex items-center justify-center
                      transition-colors duration-200
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm">{addon.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    +{formatCurrency(addon.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="divider-organic mb-6" />

      <div className="space-y-3 animate-fade-up-delay-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base price</span>
          <span>{formatCurrency(price.base_price)}</span>
        </div>

        {price.discount > 0 && (
          <div className="flex justify-between text-sm text-accent">
            <span>Discount ({price.applied_rule})</span>
            <span>-{formatCurrency(price.discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(price.subtotal)}</span>
        </div>

        {price.tax_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax ({price.tax_rate}%)</span>
            <span>{formatCurrency(price.tax_amount)}</span>
          </div>
        )}

        {price.addons_total > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Add-ons</span>
            <span>{formatCurrency(price.addons_total)}</span>
          </div>
        )}

        <div className="divider-organic my-4" />

        <div className="flex justify-between items-baseline">
          <span className="font-medium">Total</span>
          <span className="font-serif text-2xl text-gradient-warm">
            {formatCurrency(price.grand_total)}
          </span>
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          {price.applied_rule}
        </div>
      </div>

      {item.pricing_type !== 'complimentary' && (
        <button className="btn-primary-warm w-full mt-6">
          {item.is_bookable ? 'Book Now' : 'Add to Order'}
        </button>
      )}
    </div>
  );
}
