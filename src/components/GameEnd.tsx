import React from 'react';
import { Trophy, Skull, RotateCcw, Users } from 'lucide-react';
import { Player } from '../types/game';

interface GameEndProps {
  winner: Player | null;
  currentPlayer: Player | null;
  totalPlayers: number;
  onPlayAgain: () => void;
}

export const GameEnd: React.FC<GameEndProps> = ({ winner, currentPlayer, totalPlayers, onPlayAgain }) => {
  const isWinner = winner?.id === currentPlayer?.id;
  const isCurrentPlayerAlive = currentPlayer?.isAlive;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* Winner Trophy */}
          <div className="flex justify-center mb-6">
            {isWinner ? (
              <Trophy className="w-16 h-16 text-yellow-500" />
            ) : (
              <Skull className="w-16 h-16 text-red-500" />
            )}
          </div>

          {/* Game Result */}
          <h2 className="text-3xl font-bold text-white mb-4">
            {isWinner ? 'Victory!' : 'Game Over'}
          </h2>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-lg text-gray-300 mb-2">
              {winner ? (
                <>
                  <span className="text-yellow-400 font-semibold">{winner.name}</span> won the match!
                </>
              ) : (
                'No winner this round'
              )}
            </div>
            
            {currentPlayer && (
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Your Kills:</span>
                  <span className="text-white font-semibold">{currentPlayer.kills}</span>
                </div>
                <div className="flex justify-between">
                  <span>Players:</span>
                  <span className="text-white font-semibold">{totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold ${isCurrentPlayerAlive ? 'text-green-400' : 'text-red-400'}`}>
                    {isCurrentPlayerAlive ? 'Survived' : 'Eliminated'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Performance Summary */}
          {currentPlayer && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-2 flex items-center justify-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Match Summary</span>
              </h3>
              <div className="text-gray-300 text-sm">
                {isWinner && (
                  <div className="text-yellow-400 font-semibold mb-1">
                    🏆 Winner Winner Chicken Dinner!
                  </div>
                )}
                {currentPlayer.kills > 0 && (
                  <div className="text-green-400">
                    🎯 Eliminated {currentPlayer.kills} player{currentPlayer.kills !== 1 ? 's' : ''}
                  </div>
                )}
                {!isCurrentPlayerAlive && (
                  <div className="text-red-400">
                    💀 You were eliminated
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Play Again Button */}
          <button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};