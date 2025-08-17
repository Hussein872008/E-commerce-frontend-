import React from "react";
import { FiStar } from "react-icons/fi";

export default function RatingFilter({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className="w-6 h-6 focus:outline-none transition-transform hover:scale-110"
            onClick={() => onChange(value === rating ? 0 : rating)}
            aria-label={`${rating} stars or higher`}
          >
            <FiStar
              className={`w-6 h-6 ${rating <= value ? "text-yellow-500 fill-current" : "text-gray-300"}`}
            />
          </button>
        ))}
        {value > 0 && (
          <button
            type="button"
            className="ml-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => onChange(0)}
            aria-label="Clear rating filter"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {value > 0 ? `${value}+ stars` : "Any rating"}
      </div>
    </div>
  );
}
