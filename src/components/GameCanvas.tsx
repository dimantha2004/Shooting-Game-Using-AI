import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Player, Controls } from '../types/game';
import { GAME_CONFIG, COLORS } from '../constants/game';
import { WEAPON_COLORS } from '../constants/weapons';

interface GameCanvasProps {
  gameState: GameState;
  playerId: string | null;
  controls: Controls;
  onControlsChange: (controls: Partial<Controls>) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  playerId,
  controls,
  onControlsChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player, isCurrentPlayer: boolean, camera: {x: number, y: number}) => {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;
    
    // Player circle
    ctx.fillStyle = player.isAlive ? player.color : COLORS.PLAYER_DEAD;
    ctx.beginPath();
    ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction indicator
    if (player.isAlive) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(
        screenX + Math.cos(player.angle) * GAME_CONFIG.PLAYER_SIZE * 1.5,
        screenY + Math.sin(player.angle) * GAME_CONFIG.PLAYER_SIZE * 1.5
      );
      ctx.stroke();
    }
    
    // Player name with bot indicator
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const displayName = player.isBot ? `🤖 ${player.name}` : player.name;
    ctx.fillText(displayName, screenX, screenY - GAME_CONFIG.PLAYER_SIZE - 5);
    
    // Health bar
    if (player.isAlive && player.health < player.maxHealth) {
      const barWidth = GAME_CONFIG.PLAYER_SIZE * 2;
      const barHeight = 4;
      const barX = screenX - barWidth / 2;
      const barY = screenY + GAME_CONFIG.PLAYER_SIZE + 5;
      
      ctx.fillStyle = COLORS.HEALTH_BAR_BACKGROUND;
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      const healthPercent = player.health / player.maxHealth;
      ctx.fillStyle = healthPercent > 0.3 ? COLORS.HEALTH_BAR_FILL : COLORS.HEALTH_BAR_LOW;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
  }, []);

  const drawBullets = useCallback((ctx: CanvasRenderingContext2D, camera: {x: number, y: number}) => {
    Object.values(gameState.bullets).forEach(bullet => {
      const screenX = bullet.x - camera.x;
      const screenY = bullet.y - camera.y;
      
      ctx.fillStyle = WEAPON_COLORS[bullet.weapon];
      ctx.beginPath();
      ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [gameState.bullets]);

  const drawSafeZone = useCallback((ctx: CanvasRenderingContext2D, camera: {x: number, y: number}) => {
    const { safeZone } = gameState;
    const screenX = safeZone.x - camera.x;
    const screenY = safeZone.y - camera.y;
    
    // Safe zone circle
    ctx.strokeStyle = COLORS.SAFE_ZONE_BORDER;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(screenX, screenY, safeZone.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Danger zone (outside safe zone)
    ctx.fillStyle = COLORS.DANGER_ZONE;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // Cut out safe zone
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(screenX, screenY, safeZone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, [gameState.safeZone]);

  const drawItems = useCallback((ctx: CanvasRenderingContext2D, camera: {x: number, y: number}) => {
    Object.values(gameState.items).forEach(item => {
      if (item.collected) return;
      
      const screenX = item.x - camera.x;
      const screenY = item.y - camera.y;
      
      // Item colors based on type
      const colors = {
        weapon: '#4CAF50',
        ammo: '#FF9800',
        health: '#F44336',
        grenade: '#9C27B0'
      };
      
      ctx.fillStyle = colors[item.type];
      ctx.beginPath();
      ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Item type indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.type[0].toUpperCase(), screenX, screenY + 3);
    });
  }, [gameState.items]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // Calculate camera position (follow current player)
    let camera = { x: GAME_CONFIG.MAP_WIDTH / 2 - GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.MAP_HEIGHT / 2 - GAME_CONFIG.CANVAS_HEIGHT / 2 };
    
    if (playerId && gameState.players[playerId]) {
      const player = gameState.players[playerId];
      camera.x = player.x - GAME_CONFIG.CANVAS_WIDTH / 2;
      camera.y = player.y - GAME_CONFIG.CANVAS_HEIGHT / 2;
      
      // Keep camera within bounds
      camera.x = Math.max(0, Math.min(GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.CANVAS_WIDTH, camera.x));
      camera.y = Math.max(0, Math.min(GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.CANVAS_HEIGHT, camera.y));
    }
    
    // Draw game elements
    drawSafeZone(ctx, camera);
    drawItems(ctx, camera);
    drawBullets(ctx, camera);
    
    // Draw players
    Object.values(gameState.players).forEach(player => {
      drawPlayer(ctx, player, player.id === playerId, camera);
    });
    
    // Draw minimap
    const minimapSize = 150;
    const minimapX = GAME_CONFIG.CANVAS_WIDTH - minimapSize - 20;
    const minimapY = 20;
    
    // Minimap background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Minimap border
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Minimap safe zone
    const safeZoneX = minimapX + (gameState.safeZone.x / GAME_CONFIG.MAP_WIDTH) * minimapSize;
    const safeZoneY = minimapY + (gameState.safeZone.y / GAME_CONFIG.MAP_HEIGHT) * minimapSize;
    const safeZoneRadius = (gameState.safeZone.radius / GAME_CONFIG.MAP_WIDTH) * minimapSize;
    
    ctx.strokeStyle = COLORS.SAFE_ZONE_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(safeZoneX, safeZoneY, safeZoneRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Minimap players
    Object.values(gameState.players).forEach(player => {
      if (!player.isAlive) return;
      
      const playerX = minimapX + (player.x / GAME_CONFIG.MAP_WIDTH) * minimapSize;
      const playerY = minimapY + (player.y / GAME_CONFIG.MAP_HEIGHT) * minimapSize;
      
      if (player.id === playerId) {
        // Current player - white with border
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (player.isBot) {
        // Bots - smaller red dots
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Other players - blue
        ctx.fillStyle = '#4444ff';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [gameState, playerId, drawPlayer, drawBullets, drawSafeZone, drawItems]);

  useEffect(() => {
    render();
  }, [render]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    onControlsChange({ mouseX, mouseY });
  }, [onControlsChange]);

  const handleMouseDown = useCallback(() => {
    onControlsChange({ shooting: true });
  }, [onControlsChange]);

  const handleMouseUp = useCallback(() => {
    onControlsChange({ shooting: false });
  }, [onControlsChange]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.CANVAS_WIDTH}
      height={GAME_CONFIG.CANVAS_HEIGHT}
      className="border-2 border-gray-700 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
};