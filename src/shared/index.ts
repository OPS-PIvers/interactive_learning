// Barrel exports for shared modules
export * from './types';
export * from './slideTypes';
export * from './enums';
// Removed InteractionPresets export to break circular dependency

// Default exports
export { DataMigration } from './DataMigration';
export { getMigrationInfo } from './migration';
export { migrateProjectToSlides } from './migrationUtils';