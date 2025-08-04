// Barrel exports for shared modules
export * from './types';
export * from './slideTypes';
export * from './enums';
export * from './InteractionPresets';

// Default exports
export { default as DataMigration } from './DataMigration';
export { getMigrationInfo } from './migration';
export { migrateProjectToSlides } from './migrationUtils';