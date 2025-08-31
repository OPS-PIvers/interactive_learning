import React, { useState } from 'react';
import { HotspotWalkthrough } from '@/shared/hotspotTypes';

interface ProjectCardProps {
  walkthrough: HotspotWalkthrough;
  onEdit: () => void;
  onView: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export default function ProjectCard({
  walkthrough,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  onShare
}: ProjectCardProps) {

  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative">
        {walkthrough.backgroundMedia?.url ? (
          <img
            src={walkthrough.backgroundMedia.url}
            alt={walkthrough.backgroundMedia.alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Hotspot Count Badge */}
        {walkthrough.hotspots.length > 0 && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {walkthrough.hotspots.length} steps
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            walkthrough.isPublished
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {walkthrough.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Actions Menu */}
        <div className="absolute bottom-2 right-2">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-32 z-10">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onView(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  View
                </button>
                <button
                  onClick={() => { onShare(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Share
                </button>
                <button
                  onClick={() => { onDuplicate(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Duplicate
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate">
          {walkthrough.title}
        </h3>

        {walkthrough.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {walkthrough.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated {formatDate(walkthrough.updatedAt)}</span>
          <span>{walkthrough.hotspots.length} hotspots</span>
        </div>
      </div>
    </div>
  );
}
