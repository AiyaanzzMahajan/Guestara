import type { Category } from '@/types/menu';

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const activeCategories = categories.filter(c => c.is_active);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`
          shrink-0 px-4 py-2 rounded-full text-sm font-medium
          transition-all duration-200
          ${selected === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted'}
        `}
      >
        All items
      </button>
      {activeCategories.map(category => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`
            shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${selected === category.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'}
          `}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
