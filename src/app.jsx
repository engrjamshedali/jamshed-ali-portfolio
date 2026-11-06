import React, { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
  useAnimationFrame,
  useInView
} from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  Play,
  X,
  Menu,
  Mail,
  Phone,
  MapPin,
  Download,
  Pause,
  Search,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Shield,
  Terminal,
  BookOpen,
  Award
} from 'lucide-react';
import archive from './data/projects.json';
import brands from './data/brands.json';
import './styles.css';
import { CharacterReveal, WordReveal, LineReveal, DynamicKeyword, ScrollHeading } from './components/MotionTypography.jsx';
import TechEcosystem from './components/TechEcosystem.jsx';
import ProjectCardMotion from './components/ProjectCardMotion.jsx';
import AnimatedTimeline from './components/AnimatedTimeline.jsx';

const MotionContext = createContext(true);
const EASE = [0.22, 1, 0.36, 1];

const categories = [
  'All',
  'Research',
  'Web Development',
  'AI & ML',
  'Cybersecurity',
  'Networking',
  'WordPress',
  'Writing',
  'Creative Experiments'
];

const featured = [
  'AGENTIC AI FOR AUTONOMOUS CYBER-DEFENSE',
  'ZENITH CYBERSECURITY DASHBOARD',
  'AURANIX TECHNOLOGIES OFFICIAL PORTAL'
]
  .map(key => archive.find(p => p.title === key || p.media === key))
  .filter(Boolean);

const experiences = [
  {
    date: '2025 · PRESENT',
    title: 'Founder & CEO',
    place: 'AuraNix Technologies (auranix.tech)',
    text: 'Steering the technological vision, engineering architecture, and digital intelligence strategy. Architecting full-stack digital platforms, autonomous AI workflows, and hardened enterprise software solutions.'
  },
  {
    date: '2024 · PRESENT',
    title: 'Computer Systems Engineering (CSE-V)',
    place: 'Sukkur IBA University',
    text: 'Undergraduate engineering curriculum covering microprocessors, computer architecture, data structures & algorithms, signals and systems, computer networks, and discrete systems programming in C++ and Java.'
  },
  {
    date: '2026',
    title: 'Lead Organizer & Technical Trainer',
    place: 'WordPress Campus Connect · Sukkur IBA University',
    text: 'Spearheaded the technical campus initiative, organizing training bootcamps for over 100 university students in full-site editing, custom block theme architecture, and production web deployment.'
  },
  {
    date: '2025 · PRESENT',
    title: 'Event & Discipline Management Lead',
    place: 'CSE Society · Sukkur IBA University',
    text: 'Directing event logistics, participant management, and operational discipline for department symposiums, hackathons, and technical workshops across the university.'
  },
  {
    date: '2025 – 2026',
    title: 'Technical Workshop Trainer',
    place: 'Dream Institute Sukkur',
    text: 'Conducted hands-on web engineering and software development workshops for aspiring engineers, focusing on modern JavaScript, responsive interfaces, and practical software tooling.'
  }
];

