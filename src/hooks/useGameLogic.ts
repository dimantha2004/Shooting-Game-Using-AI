import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, Controls } from '../types/game';
import { GAME_CONFIG } from '../constants/game';
import { 
  createPlayer, 
  createBullet, 
  updateBullets, 
  checkBulletCollisions, 
  updateSafeZone, 
  checkSafeZoneDamage,
  spawnItems,
  createBots,
  updateBots
} from '../utils/gameLogic';

export const useGameLogic = (playerId: string | null, playerName: string) => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    players: {},
    bullets: {},
    items: spawnItems(),
    safeZone: {
      x: GAME_CONFIG.MAP_WIDTH / 2,
      y: GAME_CONFIG.MAP_HEIGHT / 2,
      radius: GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS,
      nextRadius: GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS,
      shrinkStartTime: 0,
      shrinkDuration: 30000
    },
    gamePhase: 'waiting',
    matchStartTime: Date.now(),
    winner: null,
    playersAlive: 0
  }));

  const [controls, setControls] = useState<Controls>({
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: false,
    mouseX: 0,
    mouseY: 0
  });

  const [killFeed, setKillFeed] = useState<Array<{
    id: string;
    killer: string;
    victim: string;
    weapon: string;
    timestamp: number;
  }>>([]);

  const lastShotTime = useRef<number>(0);
  const gameLoopRef = useRef<number>();

  // Initialize game with current player and bots
  useEffect(() => {
    if (playerId && playerName && !gameState.players[playerId]) {
      const newPlayer = createPlayer(playerId, playerName);
      const bots = createBots(15); // Create 15 AI bots
      
      setGameState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [playerId]: newPlayer,
          ...bots
        },
        gamePhase: 'playing',
        matchStartTime: Date.now()
      }));
    }
  }, [playerId, playerName, gameState.players]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setControls(prev => ({ ...prev, up: true }));
          break;
        case 's':
          setControls(prev => ({ ...prev, down: true }));
          break;
        case 'a':
          setControls(prev => ({ ...prev, left: true }));
          break;
        case 'd':
          setControls(prev => ({ ...prev, right: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setControls(prev => ({ ...prev, up: false }));
          break;
        case 's':
          setControls(prev => ({ ...prev, down: false }));
          break;
        case 'a':
          setControls(prev => ({ ...prev, left: false }));
          break;
        case 'd':
          setControls(prev => ({ ...prev, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      setGameState(prevState => {
        const newState = { ...prevState };
        
        // Update bots first
        const { updatedPlayers, newBullets } = updateBots(newState.players, newState.safeZone);
        newState.players = updatedPlayers;
        
        // Add bot bullets
        newBullets.forEach(bullet => {
          newState.bullets[bullet.id] = bullet;
        });
        
        // Update players
        Object.values(newState.players).forEach(player => {
          if (!player.isAlive || player.isBot) return;
          
          // Move current player based on controls
          if (player.id === playerId) {
            let newX = player.x;
            let newY = player.y;
            
            if (controls.up) newY -= GAME_CONFIG.PLAYER_SPEED;
            if (controls.down) newY += GAME_CONFIG.PLAYER_SPEED;
            if (controls.left) newX -= GAME_CONFIG.PLAYER_SPEED;
            if (controls.right) newX += GAME_CONFIG.PLAYER_SPEED;
            
            // Keep player within bounds
            newX = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.PLAYER_SIZE, newX));
            newY = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.PLAYER_SIZE, newY));
            
            player.x = newX;
            player.y = newY;
            
            // Update player angle based on mouse
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              player.angle = Math.atan2(controls.mouseY - centerY, controls.mouseX - centerX);
            }
            
            // Handle shooting
            if (controls.shooting) {
              const now = Date.now();
              const weapon = player.weapon;
              const fireRate = weapon === 'assault_rifle' ? 150 : weapon === 'pistol' ? 300 : weapon === 'sniper' ? 1500 : 800;
              
              if (now - lastShotTime.current > fireRate && player.ammo[weapon === 'assault_rifle' ? 'rifle' : weapon] > 0) {
                const worldMouseX = player.x + (controls.mouseX - GAME_CONFIG.CANVAS_WIDTH / 2);
                const worldMouseY = player.y + (controls.mouseY - GAME_CONFIG.CANVAS_HEIGHT / 2);
                
                const bullet = createBullet(player, worldMouseX, worldMouseY);
                newState.bullets[bullet.id] = bullet;
                
                // Consume ammo
                player.ammo[weapon === 'assault_rifle' ? 'rifle' : weapon]--;
                lastShotTime.current = now;
              }
            }
          }
          
          // Check item collection
          Object.values(newState.items).forEach(item => {
            if (item.collected) return;
            
            const distance = Math.sqrt(
              Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.y, 2)
            );
            
            if (distance < GAME_CONFIG.PLAYER_SIZE + 10) {
              item.collected = true;
              
              switch (item.type) {
                case 'weapon':
                  const weapons = ['assault_rifle', 'shotgun', 'sniper', 'pistol'] as const;
                  player.weapon = weapons[Math.floor(Math.random() * weapons.length)];
                  break;
                case 'ammo':
                  const ammoTypes = ['rifle', 'shotgun', 'sniper', 'pistol'] as const;
                  const ammoType = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                  player.ammo[ammoType] += 30;
                  break;
                case 'health':
                  player.health = Math.min(player.maxHealth, player.health + 50);
                  break;
              }
            }
          });
        });
        
        // Update bullets
        newState.bullets = updateBullets(newState.bullets);
        
        // Check bullet collisions
        const collisions = checkBulletCollisions(newState.bullets, newState.players);
        collisions.forEach(collision => {
          const player = newState.players[collision.playerId];
          const shooter = Object.values(newState.players).find(p => 
            Object.values(newState.bullets).some(b => b.id === collision.bulletId && b.ownerId === p.id)
          );
          
          if (player && shooter) {
            player.health -= collision.damage;
            delete newState.bullets[collision.bulletId];
            
            if (player.health <= 0) {
              player.isAlive = false;
              player.health = 0;
              shooter.kills++;
              
              // Add to kill feed
              setKillFeed(prev => [...prev, {
                id: `kill-${Date.now()}`,
                killer: shooter.name,
                victim: player.name,
                weapon: shooter.weapon,
                timestamp: Date.now()
              }]);
            }
          }
        });
        
        // Update safe zone
        newState.safeZone = updateSafeZone(newState.safeZone, newState.matchStartTime);
        
        // Check safe zone damage
        const playersInDanger = checkSafeZoneDamage(newState.players, newState.safeZone);
        playersInDanger.forEach(playerId => {
          const player = newState.players[playerId];
          if (player && player.isAlive) {
            player.health -= GAME_CONFIG.SAFE_ZONE_DAMAGE;
            if (player.health <= 0) {
              player.isAlive = false;
              player.health = 0;
            }
          }
        });
        
        // Count alive players
        newState.playersAlive = Object.values(newState.players).filter(p => p.isAlive).length;
        
        // Check win condition
        const alivePlayers = Object.values(newState.players).filter(p => p.isAlive);
        if (alivePlayers.length <= 1 && Object.keys(newState.players).length > 1) {
          if (alivePlayers.length === 1) {
            newState.winner = alivePlayers[0].id;
          }
          newState.gamePhase = 'ended';
        }
        
        return newState;
      });
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    if (gameState.gamePhase === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [playerId, controls, gameState.gamePhase]);

  const handleControlsChange = useCallback((newControls: Partial<Controls>) => {
    setControls(prev => ({ ...prev, ...newControls }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      players: {},
      bullets: {},
      items: spawnItems(),
      safeZone: {
        x: GAME_CONFIG.MAP_WIDTH / 2,
        y: GAME_CONFIG.MAP_HEIGHT / 2,
        radius: GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS,
        nextRadius: GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS,
        shrinkStartTime: 0,
        shrinkDuration: 30000
      },
      gamePhase: 'waiting',
      matchStartTime: Date.now(),
      winner: null,
      playersAlive: 0
    });
    setKillFeed([]);
    lastShotTime.current = 0;
  }, []);

  return {
    gameState,
    controls,
    killFeed,
    handleControlsChange,
    resetGame
  };
};