import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-none chassis-plate p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-1/3 bg-theme-base rounded-none" />
        <div className="h-4 w-16 bg-theme-base rounded-none" />
      </div>
      <div className="h-5 w-3/4 bg-theme-base rounded-none" />
      <div className="h-3 w-full bg-theme-base rounded-none" />
      <div className="h-3 w-2/3 bg-theme-base rounded-none" />
      <div className="pt-3 border-t border-theme-ink/40 flex justify-between">
        <div className="h-4 w-24 bg-theme-base rounded-none" />
        <div className="h-4 w-20 bg-theme-base rounded-none" />
      </div>
    </div>
  );
};

export const FeedSkeleton: React.FC = () => {
  return (
    <div className="rounded-none chassis-plate p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-none bg-theme-base" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-1/3 bg-theme-base rounded-none" />
          <div className="h-3 w-1/4 bg-theme-base rounded-none" />
        </div>
      </div>
      <div className="h-4 w-4/5 bg-theme-base rounded-none" />
      <div className="h-3 w-full bg-theme-base rounded-none" />
    </div>
  );
};

export const GuildCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-none chassis-plate p-5 space-y-4 animate-pulse">
      <div className="h-8 w-8 bg-theme-base rounded-none" />
      <div className="h-4 w-1/2 bg-theme-base rounded-none" />
      <div className="h-3 w-full bg-theme-base rounded-none" />
      <div className="h-3 w-4/5 bg-theme-base rounded-none" />
    </div>
  );
};
