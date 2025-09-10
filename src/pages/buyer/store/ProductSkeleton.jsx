
import React from "react";
import { useSelector } from "react-redux";

export default function ProductSkeleton() {
  const darkMode = useSelector((state) => state.theme.darkMode);

  const bgCard = darkMode ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900" : "bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100";
  const bgSkeleton = darkMode ? "bg-indigo-800/60" : "bg-indigo-200/60";
  return (
    <div className={`${bgCard} rounded-xl shadow-md overflow-hidden animate-pulse`}>
      <div className={`w-full h-48 ${bgSkeleton}`}></div>
      <div className="p-4">
        <div className={`h-6 ${bgSkeleton} rounded w-3/4 mb-2`}></div>
        <div className={`h-4 ${bgSkeleton} rounded w-full mb-1`}></div>
        <div className={`h-4 ${bgSkeleton} rounded w-5/6 mb-4`}></div>
        <div className="flex justify-between items-center">
          <div className={`h-6 ${bgSkeleton} rounded w-1/3`}></div>
          <div className={`h-8 w-8 ${bgSkeleton} rounded-full`}></div>
        </div>
      </div>
    </div>
  );
}
