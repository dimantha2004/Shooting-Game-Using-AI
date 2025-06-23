import { Player, Bullet, SafeZone, GameState, InventoryItem } from '../types/game';
import { GAME_CONFIG, COLORS } from '../constants/game';
import { WEAPON_STATS } from '../constants/weapons';

export const createPlayer = (id: string, name: string, isBot: boolean = false): Player => {
  const spawnX = Math.random() * (GAME_CONFIG.MAP_WIDTH - 200) + 100;
  const spawnY = Math.random() * (GAME_CONFIG.MAP_HEIGHT - 200) + 100;
  
  return {
    id,
    name,
    x: spawnX,
    y: spawnY,
    health: 100,
    maxHealth: 100,
    angle: 0,
    weapon: 'pistol',
    ammo: {
      rifle: isBot ? 100 : 0,
      shotgun: isBot ? 50 : 0,
      sniper: isBot ? 30 : 0,
      pistol: 50
    },
    inventory: [],
    kills: 0,
    isAlive: true,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    isBot
  };
};

export const createBullet = (player: Player, targetX: number, targetY: number): Bullet => {
  const weapon = WEAPON_STATS[player.weapon];
  const angle = Math.atan2(targetY - player.y, targetX - player.x);
  const speed = GAME_CONFIG.BULLET_SPEED;
  
  return {
    id: `${player.id}-${Date.now()}-${Math.random()}`,
    x: player.x,
    y: player.y,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    damage: weapon.damage,
    ownerId: player.id,
    weapon: player.weapon
  };
};

export const updateBots = (players: Record<string, Player>, safeZone: SafeZone): { updatedPlayers: Record<string, Player>, newBullets: Bullet[] } => {
  const updatedPlayers = { ...players };
  const newBullets: Bullet[] = [];
  
  Object.values(updatedPlayers).forEach(bot => {
    if (!bot.isBot || !bot.isAlive) return;
    
    // Bot AI behavior
    const nearbyPlayers = Object.values(updatedPlayers).filter(p => 
      p.id !== bot.id && p.isAlive && !p.isBot &&
      Math.sqrt(Math.pow(p.x - bot.x, 2) + Math.pow(p.y - bot.y, 2)) < 200
    );
    
    // Move towards safe zone if outside
    const distanceToSafeZone = Math.sqrt(
      Math.pow(bot.x - safeZone.x, 2) + Math.pow(bot.y - safeZone.y, 2)
    );
    
    if (distanceToSafeZone > safeZone.radius - 50) {
      // Move towards safe zone center
      const angleToSafeZone = Math.atan2(safeZone.y - bot.y, safeZone.x - bot.x);
      bot.x += Math.cos(angleToSafeZone) * GAME_CONFIG.PLAYER_SPEED * 0.8;
      bot.y += Math.sin(angleToSafeZone) * GAME_CONFIG.PLAYER_SPEED * 0.8;
    } else if (nearbyPlayers.length > 0) {
      // Combat behavior - target nearest player
      const target = nearbyPlayers[0];
      const angleToTarget = Math.atan2(target.y - bot.y, target.x - bot.x);
      bot.angle = angleToTarget;
      
      // Move towards target
      bot.x += Math.cos(angleToTarget) * GAME_CONFIG.PLAYER_SPEED * 0.5;
      bot.y += Math.sin(angleToTarget) * GAME_CONFIG.PLAYER_SPEED * 0.5;
      
      // Shoot at target (with some randomness)
      if (Math.random() < 0.1 && bot.ammo[bot.weapon === 'assault_rifle' ? 'rifle' : bot.weapon] > 0) {
        const bullet = createBullet(bot, target.x, target.y);
        newBullets.push(bullet);
        bot.ammo[bot.weapon === 'assault_rifle' ? 'rifle' : bot.weapon]--;
      }
    } else {
      // Random movement
      if (Math.random() < 0.05) {
        bot.angle = Math.random() * Math.PI * 2;
      }
      bot.x += Math.cos(bot.angle) * GAME_CONFIG.PLAYER_SPEED * 0.3;
      bot.y += Math.sin(bot.angle) * GAME_CONFIG.PLAYER_SPEED * 0.3;
    }
    
    // Keep bots within bounds
    bot.x = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.PLAYER_SIZE, bot.x));
    bot.y = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.PLAYER_SIZE, bot.y));
    
    // Randomly upgrade weapons
    if (Math.random() < 0.001) {
      const weapons = ['assault_rifle', 'shotgun', 'sniper', 'pistol'] as const;
      bot.weapon = weapons[Math.floor(Math.random() * weapons.length)];
    }
  });
  
  return { updatedPlayers, newBullets };
};

