export interface UpgradeNode {
  id: string;
  branch: 'foundation' | 'inventory' | 'xp' | 'economy' | 'loot';
  name: string;
  desc: string;
  cost: number;
  prereq?: string;
}

export const ACCOUNT_UPGRADES: UpgradeNode[] = [
  { id: 'blood_pact_1', branch: 'foundation', name: 'Blood Pact I', desc: '+15% Max HP and Defense', cost: 1 },
  { id: 'blood_pact_2', branch: 'foundation', name: 'Blood Pact II', desc: '+30% Max HP and Defense', cost: 2, prereq: 'blood_pact_1' },

  { id: 'casket_storage_1', branch: 'inventory', name: 'Casket Storage I', desc: '+5 Stash Vault Slots', cost: 1 },
  { id: 'casket_storage_2', branch: 'inventory', name: 'Casket Storage II', desc: '+10 Stash Vault Slots', cost: 2, prereq: 'casket_storage_1' },

  { id: 'blood_scholar_1', branch: 'xp', name: 'Blood Scholar I', desc: '+10% Experience Gain', cost: 1 },
  { id: 'blood_scholar_2', branch: 'xp', name: 'Blood Scholar II', desc: '+20% Experience Gain', cost: 2, prereq: 'blood_scholar_1' },

  { id: 'gilded_coffin_1', branch: 'economy', name: 'Gilded Coffin I', desc: '+15% Gold from Monsters', cost: 1 },
  { id: 'gilded_coffin_2', branch: 'economy', name: 'Gilded Coffin II', desc: '+30% Gold from Monsters', cost: 2, prereq: 'gilded_coffin_1' },

  { id: 'dracula_loot_1', branch: 'loot', name: 'Dracula\'s Loot I', desc: '+10% Item Drop Rate', cost: 1 },
  { id: 'dracula_loot_2', branch: 'loot', name: 'Dracula\'s Loot II', desc: '+25% Item Drop Rate', cost: 2, prereq: 'dracula_loot_1' }
];
