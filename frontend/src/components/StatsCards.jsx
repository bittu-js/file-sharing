import React from 'react';
import { Files, HardDrive, Share2, DownloadCloud } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Files',
      value: stats?.totalFiles ?? 0,
      description: 'Active files stored',
      icon: Files
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats?.totalStorageBytes || 0),
      description: 'Physical disk space',
      icon: HardDrive
    },
    {
      title: 'Active Shares',
      value: stats?.totalShares ?? 0,
      description: 'Public & secure links',
      icon: Share2
    },
    {
      title: 'Total Downloads',
      value: stats?.totalDownloads ?? 0,
      description: 'Across all files & shares',
      icon: DownloadCloud
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-xs p-4 flex flex-col justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
                {card.title}
              </span>
              <div className="w-7 h-7 rounded-xs bg-subtle-light dark:bg-subtle-dark flex items-center justify-center text-tertiary-light dark:text-tertiary-dark">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold font-mono tracking-tight text-primary-light dark:text-primary-dark">
                {card.value}
              </span>
              <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark mt-0.5 font-mono">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
