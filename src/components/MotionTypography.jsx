import React, { useContext, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/**
 * CharacterReveal: Staggers each individual character into view with subtle blur & vertical lift.
 * Words are wrapped in inline-block spans so word wrapping stays natural and responsive.
 */
export function CharacterReveal({
  text,
  className = '',
  as = 'span',
  delay = 0,
  stagger = 0.022,
  duration = 0.65,
  once = false
}) {
  const words = text.split(' ');
  const Component = motion[as] || motion.span;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const charVariants = {
    hidden: {
      opacity: 0,
      y: 18,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        ease: EASE
      }
    }
  };

  return (
    <Component
      className={`char-reveal ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15 }}
    >
      {words.map((word, wordIdx) => (
        <span key={`w-${wordIdx}`} className="char-reveal-word" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {Array.from(word).map((char, charIdx) => (
            <motion.span
              key={`c-${wordIdx}-${charIdx}`}
              variants={charVariants}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
          {wordIdx < words.length - 1 && <span style={{ display: 'inline-block', width: '0.28em' }}>&nbsp;</span>}
        </span>
      ))}
    </Component>
  );
}

/**
 * WordReveal: Staggers each word upward from behind a clipping mask.
 */
export function WordReveal({
  text,
  className = '',
  as = 'div',
  delay = 0,
  stagger = 0.05,
  duration = 0.7,
  once = false
}) {
  const words = text.split(' ');
  const Component = motion[as] || motion.div;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: '105%',
      rotate: 2
    },
    visible: {
      opacity: 1,
      y: '0%',
      rotate: 0,
      transition: {
        duration,
        ease: EASE
      }
    }
  };

  return (
    <Component
      className={`word-reveal ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15 }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28em 0.3em' }}
    >
      {words.map((word, idx) => (
        <span
          key={`wr-${idx}`}
          className="word-mask"
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}
        >
          <motion.span
            variants={wordVariants}
            style={{ display: 'inline-block' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}

/**
 * LineReveal: Staggers multiple lines or child elements from behind clipping masks.
 */
export function LineReveal({
  children,
  className = '',
  delay = 0,
  stagger = 0.09,
  duration = 0.8,
  once = false
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const lineVariants = {
    hidden: {
      opacity: 0,
      y: '110%'
    },
    visible: {
      opacity: 1,
      y: '0%',
      transition: {
        duration,
        ease: EASE
      }
    }
  };

  return (
    <motion.div
      className={`line-reveal ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15 }}
    >
      {React.Children.map(children, (child, idx) => (
        <div key={`line-${idx}`} className="line-mask" style={{ overflow: 'hidden' }}>
          <motion.div variants={lineVariants}>{child}</motion.div>
        </div>
      ))}
    </motion.div>
  );
}

/**
 * DynamicKeyword: Smoothly transitions between authentic professional titles
 * with character morphing and a subtle terminal caret.
 */
export function DynamicKeyword({
  keywords = [
    'COMPUTER SYSTEMS ENGINEER',
    'AUTONOMOUS AI RESEARCHER',
    'CYBER-DEFENSE ARCHITECT',
    'FOUNDER · AURANIX TECHNOLOGIES'
  ],
  interval = 3600,
  className = ''
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % keywords.length);
    }, interval);
    return () => clearInterval(timer);
  }, [keywords, interval]);

  const current = keywords[index];

  return (
    <span className={`dynamic-keyword-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <motion.span
        key={current}
        initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ display: 'inline-block' }}
      >
        {current}
      </motion.span>
      <span
        className="dynamic-keyword-caret"
        style={{
          display: 'inline-block',
          width: '2px',
          height: '1.05em',
          backgroundColor: 'var(--red)',
          verticalAlign: 'middle',
          animation: 'keyword-blink 1.05s infinite'
        }}
      />
    </span>
  );
}

/**
 * ScrollHeading: Scroll-linked parallax heading that shifts gently across the viewport depth.
 */
export function ScrollHeading({
  children,
  targetRef,
  range = [-25, 25],
  className = '',
  style = {}
}) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start']
  });

  const x = useTransform(scrollYProgress, [0, 1], range);

  return (
    <motion.div className={className} style={{ ...style, x }}>
      {children}
    </motion.div>
  );
}

