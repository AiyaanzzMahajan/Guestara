import { useState, useMemo } from 'react';
import { useMenuItems, useCategories, useSubcategories } from '@/hooks/useMenu';
import { MenuItem } from '@/components/MenuItem';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { CategoryFilter } from '@/components/CategoryFilter';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MenuItem as MenuItemType } from '@/types/menu';
import { Search, X } from 'lucide-react';

export default function Index() {
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: menuItems = [], isLoading: itemsLoading } = useMenuItems();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: subcategories = [] } = useSubcategories();

  const filteredItems = useMemo(() => {
    let items = menuItems.filter(item => item.is_active);

    if (selectedCategory) {
      items = items.filter(item => {
        if (item.category_id === selectedCategory) return true;
        if (item.subcategory_id) {
          const sub = subcategories.find(s => s.id === item.subcategory_id);
          return sub?.category_id === selectedCategory;
        }
        return false;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [menuItems, subcategories, selectedCategory, searchQuery]);

  const isLoading = itemsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-serif text-primary text-lg font-semibold">
                G
              </div>
              <div>
                <h1 className="font-serif text-xl">Guestara</h1>
                <p className="text-xs text-muted-foreground">Menu & Services</p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Open today</p>
              <p className="text-sm font-medium">7:00 AM – 9:00 PM</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 animate-fade-up">
          <h2 className="font-serif text-3xl sm:text-4xl text-gradient-warm mb-2">
            What sounds good?
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Our menu changes with the seasons. Prices include service — no hidden fees, no tips needed.
          </p>
        </div>

        <div className="space-y-4 mb-8 animate-fade-up-delay-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search the menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-warm w-full pl-12 bg-card"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4 animate-fade-up-delay-2">
            {isLoading ? (
              <LoadingSpinner />
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nothing here yet. Try a different filter?
                </p>
              </div>
            ) : (
              filteredItems.map(item => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onClick={() => setSelectedItem(item)}
                />
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {selectedItem ? (
                <PriceBreakdown item={selectedItem} />
              ) : (
                <EmptyState
                  title="Pick something"
                  description="Tap any item to see pricing details, add-ons, and more."
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 text-center animate-fade-up">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tax is calculated based on item type. Bookable items require advance reservation.
            Add-ons are optional unless marked otherwise.
          </p>
        </div>
      </main>
    </div>
  );
}
