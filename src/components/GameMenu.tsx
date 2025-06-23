import React, { useState } from 'react';
import { Play, Settings, Users, Trophy } from 'lucide-react';

interface GameMenuProps {
  onStartGame: (playerName: string) => void;
  isConnecting: boolean;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onStartGame, isConnecting }) => {
  const [playerName, setPlayerName] = useState('Player' + Math.floor(Math.random() * 1000));

  const handleStartGame = () => {
    if (playerName.trim()) {
      onStartGame(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-white">Battle Royale</h1>
          </div>
          <p className="text-gray-400 text-lg">Last Player Standing Wins</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                Player Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleStartGame}
              disabled={isConnecting || !playerName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Join Battle</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Game Rules</span>
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Up to 16 players in each match</li>
              <li>• Safe zone shrinks over time</li>
              <li>• Collect weapons and ammo to survive</li>
              <li>• Stay inside the safe zone to avoid damage</li>
              <li>• Last player standing wins!</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-white font-semibold mb-2">Controls</h4>
            <div className="text-gray-400 text-sm space-y-1">
              <p>• WASD - Move</p>
              <p>• Mouse - Aim and shoot</p>
              <p>• Walk over items to collect</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};