export const updateBullets = (bullets: Record<string, Bullet>): Record<string, Bullet> => {
  const updatedBullets: Record<string, Bullet> = {};
  
  Object.values(bullets).forEach(bullet => {
    bullet.x += bullet.velocityX;
    bullet.y += bullet.velocityY;
    
    // Remove bullets that are out of bounds
    if (bullet.x > 0 && bullet.x < GAME_CONFIG.MAP_WIDTH && 
        bullet.y > 0 && bullet.y < GAME_CONFIG.MAP_HEIGHT) {
      updatedBullets[bullet.id] = bullet;
    }
  });
  
  return updatedBullets;
};

export const checkBulletCollisions = (bullets: Record<string, Bullet>, players: Record<string, Player>) => {
  const collisions: Array<{bulletId: string, playerId: string, damage: number}> = [];
  
  Object.values(bullets).forEach(bullet => {
    Object.values(players).forEach(player => {
      if (player.id === bullet.ownerId || !player.isAlive) return;
      
      const distance = Math.sqrt(
        Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2)
      );
      
      if (distance < GAME_CONFIG.PLAYER_SIZE) {
        collisions.push({
          bulletId: bullet.id,
          playerId: player.id,
          damage: bullet.damage
        });
      }
    });
  });
  
  return collisions;
};

export const updateSafeZone = (safeZone: SafeZone, gameStartTime: number): SafeZone => {
  const elapsed = Date.now() - gameStartTime;
  const intervals = GAME_CONFIG.SAFE_ZONE_SHRINK_INTERVALS;
  
  let targetRadius = GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS;
  const shrinkStep = (GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS - GAME_CONFIG.SAFE_ZONE_FINAL_RADIUS) / intervals.length;
  
  for (let i = 0; i < intervals.length; i++) {
    if (elapsed > intervals[i]) {
      targetRadius = GAME_CONFIG.SAFE_ZONE_INITIAL_RADIUS - (shrinkStep * (i + 1));
    }
  }
  
  // Smoothly shrink towards target
  const shrinkSpeed = 0.5;
  if (safeZone.radius > targetRadius) {
    safeZone.radius = Math.max(targetRadius, safeZone.radius - shrinkSpeed);
  }
  
  return safeZone;
};

export const checkSafeZoneDamage = (players: Record<string, Player>, safeZone: SafeZone): string[] => {
  const damagedPlayers: string[] = [];
  
  Object.values(players).forEach(player => {
    if (!player.isAlive) return;
    
    const distance = Math.sqrt(
      Math.pow(player.x - safeZone.x, 2) + Math.pow(player.y - safeZone.y, 2)
    );
    
    if (distance > safeZone.radius) {
      damagedPlayers.push(player.id);
    }
  });
  
  return damagedPlayers;
};

export const spawnItems = (): Record<string, InventoryItem> => {
  const items: Record<string, InventoryItem> = {};
  
  for (let i = 0; i < GAME_CONFIG.ITEM_SPAWN_COUNT; i++) {
    const item: InventoryItem = {
      id: `item-${i}`,
      type: Math.random() < 0.4 ? 'weapon' : Math.random() < 0.7 ? 'ammo' : 'health',
      x: Math.random() * (GAME_CONFIG.MAP_WIDTH - 100) + 50,
      y: Math.random() * (GAME_CONFIG.MAP_HEIGHT - 100) + 50,
      collected: false
    };
    items[item.id] = item;
  }
  
  return items;
};

export const getDistanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const createBots = (count: number): Record<string, Player> => {
  const bots: Record<string, Player> = {};
  const botNames = [
    'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
    'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa'
  ];
  
  for (let i = 0; i < count; i++) {
    const botId = `bot-${i}`;
    const botName = botNames[i] || `Bot${i}`;
    bots[botId] = createPlayer(botId, botName, true);
  }
  
  return bots;
};