const verifiedMilestones = [
  {
    year: '2026',
    title: 'Agentic AI Research Framework',
    event: 'Human-in-the-Loop Cyber-Defense Architecture for Critical Infrastructure',
    description: 'Published & co-authored framework exploring multi-agent cognitive decision pipelines and human-in-the-loop governance for Pakistan’s critical digital infrastructure.'
  },
  {
    year: '2026',
    title: 'AuraNix Technologies Launch',
    event: 'Founder & CEO of Enterprise Tech Venture (auranix.tech)',
    description: 'Established AuraNix Technologies to deliver intelligent digital products, secure web architectures, and scalable technology solutions.'
  },
  {
    year: '2026',
    title: 'WordPress Campus Connect Organizer',
    event: 'Sukkur IBA University Hands-on Development Program',
    description: 'Organized and trained 100+ engineering students in modern CMS engineering, theme development, and responsive website deployment.'
  },
  {
    year: '2025',
    title: 'Author of Dastan e Hasrat (داستانِ حسرت)',
    event: 'Published Urdu Philosophical & Contemplative Poetry Book',
    description: 'Authored and published a celebrated collection of Urdu poetry embodying the creative philosophy that Code is Poetry, and Every Coder is a Poet.'
  },
  {
    year: '2025',
    title: 'CSE Society Management Lead',
    event: 'Department of Computer Systems Engineering Leadership',
    description: 'Elected/appointed to lead Event and Discipline Management for major technical symposiums and academic initiatives at Sukkur IBA University.'
  },
  {
    year: '2025',
    title: 'Web Engineering Workshop Trainer',
    event: 'Dream Institute Sukkur Training Bootcamp',
    description: 'Delivered specialized practical software development and web engineering masterclasses for engineering students.'
  }
];

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const enabled = useContext(MotionContext);
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={enabled ? { opacity: 0, y: 32 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.12 }}
      transition={{ duration: enabled ? 0.75 : 0, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

function MediaImage({ src, alt, className = '', priority = false, ...props }) {
  const [state, setState] = useState('loading');
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    setState(img?.complete ? (img.naturalWidth ? 'loaded' : 'error') : 'loading');
  }, [src]);

  return (
    <span className={`media-image ${state} ${className}`}>
      {state === 'error' && (
        <span className="image-fallback">
          <span className="display">JA.</span>
          <span>Preview Unavailable</span>
        </span>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        width="960"
        height="600"
        onLoad={() => setState('loaded')}
        onError={e => {
          if (e.currentTarget.src.includes('maxresdefault.jpg')) {
            e.currentTarget.src = e.currentTarget.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
          } else {
            setState('error');
          }
        }}
        {...props}
      />
    </span>
  );
}

function Magnetic({ children, className = '', ...props }) {
  const enabled = useContext(MotionContext);
  const x = useSpring(0, { stiffness: 220, damping: 20 });
  const y = useSpring(0, { stiffness: 220, damping: 20 });

  return (
    <motion.a
      className={className}
      style={{ x, y }}
      onPointerMove={e => {
        if (!enabled || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.12);
        y.set((e.clientY - r.top - r.height / 2) * 0.2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      {...props}
    >
      {children}
    </motion.a>
  );
}

function Header({ enabled, onToggle, navigationData }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');

  const defaultItems = [
    ['portfolio', 'Works'],
    ['awards', 'Contributions'],
    ['auranix', 'AuraNix'],
    ['ecosystem', 'Ecosystem'],
    ['about', 'About'],
    ['experience', 'Journey'],
    ['contact', 'Contact']
  ];

  const items = navigationData?.items
    ? navigationData.items.filter(i => i.is_visible !== false).map(i => [i.id || i.href.replace('#', ''), i.label])
    : defaultItems;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-15% 0px -65% 0px' }
    );
    document.querySelectorAll('main > section[id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Jamshed Ali, Home">
        {navigationData?.wordmark ? navigationData.wordmark.replace('®', '') : 'JAMSHED ALI'}<span>®</span>
      </a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {items.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>
            {label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="motion-toggle"
          onClick={onToggle}
          aria-label={enabled ? 'Pause animation' : 'Enable animation'}
          aria-pressed={!enabled}
        >
          {enabled ? <Pause size={13} /> : <Play size={13} />}
          <span>Motion {enabled ? 'on' : 'off'}</span>
        </button>
        <a className="header-contact" href={navigationData?.contact_button_url || '#contact'}>
          {navigationData?.contact_button_label || 'Let’s talk'} <ArrowUpRight size={16} />
        </a>
        <button
          className="menu-toggle icon-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {[
              ['home', 'Home'],
              ...items
            ].map(([id, label], i) => (
              <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
                <span>0{i + 1}</span>
                {label}
                <ArrowUpRight size={18} />
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero({ onProject, heroData, featuredProject }) {
  const ref = useRef(null);
  const enabled = useContext(MotionContext);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 85]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -55]);

  const defaultKeywords = [
    'COMPUTER SYSTEMS ENGINEERING',
    'AUTONOMOUS AI RESEARCHER',
    'CYBER-DEFENSE ARCHITECT',
    'FOUNDER · AURANIX TECHNOLOGIES'
  ];

  const keywords = (heroData?.dynamic_keywords && heroData.dynamic_keywords.length > 0)
    ? heroData.dynamic_keywords
    : defaultKeywords;

  const targetFeatured = featuredProject || featured[0];

  return (
    <section id="home" className="hero" ref={ref}>
      <div className="hero-top">
        <span>
          {heroData?.eyebrow1 || 'ENGINEER / DEVELOPER / RESEARCHER'}
          <br />
          <span className="muted">{heroData?.eyebrow2 || 'FOUNDER OF AURANIX TECHNOLOGIES'}</span>
        </span>
        <span className="availability">
          <i style={heroData?.availability_active === false ? { background: '#666' } : {}} />
          {heroData?.availability_text || 'AVAILABLE FOR PROJECTS'}
        </span>
      </div>

      <motion.div
        className="hero-title display"
        aria-hidden="true"
        style={enabled ? { y: titleY } : {}}
        initial={enabled ? { clipPath: 'inset(0 0 100% 0)' } : false}
        animate={{ clipPath: 'inset(0 0 0% 0)' }}
        transition={{ duration: 1.4, ease: EASE }}
      >
        {heroData?.background_word || 'PORTFOLIO'}
      </motion.div>

      <motion.div
        className="hero-portrait"
        style={enabled ? { y: portraitY, scale: portraitScale } : {}}
        initial={enabled ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <img
          src={heroData?.portrait_image || './Asset/img/jamshed-portrait.png'}
          alt={heroData?.portrait_alt || 'Jamshed Ali - Computer Systems Engineering Student, Developer and Founder'}
          width="1024"
          height="1536"
          fetchPriority="high"
        />
      </motion.div>

      <motion.div
        className="hero-intro"
        style={enabled ? { y: copyY } : {}}
        initial={enabled ? { opacity: 0, x: -35 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
      >
        <p className="handwriting">{heroData?.handwriting_tagline || 'Building ideas into reality.'}</p>
        <h1 className="display">
          {heroData?.name_heading ? (
            heroData.name_heading.endsWith('.') ? (
              <>{heroData.name_heading.slice(0, -1)}<span>.</span></>
            ) : heroData.name_heading
          ) : (
            <>JAMSHED ALI<span>.</span></>
          )}
        </h1>
        <p className="hero-role">
          <DynamicKeyword keywords={keywords} />
        </p>
        <p className="hero-description">
          {heroData?.bio_description || 'I explore technology, engineer digital experiences, and transform complex ideas into meaningful solutions.'}
        </p>
        <Magnetic href={heroData?.primary_cta_url || '#portfolio'} className="primary-link">
          {heroData?.primary_cta_label || 'Explore My Work'} <ArrowDown size={17} />
        </Magnetic>
        <span className="hero-location">
          <MapPin size={12} /> {heroData?.location_label || 'SUKKUR, PAKISTAN'}
        </span>
      </motion.div>

      <motion.div
        className="hero-side"
        initial={enabled ? { opacity: 0, x: 30 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.55, ease: EASE }}
      >
        <div className="hero-manifesto">
          <span className="crosshair" aria-hidden="true">
            ✳
          </span>
          <p style={{ whiteSpace: 'pre-line' }}>
            {heroData?.manifesto_quote || 'Code is poetry.\nEvery coder is a poet.'}
          </p>
        </div>
        <div className="hero-stats">
          {heroData?.stats && heroData.stats.length > 0 ? (
            heroData.stats.map((st, i) => (
              <div key={i} className={st.link ? 'hero-award-stat' : ''}>
                <span className="display">
                  {st.value}
                </span>
                {st.link ? (
                  <a href={st.link}>
                    {st.title} <ArrowUpRight size={12} />
                  </a>
                ) : (
                  <p style={{ whiteSpace: 'pre-line' }}>{st.title}</p>
                )}
              </div>
            ))
          ) : (
            <>
              <div>
                <span className="display">
                  05<span>+</span>
                </span>
                <p>
                  SEMESTER LEVEL (CSE-V)
                  <br />
                  SUKKUR IBA UNIVERSITY
                </p>
              </div>
              <div>
                <span className="display">
                  15<span>+</span>
                </span>
                <p>
                  SYSTEMS &amp; TECH
                  <br />
                  PROJECTS BUILT
                </p>
              </div>
              <div className="hero-award-stat">
                <span className="display">
                  01<span>★</span>
                </span>
                <a href="#auranix" aria-label="Explore AuraNix Technologies venture">
                  AURANIX TECH
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </>
          )}
          <a href={heroData?.cv_download_url || './Asset/cv/Jamshed_Ali_Resume.pdf'} download="Jamshed_Ali_Resume.pdf">
            <Download size={16} />
            <span>{heroData?.cv_download_label || 'DOWNLOAD CV'}</span>
          </a>
        </div>
      </motion.div>

      <div className="hero-bottom">
        <button className="reel-button" onClick={() => onProject(targetFeatured)}>
          <span className="play-circle">
            <Play size={12} fill="currentColor" />
          </span>
          {heroData?.bottom_reel_title || 'FEATURED RESEARCH'}
          <span className="muted">{heroData?.bottom_reel_subtitle || 'AGENTIC AI CYBER-DEFENSE'}</span>
        </button>
        <span className="hero-scroll">
          {heroData?.scroll_prompt || 'SCROLL TO DISCOVER'} <ArrowDown size={13} />
        </span>
        <span className="edition">{heroData?.edition_label || 'ENGINEERING & RESEARCH / 2024–2026'}</span>
      </div>
    </section>
  );
}

function ProjectCard({ project, index, onOpen }) {
  const enabled = useContext(MotionContext);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const isVideo = ['youtube', 'drive'].includes(project.type);

  return (
    <motion.article
      ref={ref}
      className="project-card"
      layout
      initial={enabled ? { opacity: 0, y: 32 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.08 }}
      transition={{ duration: enabled ? 0.6 : 0, delay: (index % 3) * 0.06, ease: EASE }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <button className="project-open" onClick={() => onOpen(project)} aria-label={`View ${project.title}`}>
        <motion.div className="project-picture" style={enabled ? { y } : {}}>
          <MediaImage src={project.image} alt={project.title} />
        </motion.div>
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
    </motion.article>
  );
}

function BrandStrip({ brandsData, sectionData }) {
  const enabled = useContext(MotionContext);
  const ref = useRef(null);
  const loopWidth = useRef(0);
  const inView = useInView(ref);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const activeBrands = brandsData && brandsData.length > 0
    ? brandsData.map(b => ({
        file: b.image ? b.image.replace('./Asset/svg/brand/', '') : 'react.svg',
        name: b.name
      }))
    : brands;

  useEffect(() => {
    if (!ref.current || showAll) return;
    const update = () => {
      loopWidth.current = ref.current?.querySelector('.brand-set')?.getBoundingClientRect().width || 0;
    };
    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    update();
    return () => observer.disconnect();
  }, [showAll]);

  useAnimationFrame((time, delta) => {
    if (!enabled || paused || interacting || !inView || showAll || !ref.current || !loopWidth.current) return;
    const el = ref.current;
    el.scrollLeft += Math.min(delta, 40) * 0.038;
    if (el.scrollLeft >= loopWidth.current) el.scrollLeft -= loopWidth.current;
  });

  const move = direction => {
    setPaused(true);
    ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.7, behavior: enabled ? 'smooth' : 'instant' });
  };

  return (
    <Reveal className="brand-section">
      <div className="brand-heading">
        <p>
          {sectionData?.eyebrow_prefix || 'CONNECTED WITH'}
          <br />
          <strong>{sectionData?.heading_highlight || 'THE BROADER TECH ECOSYSTEM.'}</strong>
        </p>
        <div>
          <button
            className="brand-all"
            onClick={() => setShowAll(v => !v)}
            aria-expanded={showAll}
            aria-controls="brand-collection"
          >
            {showAll ? 'COLLAPSE ROW' : `VIEW ALL (${activeBrands.length})`}
            {showAll ? <Minus size={14} /> : <Plus size={14} />}
          </button>
          {!showAll && (
            <>
              <button
                className="icon-button brand-pause"
                aria-label={paused ? 'Play logo loop' : 'Pause logo loop'}
                aria-pressed={paused}
                onClick={() => setPaused(v => !v)}
              >
                {paused ? <Play size={13} /> : <Pause size={13} />}
              </button>
              <button className="icon-button" onClick={() => move(-1)} aria-label="Previous logo">
                <ChevronLeft size={17} />
              </button>
              <button className="icon-button" onClick={() => move(1)} aria-label="Next logo">
                <ChevronRight size={17} />
              </button>
            </>
          )}
        </div>
      </div>
      <div
        id="brand-collection"
        className={showAll ? 'brand-full-grid' : 'brand-viewport'}
        ref={ref}
        onPointerEnter={e => {
          if (e.pointerType === 'mouse') setInteracting(true);
        }}
        onPointerLeave={() => setInteracting(false)}
        onPointerDown={() => setPaused(true)}
        onFocusCapture={() => setInteracting(true)}
        onBlurCapture={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false);
        }}
        tabIndex={showAll ? undefined : 0}
        role={showAll ? 'list' : 'region'}
        aria-label="Technologies, university, and community initiatives"
      >
        {showAll ? (
          activeBrands.map(b => (
            <div className="brand-logo" key={b.file} role="listitem">
              <img
                src={`./Asset/svg/brand/${b.file}`}
                alt={b.name}
                title={b.name}
                width="150"
                height="60"
                loading="lazy"
              />
              <span>{b.name}</span>
            </div>
          ))
        ) : (
          <div className="brand-rail">
            {[0, 1].map(copy => (
              <div className="brand-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                {activeBrands.map(b => (
                  <div className="brand-logo" key={b.file}>
                    <img
                      src={`./Asset/svg/brand/${b.file}`}
                      alt={copy ? '' : b.name}
                      title={b.name}
                      width="150"
                      height="60"
                      loading="lazy"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

function Portfolio({ onProject, projectsData, sectionData }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(sectionData?.load_more_step ? sectionData.load_more_step * 2 : 9);

  const activeArchive = projectsData && projectsData.length > 0 ? projectsData : archive;
  const activeFeatured = activeArchive.filter(p => p.is_featured);
  const featuredList = activeFeatured.length > 0 ? activeFeatured : activeArchive.slice(0, 3);
  const activeCategories = sectionData?.categories && sectionData.categories.length > 0
    ? sectionData.categories
    : categories;

  const results = activeArchive.filter(
    p =>
      (category === 'All' || p.category === category) &&
      `${p.title} ${p.category} ${p.role} ${p.description}`.toLowerCase().includes(query.toLowerCase())
  );

  const projects = expanded || category !== 'All' || query ? results.slice(0, limit) : featuredList;

  return (
    <section id="portfolio" className="portfolio section-wrap">
      <Reveal className="section-heading">
        <div>
          <span className="eyebrow">{sectionData?.eyebrow || '01 / SELECTED WORK'}</span>
          <h2>
            {sectionData?.heading ? (
              sectionData.heading
            ) : (
              <>ENGINEERING &amp; RESEARCH<span className="accent">.</span></>
            )}
          </h2>
        </div>
        <button
          className="text-link"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
              setCategory('All');
              setQuery('');
            } else {
              setExpanded(true);
              setLimit(9);
            }
          }}
        >
          {expanded ? 'FEATURED SELECTION' : 'ALL PROJECTS'}
          <ArrowRight size={21} />
        </button>
      </Reveal>

      <Reveal className="portfolio-toolbar">
        <div className="filters" role="group" aria-label="Project categories">
          {activeCategories.map(c => (
            <button
              key={c}
              className={category === c ? 'selected' : ''}
              aria-pressed={category === c}
              onClick={() => {
                setCategory(c);
                setExpanded(true);
                setLimit(9);
              }}
            >
              {c}
              {c === category && <motion.span className="filter-line" layoutId="filter-line" />}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={15} />
          <span>Search</span>
          <input
            aria-label="Search projects"
            type="search"
            placeholder={sectionData?.search_placeholder || "Search title, tech, category…"}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setExpanded(true);
              setLimit(9);
            }}
          />
        </label>
      </Reveal>

      <motion.div className="project-grid" layout>
        <AnimatePresence mode="popLayout">
          {projects.map((p, i) => (
            <ProjectCardMotion
              key={p.category + p.title}
              project={p}
              index={i}
              onOpen={onProject}
              MediaImageComponent={MediaImage}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {projects.length === 0 && (
        <div className="empty-state">
          <p>No projects found matching “{query}”.</p>
          <button
            className="text-link"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            Reset search <X size={15} />
          </button>
        </div>
      )}

      {expanded && results.length > limit && (
        <div className="load-more">
          <button className="outline-button" onClick={() => setLimit(v => v + 9)}>
            Load More Projects <Plus size={16} />
          </button>
          <span>
            {projects.length} of {results.length} projects
          </span>
        </div>
      )}

      <BrandStrip brandsData={projectsData ? null : undefined} />
    </section>
  );
}

function Recognition({ onProject, milestonesData, sectionData }) {
  const [expanded, setExpanded] = useState(false);
  const laurelPath =
    'M48 94C8 68 9 30 35 5M22 61C8 60 3 49 3 44c12 0 19 6 19 17zm-5-19C5 35 6 23 8 19c11 5 13 14 9 23zm7-20C15 12 20 3 24 0c7 8 6 16 0 22zM31 79C17 79 8 70 7 64c13-2 22 4 24 15zm-3-18c-5-10-2-19 7-25 5 11 1 20-7 25zm10 24c-6-11-4-20 5-27 6 9 5 20-5 27z';

  const activeMilestones = milestonesData && milestonesData.length > 0
    ? milestonesData
    : verifiedMilestones;

  return (
    <section id="awards" className={`recognition section-wrap ${expanded ? 'awards-expanded' : ''}`}>
      <Reveal className="recognition-intro">
        <span className="eyebrow">{sectionData?.eyebrow || 'CONTRIBUTIONS & RECOGNITION'}</span>
        <h2 className="display">
          {sectionData?.heading ? (
            sectionData.heading
          ) : (
            <>
              THE WORK.
              <br />
              <span className="accent">THE IMPACT.</span>
            </>
          )}
        </h2>
        <div className="award-total">
          <svg viewBox="0 0 60 100" aria-hidden="true">
            <path d={laurelPath} fill="currentColor" />
          </svg>
          <span className="display">
            {sectionData?.total_count || '06'}<span>{sectionData?.total_suffix || '★'}</span>
          </span>
          <svg viewBox="0 0 60 100" aria-hidden="true">
            <g transform="translate(60 0) scale(-1 1)">
              <path d={laurelPath} fill="currentColor" />
            </g>
          </svg>
          <span className="award-total-label">{sectionData?.total_label || 'KEY MILESTONES'}</span>
        </div>
        <p>
          {sectionData?.description || (
            <>
              Rooted in relentless technical inquiry and community stewardship.
              <br />
              Every milestone represents an engineering problem solved and knowledge shared.
            </>
          )}
        </p>
        <button
          className="text-link award-proof"
          onClick={() =>
            onProject({
              title: activeMilestones[0].title,
              category: 'Research Milestone',
              role: 'Lead Researcher',
              year: activeMilestones[0].year,
              description: activeMilestones[0].description,
              image: activeMilestones[0].image_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
              media: activeMilestones[0].link_url || 'https://auranix.tech/research',
              type: 'website'
            })
          }
        >
          {sectionData?.proof_text || 'VIEW RESEARCH ABSTRACT'} <ArrowUpRight size={18} />
        </button>
      </Reveal>

      <div className="recognition-list">
        <div className="recognition-list-head">
          <span>VERIFIED CONTRIBUTIONS</span>
          <span>2024 – 2026</span>
        </div>
        <ol id="recognition-list">
          {activeMilestones.map((award, i) => (
            <Reveal
              as="li"
              className={`recognition-row ${i > 2 ? 'additional-award' : ''}`}
              key={award.title}
              delay={i * 0.045}
            >
              <span className="award-index">0{i + 1}</span>
              <div>
                <h3>{award.title}</h3>
                <p>{award.event || award.description}</p>
              </div>
              <span className="award-year display">{award.year}</span>
            </Reveal>
          ))}
        </ol>
        <button
          className="award-expand"
          aria-expanded={expanded}
          aria-controls="recognition-list"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? 'Collapse milestones' : 'View more milestones'}
          {expanded ? <Minus size={16} /> : <Plus size={16} />}
        </button>
      </div>
    </section>
  );
}

function Breakdown({ sectionData }) {
  const scene = archive.find(p => p.type === 'render');
  const ref = useRef(null);
  const enabled = useContext(MotionContext);
  const [manual, setManual] = useState(false);
  const [cut, setCut] = useState(65);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  useMotionValueEvent(scrollYProgress, 'change', v => {
    if (!manual && enabled) setCut(Math.round(90 - v * 80));
  });

  const titleX = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const rawImg = sectionData?.raw_image || scene?.renders?.[0]?.solid;
  const finalImg = sectionData?.final_image || scene?.renders?.[0]?.final;

  if (!rawImg || !finalImg) return null;

  return (
    <section className="breakdown section-wrap" ref={ref} aria-labelledby="breakdown-title">
      <Reveal className="breakdown-copy">
        <span className="eyebrow">{sectionData?.eyebrow || 'A LOOK UNDER THE HOOD'}</span>
        <motion.h2 id="breakdown-title" className="display" style={enabled ? { x: titleX } : {}}>
          {sectionData?.heading ? (
            sectionData.heading
          ) : (
            <>
              FROM TOPOLOGY.
              <br />
              <span className="accent">TO PRODUCTION.</span>
            </>
          )}
        </motion.h2>
        <p style={{ whiteSpace: 'pre-line' }}>
          {sectionData?.description || 'One system. Layered engineering.\nInspect how network topology, cybersecurity telemetry, and algorithmic logic transform into a responsive mission-critical monitoring dashboard.'}
        </p>
        <span className="breakdown-credit" style={{ whiteSpace: 'pre-line' }}>
          {sectionData?.credit || 'ZENITH CYBERSECURITY SUITE / 2026\nZERO-TRUST ARCHITECTURE · TELEMETRY VISUALIZATION'}
        </span>
      </Reveal>

      <Reveal className="comparison">
        <div className="comparison-stage" style={{ '--cut': `${enabled || manual ? cut : 50}%` }}>
          <MediaImage src={rawImg} alt="Logical network topology and security packet model" />
          <div className="comparison-final">
            <MediaImage src={finalImg} alt="Final production cybersecurity dashboard interface" />
          </div>
          <span className="comparison-label raw-label">{sectionData?.raw_label || 'TOPOLOGY WIREFRAME'}</span>
          <span className="comparison-label final-label">{sectionData?.final_label || 'PRODUCTION DASHBOARD'}</span>
          <div className="comparison-divider">
            <span>
              <ChevronLeft size={14} />
              <ChevronRight size={14} />
            </span>
          </div>
          <input
            aria-label="Comparison between raw architecture and live production system"
            aria-valuetext={`${cut}% architecture, ${100 - cut}% production interface`}
            type="range"
            min="0"
            max="100"
            value={cut}
            onChange={e => {
              setManual(true);
              setCut(Number(e.target.value));
            }}
          />
        </div>
        <div className="comparison-caption">
          <span>DRAG SLIDER TO INSPECT SYSTEM LAYERS</span>
          <span>DRAG / SCROLL</span>
        </div>
      </Reveal>
    </section>
  );
}

function AuraNixSection({ onProject, sectionData }) {
  const defaultPillars = [
    { title: 'Autonomous AI & Agents', description: 'Next-generation human-in-the-loop multi-agent systems and cognitive decision automation.' },
    { title: 'Scalable Web Architecture', description: 'Ultra-low-latency web applications, high-performance APIs, and reactive frontend ergonomics.' },
    { title: 'Hardened Security & Networks', description: 'Zero-trust architecture, encrypted communication conduits, and resilient infrastructure design.' }
  ];

  const pillars = sectionData?.pillars || defaultPillars;

  return (
    <section id="auranix" className="auranix-section section-wrap">
      <Reveal className="auranix-header">
        <div>
          <span className="eyebrow">{sectionData?.eyebrow || 'VENTURE & INNOVATION'}</span>
          <h2 className="display">
            {sectionData?.heading ? (
              sectionData.heading
            ) : (
              <>AURANIX <span className="accent">TECHNOLOGIES.</span></>
            )}
          </h2>
        </div>
        <a className="text-link" href={sectionData?.visit_url || 'https://auranix.tech'} target="_blank" rel="noopener noreferrer">
          {sectionData?.visit_label || 'VISIT AURANIX.TECH'} <ArrowUpRight size={18} />
        </a>
      </Reveal>

      <div className="auranix-grid">
        <Reveal className="auranix-left">
          <p>
            {sectionData?.description || (
              <>
                Founded by Jamshed Ali, <strong>AuraNix Technologies</strong> (
                <a href={sectionData?.visit_url || 'https://auranix.tech'} style={{ color: 'var(--red)', textDecoration: 'underline' }}>
                  auranix.tech
                </a>
                ) bridges cutting-edge research in artificial intelligence and cybersecurity with enterprise-grade software
                engineering.
              </>
            )}
          </p>
          <div className="auranix-pillars">
            {pillars.map((pil, idx) => (
              <div key={idx} className="auranix-pillar">
                <h4>{pil.title}</h4>
                <p>{pil.description}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="auranix-card">
          <div className="auranix-brand-top">
            <img src={sectionData?.card_logo || './Asset/img/auranix-logo.png'} alt="AuraNix Technologies Logo" width="46" height="46" />
            <span className="auranix-badge">{sectionData?.card_badge || 'FOUNDER & CEO VENTURE'}</span>
          </div>
          <blockquote className="auranix-quote">
            {sectionData?.card_quote || '“True innovation begins when deep technological rigor aligns with human purpose.”'}
          </blockquote>
          <div className="auranix-meta">
            <span>Official Domain: {sectionData?.card_domain || 'auranix.tech'}</span>
            <a href={sectionData?.visit_url || 'https://auranix.tech'} target="_blank" rel="noopener noreferrer">
              {sectionData?.card_domain || 'auranix.tech'} <ExternalLink size={13} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const processSteps = [
  ['01', 'THE ARCHITECTURE', 'Deconstructing requirements, threat boundaries, and system constraints into a solid modular foundation.'],
  ['02', 'THE ALGORITHM', 'Crafting deterministic data structures and performant algorithmic logic optimized for throughput.'],
  ['03', 'THE INTERFACE', 'Engineering responsive, accessible frontend ergonomics with dark cinematic polish and pixel precision.'],
  ['04', 'THE HARDENING', 'Rigorous stress-testing, security audits, static analysis, and cross-platform verification.'],
  ['05', 'THE DEPLOYMENT', 'Continuous integration, automated build pipelines, and production deployment with live telemetry.']
];

function About({ sectionData }) {
  const enabled = useContext(MotionContext);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 75%'] });

  const defaultFoundationRows = [
    { title: 'Sukkur IBA University', badge: 'CSE-V', text: 'B.S. in Computer Systems Engineering. Microprocessors, algorithms, operating systems, and networking.' },
    { title: 'AuraNix Technologies', badge: 'Founder & CEO', text: 'Technology enterprise delivering intelligent software, AI agents, and secure digital infrastructure.' },
    { title: 'Community Leadership & Training', badge: 'Lead & Trainer', text: 'WordPress Campus Connect (Sukkur IBA) · Dream Institute Sukkur · CSE Society Lead' }
  ];

  const foundationRows = sectionData?.foundation_rows || defaultFoundationRows;

  const defaultSkillTags = [
    'C / C++', 'Python', 'JavaScript / Node.js', 'Java', 'React', 'WordPress & PHP',
    'Machine Learning', 'Cybersecurity', 'Computer Networks', 'Signals & Systems',
    'Cisco Packet Tracer', 'Technical Writing'
  ];

  const skillTags = sectionData?.skill_tags || defaultSkillTags;

  const defaultSoftwareIcons = [
    { file: 'vscode', name: 'VS Code' },
    { file: 'python', name: 'Python' },
    { file: 'javascript', name: 'JavaScript' },
    { file: 'cpp', name: 'C++' },
    { file: 'java', name: 'Java' },
    { file: 'react', name: 'React' },
    { file: 'nodejs', name: 'Node.js' },
    { file: 'git', name: 'Git' },
    { file: 'wordpress', name: 'WordPress' },
    { file: 'cisco', name: 'Cisco Packet Tracer' }
  ];

  const softwareIcons = sectionData?.software_icons || defaultSoftwareIcons;

  const processList = sectionData?.process_steps || processSteps.map(p => ({ num: p[0], title: p[1], text: p[2] }));

  return (
    <section id="about" className="about section-wrap" ref={ref}>
      <Reveal className="about-lead">
        <div>
          <span className="eyebrow">{sectionData?.eyebrow || '02 / BEHIND THE TERMINAL'}</span>
          <h2 className="display">
            {sectionData?.heading ? (
              sectionData.heading
            ) : (
              <>
                NOT JUST CODE.
                <br />
                BUT SOLVING <span className="accent">MEANINGFUL PROBLEMS.</span>
              </>
            )}
          </h2>
        </div>
        <p style={{ whiteSpace: 'pre-line' }}>
          {sectionData?.description || 'I am Jamshed Ali, a Computer Systems Engineering student at Sukkur IBA University, researcher, and developer from Sukkur, Pakistan. Working across AI, cybersecurity, and full-stack software development, I combine engineering precision with creative craftsmanship.'}
        </p>
      </Reveal>

      <div className="studio-grid">
        <Reveal className="education-panel">
          <h3 className="panel-heading">{sectionData?.foundation_heading || 'ACADEMIC & TECHNICAL FOUNDATION'}</h3>
          <p className="eyebrow accent">{sectionData?.foundation_subheading || 'EDUCATION & VENTURE'}</p>

          {foundationRows.map((row, idx) => (
            <div key={idx} className="education-row">
              <strong>{row.title}</strong>
              {row.badge && <span>{row.badge}</span>}
              <p>{row.text}</p>
            </div>
          ))}

          <p className="eyebrow accent skills-heading">{sectionData?.toolkit_heading || 'TECHNICAL TOOLKIT'}</p>
          <div className="skill-tags">
            {skillTags.map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>

          <div className="software-row">
            {softwareIcons.map(item => {
              const file = item.file || item[0];
              const name = item.name || item[1];
              return (
                <img
                  key={file}
                  src={`./Asset/svg/${file}.svg`}
                  alt={name}
                  title={name}
                  loading="lazy"
                  width="28"
                  height="28"
                />
              );
            })}
          </div>
        </Reveal>

        <div className="process-panel">
          <Reveal>
            <h3 className="panel-heading">{sectionData?.process_heading || 'FROM CONCEPT TO PRODUCTION'}</h3>
          </Reveal>
          <div className="process-list">
            <div className="process-track">
              <motion.div style={{ scaleY: enabled ? scrollYProgress : 1 }} />
            </div>
            {processList.map((step, i) => (
              <Reveal key={step.num || i} className="process-row" delay={i * 0.035}>
                <span className="process-num display">{step.num}</span>
                <span className="process-node" />
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="quote-panel">
          <span className="quote-mark display">“</span>
          <blockquote style={{ whiteSpace: 'pre-line' }}>
            {sectionData?.quote_text || (
              <>
                Code is poetry,
                <br />
                and every coder
                <br />
                <em>is a poet.</em>
              </>
            )}
          </blockquote>
          <span className="handwriting">{sectionData?.quote_author || 'Jamshed Ali'}</span>
          <div className="quote-bottom">
            <span style={{ whiteSpace: 'pre-line' }}>{sectionData?.quote_subtext || 'BUILDING IDEAS\nINTO MEANINGFUL REALITY.'}</span>
            <span className="quote-symbol" aria-hidden="true">
              ✳
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Journey({ onProject, experiencesData, milestonesData, sectionData }) {
  const [open, setOpen] = useState(0);

  const activeExp = experiencesData && experiencesData.length > 0 ? experiencesData : experiences;
  const activeMs = milestonesData && milestonesData.length > 0 ? milestonesData : verifiedMilestones;

  return (
    <section id="experience" className="journey section-wrap">
      <Reveal className="section-heading">
        <div>
          <span className="eyebrow">{sectionData?.eyebrow || '03 / THE JOURNEY'}</span>
          <h2>
            {sectionData?.heading ? (
              sectionData.heading
            ) : (
              <>DISCIPLINE. INNOVATION. MOMENTUM<span className="accent">.</span></>
            )}
          </h2>
        </div>
        <a className="text-link" href={sectionData?.resume_url || "./Asset/cv/Jamshed_Ali_Resume.pdf"} download="Jamshed_Ali_Resume.pdf">
          {sectionData?.resume_label || 'RESUME'} <Download size={16} />
        </a>
      </Reveal>

      <div className="journey-grid">
        <AnimatedTimeline experiences={activeExp} openIndex={open} onToggle={setOpen} />

        <Reveal className="awards-panel">
          <p className="eyebrow">{sectionData?.milestones_eyebrow || 'KEY MILESTONES'}</p>
          <h3 className="display">
            {sectionData?.milestones_heading ? (
              sectionData.milestones_heading
            ) : (
              <>
                REAL WINS.
                <br />
                <span className="accent">MEASURABLE IMPACT.</span>
              </>
            )}
          </h3>
          <div className="award-list">
            {activeMs.slice(0, 5).map((cert, i) => (
              <button
                key={cert.title}
                onClick={() =>
                  onProject({
                    title: cert.title,
                    type: 'website',
                    media: cert.link_url || 'https://auranix.tech',
                    category: cert.category || 'Milestone',
                    role: cert.event || 'Contribution',
                    year: cert.year,
                    description: cert.description,
                    image: cert.image_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop'
                  })
                }
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>
                  {cert.title}
                  <small>{cert.year}</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Contact({ onProject, contactData, featuredProject }) {
  const [sent, setSent] = useState(false);

  const send = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = `Hello Jamshed, I am ${data.get('name')}.\n\nProject Scope: ${data.get('type')}\n\nDetails:\n${data.get('message')}`;
    const rawTarget = contactData?.cta_url || 'https://wa.me/923701228685';
    const baseUrl = rawTarget.split('?')[0];
    window.open(`${baseUrl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  const targetFeatured = featuredProject || featured[0];

  return (
    <section id="contact" className="contact section-wrap">
      <div className="contact-grid">
        <Reveal className="contact-intro">
          <span className="eyebrow">{contactData?.eyebrow || '04 / INITIATE CONTACT'}</span>
          <h2 className="display">
            {contactData?.heading ? (
              contactData.heading
            ) : (
              <>
                LET’S WORK
                <br />
                TOGETHER<span className="accent">.</span>
              </>
            )}
          </h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            {contactData?.description || 'Have a project, research inquiry, or engineering problem in mind?\nLet’s engineer something exceptional together.'}
          </p>
          <Magnetic
            href={contactData?.cta_url || "https://wa.me/923701228685"}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-cta"
          >
            <span className="round-arrow">
              <ArrowUpRight size={21} />
            </span>
            {contactData?.cta_label || 'START A CONVERSATION'}
          </Magnetic>
        </Reveal>

        <Reveal className="contact-links" delay={0.1}>
          <a href={contactData?.channels?.find(c => c.type === 'email')?.href || "mailto:engr.jamshed.ali.rind@gmail.com"}>
            <Mail />
            <span>
              <small>PRIMARY EMAIL</small>
              {contactData?.channels?.find(c => c.type === 'email')?.value || 'engr.jamshed.ali.rind@gmail.com'}
            </span>
            <ArrowUpRight size={16} />
          </a>
          <a href={contactData?.channels?.find(c => c.type === 'linkedin')?.href || "https://linkedin.com/in/jamshedali"} target="_blank" rel="noopener noreferrer">
            <Linkedin />
            <span>
              <small>LINKEDIN</small>
              {contactData?.channels?.find(c => c.type === 'linkedin')?.value || 'linkedin.com/in/jamshedali'}
            </span>
            <ArrowUpRight size={16} />
          </a>
          <a href={contactData?.channels?.find(c => c.type === 'github')?.href || "https://github.com/auranixtech"} target="_blank" rel="noopener noreferrer">
            <Github />
            <span>
              <small>GITHUB / CODE</small>
              {contactData?.channels?.find(c => c.type === 'github')?.value || 'github.com/auranixtech'}
            </span>
            <ArrowUpRight size={16} />
          </a>
          <a href={contactData?.channels?.find(c => c.type === 'phone')?.href || "https://wa.me/923701228685"} target="_blank" rel="noopener noreferrer">
            <Phone />
            <span>
              <small>WHATSAPP / DIRECT</small>
              {contactData?.channels?.find(c => c.type === 'phone')?.value || '+92 370 1228685'}
            </span>
            <ArrowUpRight size={16} />
          </a>
          <div>
            <MapPin />
            <span>
              <small>ACADEMIC &amp; WORK BASE</small>
              {contactData?.channels?.find(c => c.type === 'location')?.value || 'Sukkur, Sindh, Pakistan'}
            </span>
          </div>
        </Reveal>

        <Reveal className="contact-reel" delay={0.2}>
          <button
            onClick={() => onProject(targetFeatured)}
            aria-label="Explore Jamshed Ali's Featured Research Project"
          >
            <div className="reel-screen">
              <span className="reel-screen-top">
                JAMSHED ALI®<span>AI &amp; SECURITY RESEARCH</span>
              </span>
              <MediaImage src={targetFeatured?.image || targetFeatured?.image_url} alt="Featured Agentic AI Cyber-Defense Project" />
              <span className="reel-screen-title display">
                MAKE IT
                <br />
                <span>RESILIENT.</span>
              </span>
              <span className="play-circle">
                <Play size={18} fill="currentColor" />
              </span>
            </div>
            <span className="reel-caption">CLICK TO INSPECT AGENTIC AI FRAMEWORK.</span>
          </button>
        </Reveal>
      </div>

      <Reveal>
        <details className="project-brief">
          <summary>
            {contactData?.brief_summary || 'Send a Project Brief'} <Plus size={19} />
          </summary>
          <form
            onSubmit={send}
            toolname="contactJamshed"
            tooldescription="Submit a collaboration inquiry, project brief, or message directly to Jamshed Ali."
            data-tool-name="contactJamshed"
            data-tool-description="Submit a collaboration inquiry, project brief, or message directly to Jamshed Ali."
          >
            <label>
              Your Name / Organization
              <input name="name" required placeholder="Name, team, or university" autoComplete="name" maxLength="100" />
            </label>
            <label>
              Project Scope &amp; Focus
              <select name="type">
                <option>Artificial Intelligence &amp; Autonomous Agents</option>
                <option>Full-Stack Web &amp; Software Development</option>
                <option>Cybersecurity &amp; Network Architecture</option>
                <option>WordPress Enterprise &amp; Custom Themes</option>
                <option>Academic Research &amp; Technical Writing</option>
                <option>Engineering Consulting &amp; Solutions</option>
              </select>
            </label>
            <label className="brief-message">
              Project Description &amp; Objectives
              <textarea
                name="message"
                required
                rows="3"
                placeholder="Briefly describe your objectives, technical requirements, and estimated timeframe…"
                maxLength="3000"
              />
            </label>
            <button className="solid-button" type="submit">
              Proceed to WhatsApp Brief <ArrowUpRight size={18} />
            </button>
            <p className="form-note" role="status">
              {sent
                ? 'Brief prepared. The message draft is opening in WhatsApp.'
                : (contactData?.brief_note || 'This brief directly formats and opens a message draft in WhatsApp.')}
            </p>
          </form>
        </details>
      </Reveal>
    </section>
  );
}

function ProjectDialog({ project, onClose }) {
  const ref = useRef(null);
  const [renderMode, setRenderMode] = useState('final');
  const [shot, setShot] = useState(0);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [retried, setRetried] = useState(0);
  const enabled = useContext(MotionContext);

  const activeShot = project.type === 'render' && project.renders ? project.renders[shot] : null;
  const embedType = activeShot?.video ? 'youtube' : activeShot?.drive ? 'drive' : project.type;
  const embedMedia = activeShot?.video || activeShot?.drive?.match(/\/d\/([^/]+)/)?.[1] || project.media;
  const isVideo = ['youtube', 'drive'].includes(embedType);

  const availableModes = [
    ['solid', 'Topology'],
    ['material', 'Architecture'],
    ['final', 'Production System']
  ].filter(([mode]) => activeShot?.[mode]);

  const effectiveMode = activeShot?.[renderMode] ? renderMode : availableModes[0]?.[0];
  const rendered = activeShot?.[effectiveMode] || activeShot?.image || project.image;
  const sourceUrl =
    embedType === 'youtube'
      ? `https://www.youtube.com/watch?v=${embedMedia}`
      : embedType === 'drive'
        ? `https://drive.google.com/file/d/${embedMedia}/view`
        : project.type === 'render'
          ? rendered
          : project.media || project.image;

  const changeShot = next => {
    setMediaLoaded(false);
    setMediaFailed(false);
    setShot(next);
  };

  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();

    const listener = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = [
          ...ref.current.querySelectorAll('button, a[href], input, select, textarea, iframe')
        ].filter(n => !n.disabled && n.getClientRects().length);
        const first = nodes[0];
        const last = nodes.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', listener);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener('keydown', listener);
      previous?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!isVideo) return;
    const timer = setTimeout(() => {
      if (!mediaLoaded) setMediaFailed(true);
    }, 14000);
    return () => clearTimeout(timer);
  }, [mediaLoaded, retried, isVideo, embedMedia]);

  return (
    <motion.div
      className="dialog-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        className="project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex="-1"
        initial={enabled ? { y: 45, scale: 0.97 } : false}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="dialog-heading">
          <span className="eyebrow">
            {project.category} {project.year && ` / ${project.year}`}
          </span>
          <button onClick={onClose} className="icon-button" aria-label="Close project modal">
            <X />
          </button>
        </div>

        <div className={`dialog-media ${!isVideo ? 'still' : ''}`}>
          {isVideo ? (
            <>
              {!mediaLoaded && (
                <div className="media-loading" role="status">
                  {mediaFailed ? (
                    <>
                      <p>Preview stream could not be loaded. Open the direct link to view.</p>
                      <button
                        className="outline-button"
                        onClick={() => {
                          setMediaFailed(false);
                          setMediaLoaded(false);
                          setRetried(v => v + 1);
                        }}
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={enabled ? 'loading-ring' : 'loading-ring paused'} />
                      <p>Loading media stream…</p>
                    </>
                  )}
                </div>
              )}
              <iframe
                key={`${embedMedia}-${retried}`}
                src={
                  embedType === 'youtube'
                    ? `https://www.youtube-nocookie.com/embed/${embedMedia}?autoplay=1&rel=0`
                    : `https://drive.google.com/file/d/${embedMedia}/preview`
                }
                title={project.title}
                width="1280"
                height="720"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={() => {
                  setMediaLoaded(true);
                  setMediaFailed(false);
                }}
                onError={() => setMediaFailed(true)}
              />
            </>
          ) : (
            <MediaImage src={rendered} alt={project.title} priority />
          )}
        </div>

        {project.type === 'render' && availableModes.length > 0 && (
          <div className="render-controls">
            <div role="group" aria-label="Architecture view mode">
              {availableModes.map(([mode, label]) => (
                <button
                  key={mode}
                  className={effectiveMode === mode ? 'selected' : ''}
                  onClick={() => setRenderMode(mode)}
                  aria-pressed={effectiveMode === mode}
                >
                  {label}
                </button>
              ))}
            </div>
            {project.renders && project.renders.length > 1 && (
              <div className="shot-controls">
                <button
                  className="icon-button"
                  aria-label="Previous view"
                  onClick={() => changeShot((shot - 1 + project.renders.length) % project.renders.length)}
                >
                  <ChevronLeft />
                </button>
                <span>
                  VIEW {shot + 1} / {project.renders.length}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next view"
                  onClick={() => changeShot((shot + 1) % project.renders.length)}
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="dialog-description">
          <div>
            <h2 id="dialog-title">{project.title}</h2>
            {project.role && <span className="accent">{project.role}</span>}
            <p>{project.description}</p>
          </div>
          {sourceUrl && (
            <a className="outline-button" href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {project.type === 'website'
                ? 'Visit Live Platform'
                : project.category === 'Research'
                  ? 'Access Research Paper'
                  : 'Open Resource'}
              <ExternalLink size={15} />
            </a>
          )}
        </div>
        {isVideo && (
          <p className="embed-note">If external video embedding is restricted, use the direct link above.</p>
        )}
      </motion.div>
    </motion.div>
  );
}

function App() {
  const reduced = useReducedMotion();
  const [motionOn, setMotionOn] = useState(() => {
    try {
      return localStorage.getItem('jamshed-motion') !== 'off';
    } catch {
      return true;
    }
  });

  const enabled = motionOn && !reduced;
  const [project, setProject] = useState(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 28, restDelta: 0.001 });

  const [cmsData, setCmsData] = useState(null);

  useEffect(() => {
    const isPreview = window.location.search.includes('preview=true');
    const endpoint = isPreview ? '/api/content?draft=true' : '/api/content';
    fetch(endpoint)
      .then(r => r.json())
      .then(d => {
        if (d && d.sections) setCmsData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  }, [enabled]);

  const toggle = () => {
    const next = !motionOn;
    setMotionOn(next);
    try {
      localStorage.setItem('jamshed-motion', next ? 'on' : 'off');
    } catch { }
  };

  const close = useCallback(() => setProject(null), []);

  const d = cmsData || {};
  const sections = d.sections || {};
  const projects = d.projects && d.projects.length > 0 ? d.projects : archive;
  const clusters = d.clusters || null;
  const experiencesData = d.experiences || experiences;
  const milestonesData = d.milestones || verifiedMilestones;
  const brandsData = d.brands || brands;
  const navData = sections.navigation || null;
  const footerData = sections.footer || null;

  const sectionRenderers = {
    hero: () => <Hero key="hero" onProject={setProject} heroData={sections.hero} featuredProject={projects[0]} />,
    portfolio: () => <Portfolio key="portfolio" onProject={setProject} projectsData={projects} sectionData={sections.portfolio} />,
    brands: () => <BrandStrip key="brands" brandsData={brandsData} sectionData={sections.brands} />,
    recognition: () => <Recognition key="recognition" onProject={setProject} milestonesData={milestonesData} sectionData={sections.recognition} />,
    breakdown: () => <Breakdown key="breakdown" sectionData={sections.breakdown} />,
    auranix: () => <AuraNixSection key="auranix" onProject={setProject} sectionData={sections.auranix} />,
    ecosystem: () => <TechEcosystem key="ecosystem" clusters={clusters} sectionData={sections.ecosystem} />,
    about: () => <About key="about" sectionData={sections.about} />,
    journey: () => <Journey key="journey" onProject={setProject} experiencesData={experiencesData} milestonesData={milestonesData} sectionData={sections.journey} />,
    contact: () => <Contact key="contact" onProject={setProject} contactData={sections.contact} featuredProject={projects[0]} />
  };

  return (
    <MotionContext.Provider value={enabled}>
      <MotionConfig reducedMotion={enabled ? 'user' : 'always'} transition={{ ease: EASE }}>
        <a className="skip-link" href="#portfolio">
          Skip to works
        </a>
        <motion.div className="reading-progress" style={{ scaleX: enabled ? progress : scrollYProgress }} />
        <Header enabled={enabled} onToggle={toggle} navigationData={navData} />
        <main>
          {d.sectionsList && d.sectionsList.length > 0 ? (
            d.sectionsList
              .filter(s => s.is_visible !== false)
              .sort((a, b) => a.display_order - b.display_order)
              .map(s => sectionRenderers[s.key]?.())
          ) : (
            <>
              <Hero onProject={setProject} heroData={sections.hero} featuredProject={projects[0]} />
              <Portfolio onProject={setProject} projectsData={projects} sectionData={sections.portfolio} />
              <Recognition onProject={setProject} milestonesData={milestonesData} sectionData={sections.recognition} />
              <Breakdown sectionData={sections.breakdown} />
              <AuraNixSection onProject={setProject} sectionData={sections.auranix} />
              <TechEcosystem clusters={clusters} sectionData={sections.ecosystem} />
              <About sectionData={sections.about} />
              <Journey onProject={setProject} experiencesData={experiencesData} milestonesData={milestonesData} sectionData={sections.journey} />
              <Contact onProject={setProject} contactData={sections.contact} featuredProject={projects[0]} />
            </>
          )}
        </main>
        <footer className="footer">
          <a className="wordmark" href="#home">
            {footerData?.wordmark ? footerData.wordmark.replace('®', '') : 'JAMSHED ALI'}<span>®</span>
          </a>
          <span>{footerData?.copyright || `© ${new Date().getFullYear()} JAMSHED ALI. CODE IS POETRY. ALL RIGHTS RESERVED.`}</span>
          <div className="footer-links" style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/about" style={{ color: 'inherit', textDecoration: 'none', fontSize: '11px' }}>About</a>
            <a href="/contact" style={{ color: 'inherit', textDecoration: 'none', fontSize: '11px' }}>Contact</a>
            <a href="/terms" style={{ color: 'inherit', textDecoration: 'none', fontSize: '11px' }}>Terms</a>
            <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none', fontSize: '11px' }}>Privacy</a>
            <a href="/llms.txt" style={{ color: 'inherit', textDecoration: 'none', fontSize: '11px' }}>llms.txt</a>
          </div>
          <div>
            <a
              href={footerData?.github_url || "https://github.com/auranixtech"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub @auranixtech"
            >
              <Github size={17} />
            </a>
            <a
              href={footerData?.linkedin_url || "https://linkedin.com/in/jamshedali"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Jamshed Ali"
            >
              <Linkedin size={17} />
            </a>
            <a href="#home" aria-label="Back to top">
              <ArrowUpRight size={18} />
            </a>
          </div>
        </footer>
        <AnimatePresence>
          {project && <ProjectDialog key={project.title} project={project} onClose={close} />}
        </AnimatePresence>
      </MotionConfig>
    </MotionContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
