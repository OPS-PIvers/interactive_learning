import React, { useState } from 'react';
import { InteractiveModuleState } from '../../shared/types';
import { SlideDeck } from '../../shared/slideTypes';
import { convertHotspotToSlideDeck } from '../../shared/migration';
import { demoModuleData } from '../../shared/demoModuleData';
import SlideViewer from './slides/SlideViewer';

const MigrationTestPage: React.FC = () => {
  const [migratedSlideDeck, setMigratedSlideDeck] = useState<SlideDeck | null>(null);

  const handleMigration = () => {
    const slideDeck = convertHotspotToSlideDeck(demoModuleData as InteractiveModuleState);
    setMigratedSlideDeck(slideDeck);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Migration Test Page</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleMigration}
      >
        Migrate Demo Module
      </button>
      {migratedSlideDeck && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Migrated Slide Deck</h2>
          <div className="w-full h-96 border border-gray-300">
            <SlideViewer slideDeck={migratedSlideDeck} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationTestPage;
