import React, { useState } from 'react';
import { GameMenu } from './components/GameMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { KillFeed } from './components/KillFeed';
import { GameEnd } from './components/GameEnd';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const { gameState, controls, killFeed, handleControlsChange, resetGame } = useGameLogic(playerId, playerName);

  const handleStartGame = async (name: string) => {
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPlayerId = `player-${Date.now()}-${Math.random()}`;
    setPlayerId(newPlayerId);
    setPlayerName(name);
    setIsConnecting(false);
  };

  const handlePlayAgain = () => {
    resetGame();
    setPlayerId(null);
    setPlayerName('');
  };

  if (!playerId) {
    return <GameMenu onStartGame={handleStartGame} isConnecting={isConnecting} />;
  }

  const currentPlayer = gameState.players[playerId] || null;
  const winner = gameState.winner ? gameState.players[gameState.winner] : null;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="relative">
        <GameCanvas
          gameState={gameState}
          playerId={playerId}
          controls={controls}
          onControlsChange={handleControlsChange}
        />
        
        <GameHUD gameState={gameState} currentPlayer={currentPlayer} />
        
        <KillFeed kills={killFeed} />
        
        {gameState.gamePhase === 'ended' && (
          <GameEnd
            winner={winner}
            currentPlayer={currentPlayer}
            totalPlayers={Object.keys(gameState.players).length}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  );
}

export default App;