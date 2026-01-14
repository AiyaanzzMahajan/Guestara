import { MenuItem as MenuItemType } from '@/types/menu';
import { calculatePrice, formatCurrency, getItemParent } from '@/lib/pricing';
import { Clock, Sparkles, TrendingUp } from 'lucide-react';

interface MenuItemProps {
  item: MenuItemType;
  isSelected: boolean;
  onClick: () => void;
}

export function MenuItem({ item, isSelected, onClick }: MenuItemProps) {
  const price = calculatePrice(item);
  const parent = getItemParent(item);

  const getPricingLabel = () => {
    switch (item.pricing_type) {
      case 'static':
        return formatCurrency(price.grand_total);
      case 'tiered':
        return `from ${formatCurrency(item.tiered_pricing?.[0]?.price || 0)}`;
      case 'complimentary':
        return 'Free';
      case 'discounted':
        return (
          <span className="flex items-center gap-2">
            <span className="line-through text-muted-foreground text-sm">
              {formatCurrency(price.base_price)}
            </span>
            <span>{formatCurrency(price.subtotal)}</span>
          </span>
        );
      case 'dynamic':
        return price.base_price > 0 ? formatCurrency(price.grand_total) : 'Check times';
      default:
        return '—';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-5 card-handcrafted hover-lift
        transition-all duration-300 cursor-pointer
        ${isSelected ? 'ring-2 ring-primary/60 bg-primary/5' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {parent && (
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {parent.name}
              </span>
            )}
          </div>

          <h3 className="font-serif text-lg text-foreground mb-1 flex items-center gap-2 flex-wrap">
            {item.name}
            {item.is_bestseller && (
              <span className="badge-organic badge-bestseller flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Popular
              </span>
            )}
            {item.is_new && (
              <span className="badge-organic badge-fresh flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New
              </span>
            )}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <div className="flex items-center gap-3 mt-3">
            {item.is_bookable && (
              <span className="inline-flex items-center gap-1 text-xs text-accent font-medium">
                <Clock className="w-3.5 h-3.5" />
                Bookable
              </span>
            )}
            {item.addons && item.addons.length > 0 && (
              <span className="text-xs text-muted-foreground">
                +{item.addons.length} add-ons
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-serif text-lg text-foreground">
            {getPricingLabel()}
          </div>
          {price.tax_rate > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5">
              +{price.tax_rate}% tax
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
