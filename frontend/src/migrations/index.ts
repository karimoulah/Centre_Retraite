import * as migration_20261117_050023_initial from './20261117_050023_initial';

export const migrations = [
  {
    up: migration_20261117_050023_initial.up,
    down: migration_20261117_050023_initial.down,
    name: '20261117_050023_initial'
  },
];
