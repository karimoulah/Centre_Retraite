import * as migration_20261117_050023_initial from './20261117_050023_initial';
import * as migration_20261118_030324_menu_children_and_anchors from './20261118_030324_menu_children_and_anchors';

export const migrations = [
  {
    up: migration_20261117_050023_initial.up,
    down: migration_20261117_050023_initial.down,
    name: '20261117_050023_initial',
  },
  {
    up: migration_20261118_030324_menu_children_and_anchors.up,
    down: migration_20261118_030324_menu_children_and_anchors.down,
    name: '20261118_030324_menu_children_and_anchors'
  },
];
