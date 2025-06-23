export interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  angle: number;
  weapon: WeaponType;
  ammo: Record<AmmoType, number>;
  inventory: InventoryItem[];
  kills: number;
  isAlive: boolean;
  name: string;
  color: string;
  isBot?: boolean;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  ownerId: string;
  weapon: WeaponType;
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  collected: boolean;
}

export interface SafeZone {
  x: number;
  y: number;
  radius: number;
  nextRadius: number;
  shrinkStartTime: number;
  shrinkDuration: number;
}

export interface GameState {
  players: Record<string, Player>;
  bullets: Record<string, Bullet>;
  items: Record<string, InventoryItem>;
  safeZone: SafeZone;
  gamePhase: GamePhase;
  matchStartTime: number;
  winner: string | null;
  playersAlive: number;
}

export type WeaponType = 'assault_rifle' | 'shotgun' | 'sniper' | 'pistol';
export type AmmoType = 'rifle' | 'shotgun' | 'sniper' | 'pistol';
export type ItemType = 'weapon' | 'ammo' | 'health' | 'grenade';
export type GamePhase = 'waiting' | 'starting' | 'playing' | 'ended';

export interface WeaponStats {
  damage: number;
  range: number;
  fireRate: number;
  ammoType: AmmoType;
  magazineSize: number;
  reloadTime: number;
}

export interface Controls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shooting: boolean;
  mouseX: number;
  mouseY: number;
}