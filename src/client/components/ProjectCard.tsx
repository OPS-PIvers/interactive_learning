
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../shared/types';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ShareIcon } from './icons/ShareIcon';
import ShareModal from './ShareModal';
import { normalizeFirebaseUrl, addFirebaseImageCORS, logFirebaseImageLoad } from '../utils/firebaseImageUtils';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleThumbnailLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    addFirebaseImageCORS(img);
    logFirebaseImageLoad(img.src, true, `ProjectCard thumbnail for ${project.title}`);
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    logFirebaseImageLoad(img.src, false, `ProjectCard thumbnail for ${project.title}`);
    img.src = 'https://picsum.photos/400/250?grayscale';
  };

  // Normalize the thumbnail URL if it exists
  const thumbnailSrc = project.thumbnailUrl 
    ? normalizeFirebaseUrl(project.thumbnailUrl)
    : 'https://picsum.photos/400/250?grayscale&blur=1';

  return (
    <>
      <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-purple-500/30 hover:scale-105 flex flex-col">
        <img
          src={thumbnailSrc}
          alt={project.title}
          className="w-full h-48 object-cover bg-slate-700"
          onLoad={handleThumbnailLoad}
          onError={handleThumbnailError}
        />
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold text-white mb-2 truncate" title={project.title}>{project.title}</h3>
          <p className="text-slate-400 text-sm mb-4 flex-grow min-h-[60px]" title={project.description}>{project.description}</p>
          <div className="mt-auto flex space-x-3">
            <button
              onClick={() => navigate(`/view/${project.id}`)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
              aria-label={`View ${project.title}`}
            >
              <EyeIcon className="w-5 h-5" />
              <span>View</span>
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2"
              aria-label={`Edit ${project.title}`}
            >
              <PencilIcon className="w-5 h-5" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors duration-200"
              aria-label={`Share ${project.title}`}
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors duration-200"
              aria-label={`Delete ${project.title}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={project}
        />
      )}
    </>
  );
};

export default ProjectCard;
