import React, { useRef, useState, useContext } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { ArrowUpRight, Play } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

export default function ProjectCardMotion({
  project,
  index,
  onOpen,
  MediaImageComponent
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tilt physics
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 260, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), springConfig);

  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const isVideo = ['youtube', 'drive'].includes(project.type);

  return (
    <motion.article
      ref={cardRef}
      className="project-card motion-card"
      layout
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, delay: (index % 3) * 0.07, ease: EASE }}
      exit={{ opacity: 0, scale: 0.96 }}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      style={{
        perspective: 1000
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'none' : 'transform 0.4s ease'
        }}
        className="project-card-3d-wrap"
      >
        <button
          className="project-open"
          onClick={() => onOpen(project)}
          aria-label={`View ${project.title}`}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Spotlight cursor glare reflection */}
          {isHovered && (
            <motion.div
              className="card-spotlight-glare"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 4,
                pointerEvents: 'none',
                background: `radial-gradient(circle at ${(mouseX.get() * 100).toFixed(1)}% ${(mouseY.get() * 100).toFixed(1)}%, rgba(239, 65, 81, 0.18), transparent 60%)`
              }}
            />
          )}

          {/* Picture Layer */}
          <div className="project-picture">
            {MediaImageComponent ? (
              <MediaImageComponent src={project.image} alt={project.title} />
            ) : (
              <img src={project.image} alt={project.title} loading="lazy" />
            )}
          </div>

          {/* Project Type Badge */}
          <span className="project-type">
            {project.type === 'render'
              ? 'SYSTEM ARCHITECTURE'
              : project.type === 'website'
              ? 'LIVE PLATFORM'
              : project.category === 'Research'
              ? 'RESEARCH PAPER'
              : isVideo
              ? 'VIDEO'
              : 'PROJECT CASE'}
          </span>

          {/* Hover Action Circle */}
          <span className="project-hover">
            {isVideo ? <Play fill="currentColor" size={18} /> : <ArrowUpRight size={22} />}
          </span>

          <span className="project-frame" aria-hidden="true" />
        </button>

        <button className="project-caption" onClick={() => onOpen(project)}>
          <span className="project-number display">{String(index + 1).padStart(2, '0')}</span>
          <span>
            <h3>{project.title}</h3>
            <span className="project-category">
              {project.category}
              {project.year ? ` / ${project.year}` : ''}
            </span>
          </span>
          <ArrowUpRight size={20} />
        </button>
      </motion.div>
    </motion.article>
  );
}

