import React from 'react';
import { Player, GameState } from '../types/game';
import { WEAPON_STATS } from '../constants/weapons';
import { Heart, Crosshair, Users, Clock, Target } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  currentPlayer: Player | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, currentPlayer }) => {
  if (!currentPlayer) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMatchDuration = () => {
    if (gameState.gamePhase === 'waiting') return '0:00';
    const elapsed = Date.now() - gameState.matchStartTime;
    return formatTime(elapsed);
  };

  const weaponStats = WEAPON_STATS[currentPlayer.weapon];
  const currentAmmo = currentPlayer.ammo[weaponStats.ammoType];

  return (
    <div className="absolute top-4 left-4 z-10 space-y-4">
      {/* Player Health */}
      <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-3">
          <Heart className="w-6 h-6 text-red-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white font-semibold">Health</span>
              <span className="text-white text-sm">{currentPlayer.health}/100</span>
            </div>
            <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  currentPlayer.health > 30 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${currentPlayer.health}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weapon & Ammo */}
      <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-3">
          <Crosshair className="w-6 h-6 text-blue-500" />
          <div>
            <div className="text-white font-semibold capitalize">
              {currentPlayer.weapon.replace('_', ' ')}
            </div>
            <div className="text-gray-300 text-sm">
              Ammo: {currentAmmo} | Damage: {weaponStats.damage}
            </div>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="text-white font-semibold">{gameState.playersAlive}</div>
              <div className="text-gray-400 text-xs">Alive</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-white font-semibold">{currentPlayer.kills}</div>
              <div className="text-gray-400 text-xs">Kills</div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Time */}
      <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-white font-semibold">{getMatchDuration()}</div>
            <div className="text-gray-400 text-xs">Match Time</div>
          </div>
        </div>
      </div>

      {/* Safe Zone Timer */}
      <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 border border-gray-700">
        <div className="text-center">
          <div className="text-orange-500 font-semibold text-sm mb-1">Safe Zone</div>
          <div className="text-white text-lg font-bold">
            {Math.round(gameState.safeZone.radius)}m
          </div>
          <div className="text-gray-400 text-xs">Radius</div>
        </div>
      </div>
    </div>
  );
};