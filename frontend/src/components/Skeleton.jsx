import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 background-animate rounded-lg ${className}`}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 6, cols = 6, className = '' }) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4 animate-pulse">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-200/80 rounded-md"
                style={{
                  width: cIdx === 0 ? '15%' : cIdx === 1 ? '30%' : cIdx === 2 ? '20%' : '12%',
                  opacity: 1 - (rIdx * 0.08),
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-slate-200 rounded w-24"></div>
            <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-7 bg-slate-200 rounded w-36 mt-2"></div>
          <div className="h-3 bg-slate-100 rounded w-48 mt-1"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className={`w-full ${height} bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-pulse flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-40"></div>
          <div className="h-3 bg-slate-100 rounded w-60"></div>
        </div>
        <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
      </div>
      <div className="flex items-end justify-between gap-2 h-40 pt-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full bg-slate-200 rounded-t-lg"
            style={{ height: `${20 + ((idx * 27) % 75)}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between pt-3 border-t border-slate-100">
        <div className="h-3 bg-slate-200 rounded w-16"></div>
        <div className="h-3 bg-slate-200 rounded w-16"></div>
        <div className="h-3 bg-slate-200 rounded w-16"></div>
        <div className="h-3 bg-slate-200 rounded w-16"></div>
      </div>
    </div>
  );
}

export default Skeleton;
