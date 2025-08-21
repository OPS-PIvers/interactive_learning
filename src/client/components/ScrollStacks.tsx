import React, { useEffect, useRef, useState } from 'react';
import { Project } from '../../shared/types';
import { Z_INDEX } from '../utils/zIndexLevels';
import ProjectCard from './ProjectCard';

interface ScrollStacksProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ScrollStacks: React.FC<ScrollStacksProps> = ({ projects, onEdit, onDelete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  // If there are 3 or fewer projects, use regular grid layout instead of scroll stacks
  const useGridLayout = projects.length <= 3;

  useEffect(() => {
    if (useGridLayout) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -30% 0px',
      threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
        
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          setVisibleCards(prev => [...new Set([...prev, index])]);
        } else if (entry.intersectionRatio === 0) {
          setVisibleCards(prev => prev.filter(i => i !== index));
        }
      });
    }, observerOptions);

    const cards = containerRef.current?.querySelectorAll('.scroll-stack-card');
    cards?.forEach(card => observer.observe(card));

    return () => {
      cards?.forEach(card => observer.unobserve(card));
    };
  }, [projects.length, useGridLayout]);

  // For 3 or fewer projects, use traditional grid layout
  if (useGridLayout) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="animate-stack-reveal">
            <ProjectCard
              project={project}
              onEdit={() => onEdit(project)}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen-dynamic"
    >
      {projects.map((project, index) => {
        const isVisible = visibleCards.includes(index);
        const stackOffset = Math.min(index * 12, 48); // Max 48px offset
        const scaleReduction = Math.min(index * 0.03, 0.12); // Max 12% scale reduction
        const opacityReduction = Math.min(index * 0.08, 0.32); // Max 32% opacity reduction

        return (
          <div
            key={project.id}
            data-index={index}
            className={`scroll-stack-card sticky transition-all duration-700 ease-out ${
              isVisible ? 'animate-stack-reveal' : ''
            }`}
            style={{
              top: `${80 + stackOffset}px`,
              transform: isVisible 
                ? 'translateY(0) scale(1)' 
                : `translateY(${stackOffset}px) scale(${1 - scaleReduction})`,
              opacity: isVisible ? 1 : (1 - opacityReduction),
              zIndex: Z_INDEX.SLIDE_CONTENT + (projects.length - index),
              marginBottom: index === projects.length - 1 ? '20vh' : `${120 + stackOffset}px`,
            }}
          >
            <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
              <ProjectCard
                project={project}
                onEdit={() => onEdit(project)}
                onDelete={onDelete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScrollStacks;