import React from 'react';
import { SCHEME_CATEGORIES } from '../data/schemesData';
import { SchemeCategory } from '../types';

interface CategoryBarProps {
  selectedCategory: SchemeCategory | 'all';
  onSelectCategory: (cat: SchemeCategory | 'all') => void;
  highContrast: boolean;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  highContrast,
}) => {
  return (
    <div
      role="tablist"
      aria-label="திட்ட பிரிவுகள்"
      className={`border-b transition-colors py-2 px-4 overflow-x-auto no-scrollbar ${
        highContrast ? 'bg-zinc-950 border-zinc-800' : 'bg-rose-50/40 border-rose-100'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center gap-1.5 min-w-max">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 ${
            selectedCategory === 'all'
              ? highContrast
                ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                : 'bg-rose-600 text-white shadow-xs'
              : highContrast
              ? 'bg-zinc-800 text-amber-200 border border-zinc-700 hover:bg-zinc-700'
              : 'bg-white text-slate-700 border border-rose-200 hover:bg-rose-50 hover:text-rose-800'
          }`}
        >
          <span>🌟</span>
          <span>அனைத்தும்</span>
        </button>

        {SCHEME_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isSelected
                  ? highContrast
                    ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                    : 'bg-rose-600 text-white shadow-xs font-bold'
                  : highContrast
                  ? 'bg-zinc-800 text-amber-200 border border-zinc-700 hover:bg-zinc-700'
                  : 'bg-white text-slate-700 border border-rose-200 hover:bg-rose-50 hover:text-rose-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.nameTa.replace(/^[^\s]+\s*/, '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
