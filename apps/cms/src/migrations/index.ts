import * as migration_20260624_000000_baseline from './20260624_000000_baseline';
import * as migration_20261123_000000_imagenes_upload from './20261123_000000_imagenes_upload';

export const migrations = [
  {
    up: migration_20260624_000000_baseline.up,
    down: migration_20260624_000000_baseline.down,
    name: '20260624_000000_baseline'
  },
  {
    up: migration_20261123_000000_imagenes_upload.up,
    down: migration_20261123_000000_imagenes_upload.down,
    name: '20261123_000000_imagenes_upload'
  },
];
