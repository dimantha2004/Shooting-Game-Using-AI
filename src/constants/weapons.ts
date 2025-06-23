import { WeaponStats, WeaponType } from '../types/game';

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  assault_rifle: {
    damage: 35,
    range: 300,
    fireRate: 150, // ms between shots
    ammoType: 'rifle',
    magazineSize: 30,
    reloadTime: 2000
  },
  shotgun: {
    damage: 80,
    range: 120,
    fireRate: 800,
    ammoType: 'shotgun',
    magazineSize: 8,
    reloadTime: 3000
  },
  sniper: {
    damage: 120,
    range: 500,
    fireRate: 1500,
    ammoType: 'sniper',
    magazineSize: 5,
    reloadTime: 3500
  },
  pistol: {
    damage: 25,
    range: 200,
    fireRate: 300,
    ammoType: 'pistol',
    magazineSize: 15,
    reloadTime: 1500
  }
};

export const WEAPON_COLORS: Record<WeaponType, string> = {
  assault_rifle: '#4CAF50',
  shotgun: '#FF9800',
  sniper: '#9C27B0',
  pistol: '#607D8B'
};