import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Plus, Minus, ArrowUpRight, CheckCircle2, Award } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

export default function AnimatedTimeline({
  experiences,
  openIndex,
  onToggle
}) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 70%']
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001
  });

  return (
    <div className="animated-timeline-container" ref={containerRef} style={{ position: 'relative' }}>
      {/* Scroll-illuminating connecting timeline beam */}
      <div
        className="timeline-track"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '12px',
          top: '20px',
          bottom: '20px',
          width: '2px',
          background: 'rgba(239, 65, 81, 0.15)',
          borderRadius: '1px'
        }}
      >
        <motion.div
          className="timeline-beam"
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, #ff4f60, #ef4151, #990a18)',
            scaleY,
            transformOrigin: 'top',
            boxShadow: '0 0 10px rgba(239, 65, 81, 0.6)'
          }}
        />
      </div>

      <div className="experience-list">
        {experiences.map((job, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={job.title}
              className={`experience-row ${isOpen ? 'is-open' : ''}`}
              style={{ position: 'relative' }}
            >
              <button
                aria-expanded={isOpen}
                aria-controls={`job-${i}`}
                onClick={() => onToggle(isOpen ? null : i)}
              >
                <span className="experience-date">{job.date}</span>
                <span>
                  <h3>{job.title}</h3>
                  <span className="experience-place">{job.place}</span>
                </span>
                {isOpen ? <Minus size={18} /> : <Plus size={18} />}
              </button>

              {isOpen && (
                <motion.div
                  id={`job-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <p>{job.text}</p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
