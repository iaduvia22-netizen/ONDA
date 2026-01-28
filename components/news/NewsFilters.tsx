'use client';

import { Search, Filter } from 'lucide-react';
import { NEWS_CATEGORIES } from '@/lib/api/types';

interface FiltersProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

export function NewsFilters({ onSearch, onCategoryChange, selectedCategory }: FiltersProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="text-text-muted absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar noticias..."
            className="bg-surface border-border focus:border-primary w-full rounded-xl border py-3 pr-4 pl-10 text-white transition-colors focus:outline-none"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button className="bg-surface border-border text-text-muted hover:border-primary rounded-xl border px-4 py-2 transition-colors hover:text-white">
          <Filter className="h-5 w-5" />
        </button>
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onCategoryChange('')}
          className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === ''
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:bg-surface-hover hover:text-white'
          }`}
        >
          Todas
        </button>
        {NEWS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:bg-surface-hover hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
