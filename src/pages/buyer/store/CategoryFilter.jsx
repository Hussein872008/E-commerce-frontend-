import React from "react";
import { useSelector } from 'react-redux';

export default function CategoryFilter({ categories, selectedCategory, onChange }) {
  const isDark = useSelector(state => state.theme?.darkMode);
  const labelClass = isDark ? 'block text-sm font-medium text-gray-200 mb-1' : 'block text-sm font-medium text-gray-700 mb-1';
  const selectClass = `w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 transition-colors ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white text-gray-800'} `;

  return (
    <div>
      <label htmlFor="category-filter" className={labelClass}>Category</label>
      <select
        id="category-filter"
        name="category"
        className={selectClass}
        value={selectedCategory}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {Array.isArray(categories) && categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
