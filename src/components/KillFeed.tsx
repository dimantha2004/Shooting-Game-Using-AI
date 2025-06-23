import React from 'react';
import { Skull } from 'lucide-react';

interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  timestamp: number;
}

interface KillFeedProps {
  kills: KillFeedEntry[];
}

export const KillFeed: React.FC<KillFeedProps> = ({ kills }) => {
  const recentKills = kills.slice(-5); // Show last 5 kills

  return (
    <div className="absolute top-4 right-4 z-10 space-y-2">
      {recentKills.map((kill) => (
        <div
          key={kill.id}
          className="bg-gray-900 bg-opacity-90 rounded-lg px-4 py-2 border border-gray-700 min-w-64"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-400 font-semibold">{kill.killer}</span>
            <div className="flex items-center space-x-2">
              <Skull className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 capitalize">{kill.weapon.replace('_', ' ')}</span>
            </div>
            <span className="text-blue-400 font-semibold">{kill.victim}</span>
          </div>
        </div>
      ))}
    </div>
  );
};