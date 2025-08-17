import React from "react";

export default function CategoryFilter({ categories, selectedCategory, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
      <select
        className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 transition-colors"
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
