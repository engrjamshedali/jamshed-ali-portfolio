import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'data', 'portfolio.db');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      is_visible INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      layout_variant TEXT DEFAULT 'default',
      content TEXT NOT NULL,
      draft_content TEXT,
      has_draft INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      year TEXT,
      role TEXT,
      description TEXT NOT NULL,
      full_content TEXT,
      type TEXT DEFAULT 'website',
      media_url TEXT,
      image_url TEXT NOT NULL,
      renders TEXT,
      is_featured INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cluster_id TEXT NOT NULL,
      cluster_name TEXT NOT NULL,
      cluster_icon TEXT,
      cluster_color TEXT,
      cluster_description TEXT,
      name TEXT NOT NULL,
      level TEXT,
      icon TEXT,
      project TEXT,
      display_order INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_range TEXT NOT NULL,
      title TEXT NOT NULL,
      place TEXT NOT NULL,
      description TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT NOT NULL,
      title TEXT NOT NULL,
      event TEXT NOT NULL,
      description TEXT NOT NULL,
      link_url TEXT,
      image_url TEXT,
      category TEXT DEFAULT 'Milestone',
      display_order INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      category TEXT,
      link_url TEXT,
      display_order INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      category TEXT DEFAULT 'general',
      alt_text TEXT,
      caption TEXT,
      url TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      revision_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      author TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

// Seed all existing verified portfolio content
function seedInitialData() {
  // Check if admin user exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@123456', salt);
    db.prepare(`
      INSERT INTO admin_users (username, email, password_hash)
      VALUES (?, ?, ?)
    `).run('admin', 'engr.jamshed.ali.rind@gmail.com', hash);
  }

  // Check if settings exist
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get().count;
  if (settingsCount === 0) {
    const initialSettings = {
      general: {
        site_title: 'JAMSHED ALI | Computer Systems Engineering Student, Developer & Founder',
        site_description: 'Jamshed Ali. Computer Systems Engineering student at Sukkur IBA University, Developer, Researcher, and Founder of AuraNix Technologies.',
        author_name: 'Jamshed Ali',
        tagline: 'Building ideas into reality.',
        location: 'Sukkur, Sindh, Pakistan',
        email: 'engr.jamshed.ali.rind@gmail.com',
        phone: '+92 370 1228685',
        favicon: './Asset/img/favicon.svg',
        logo_text: 'JAMSHED ALI®',
        language: 'en'
      },
      seo: {
        meta_title: 'JAMSHED ALI | Computer Systems Engineering Student, Developer & Founder',
        meta_description: 'Engineering digital experiences, AI research, and high-performance software solutions. Explore the portfolio of Jamshed Ali.',
        og_image: './Asset/img/jamshed-portrait.png',
        keywords: 'Jamshed Ali, AuraNix Technologies, Computer Systems Engineering, Sukkur IBA University, AI, Cybersecurity, Full-Stack Developer'
      },
      social: {
        github: 'https://github.com/auranixtech',
        linkedin: 'https://linkedin.com/in/jamshedali',
        whatsapp: 'https://wa.me/923701228685',
        email: 'mailto:engr.jamshed.ali.rind@gmail.com',
        auranix: 'https://auranix.tech'
      },
      appearance: {
        accent_color: '#ef4151',
        accent_dark: '#ca2032',
        background_color: '#090909',
        panel_color: '#101010',
        font_display: 'Anton',
        font_body: 'Manrope',
        font_handwriting: 'Caveat',
        motion_default: true
      }
    };

    const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    for (const [key, val] of Object.entries(initialSettings)) {
      insertSetting.run(key, JSON.stringify(val));
    }
  }

  // Check sections
  const sectionsCount = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;
  if (sectionsCount === 0) {
    const initialSections = [
      {
        section_key: 'hero',
        title: 'Hero Section',
        subtitle: 'Introduction, portrait, stats and primary call-to-actions',
        display_order: 1,
        content: {
          eyebrow1: 'ENGINEER / DEVELOPER / RESEARCHER',
          eyebrow2: 'FOUNDER OF AURANIX TECHNOLOGIES',
          availability_text: 'AVAILABLE FOR PROJECTS',
          availability_active: true,
          background_word: 'PORTFOLIO',
          portrait_image: './Asset/img/jamshed-portrait.png',
          portrait_alt: 'Jamshed Ali - Computer Systems Engineering Student, Developer and Founder',
          handwriting_tagline: 'Building ideas into reality.',
          name_heading: 'JAMSHED ALI.',
          dynamic_keywords: [
            'COMPUTER SYSTEMS ENGINEERING',
            'AUTONOMOUS AI RESEARCHER',
            'CYBER-DEFENSE ARCHITECT',
            'FOUNDER · AURANIX TECHNOLOGIES'
          ],
          bio_description: 'I explore technology, engineer digital experiences, and transform complex ideas into meaningful solutions.',
          primary_cta_label: 'Explore My Work',
          primary_cta_url: '#portfolio',
          location_label: 'SUKKUR, PAKISTAN',
          manifesto_quote: 'Code is poetry.\nEvery coder is a poet.',
          stats: [
            { value: '05+', title: 'SEMESTER LEVEL (CSE-V)\nSUKKUR IBA UNIVERSITY' },
            { value: '15+', title: 'SYSTEMS & TECH\nPROJECTS BUILT' },
            { value: '01★', title: 'AURANIX TECH', link: '#auranix' }
          ],
          cv_download_label: 'DOWNLOAD CV',
          cv_download_url: './Asset/cv/Jamshed_Ali_Resume.pdf',
          bottom_reel_title: 'FEATURED RESEARCH',
          bottom_reel_subtitle: 'AGENTIC AI CYBER-DEFENSE',
          scroll_prompt: 'SCROLL TO DISCOVER',
          edition_label: 'ENGINEERING & RESEARCH / 2024–2026'
        }
      },
      {
        section_key: 'portfolio',
        title: 'Selected Works',
        subtitle: 'Engineering archive & deployed systems gallery',
        display_order: 2,
        content: {
          eyebrow: '01 / SELECTED WORKS',
          heading: 'ENGINEERING ARCHIVE & DEPLOYED SYSTEMS.',
          categories: [
            'All',
            'Research',
            'Web Development',
            'AI & ML',
            'Cybersecurity',
            'Networking',
            'WordPress',
            'Writing',
            'Creative Experiments'
          ],
          search_placeholder: 'Search archive…',
          load_more_step: 6
        }
      },
      {
        section_key: 'brands',
        title: 'Tech Ecosystem Rail',
        subtitle: 'Auto-scrolling connected ecosystem brand strip',
        display_order: 3,
        content: {
          eyebrow_prefix: 'CONNECTED WITH',
          heading_highlight: 'THE BROADER TECH ECOSYSTEM.'
        }
      },
      {
        section_key: 'recognition',
        title: 'Recognition & Contributions',
        subtitle: 'Scholarship, department leadership, and milestones showcase',
        display_order: 4,
        content: {
          eyebrow: 'RECOGNITION & CONTRIBUTIONS',
          heading: 'SCHOLARSHIP. LEADERSHIP. IMPACT.',
          description: 'Academic achievements, department leadership roles, and technical workshops conducted across Sukkur IBA University and regional engineering forums.',
          total_count: '06',
          total_suffix: '★',
          total_label: 'KEY MILESTONES',
          proof_text: 'ALL MILESTONES INDEPENDENTLY VERIFIED'
        }
      },
      {
        section_key: 'breakdown',
        title: 'System Deconstruction',
        subtitle: 'Interactive comparison between blueprint topology and live dashboard',
        display_order: 5,
        content: {
          eyebrow: 'SYSTEM DECONSTRUCTION',
          heading: 'FROM BLUEPRINT TO PRODUCTION SYSTEM.',
          description: 'Comparing zero-trust network packet architecture and topology wireframes with real-time operational security dashboards.',
          credit: 'ZENITH SECURITY SUITE · TOPOLOGY VS PRODUCTION',
          raw_label: 'TOPOLOGY WIREFRAME',
          raw_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
          final_label: 'PRODUCTION DASHBOARD',
          final_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop'
        }
      },
      {
        section_key: 'auranix',
        title: 'AuraNix Venture Spotlight',
        subtitle: 'Dedicated corporate showcase for auranix.tech',
        display_order: 6,
        content: {
          eyebrow: 'VENTURE & INNOVATION',
          heading: 'AURANIX TECHNOLOGIES.',
          visit_label: 'VISIT AURANIX.TECH',
          visit_url: 'https://auranix.tech',
          description: 'Founded by Jamshed Ali, AuraNix Technologies bridges cutting-edge research in artificial intelligence and cybersecurity with enterprise-grade software engineering.',
          pillars: [
            {
              title: 'Autonomous AI & Agents',
              description: 'Next-generation human-in-the-loop multi-agent systems and cognitive decision automation.'
            },
            {
              title: 'Scalable Web Architecture',
              description: 'Ultra-low-latency web applications, high-performance APIs, and reactive frontend ergonomics.'
            },
            {
              title: 'Hardened Security & Networks',
              description: 'Zero-trust architecture, encrypted communication conduits, and resilient infrastructure design.'
            }
          ],
          card_badge: 'FOUNDER & CEO VENTURE',
          card_logo: './Asset/img/auranix-logo.png',
          card_quote: '“True innovation begins when deep technological rigor aligns with human purpose.”',
          card_domain: 'auranix.tech'
        }
      },
      {
        section_key: 'ecosystem',
        title: 'Skills & Tech Ecosystem',
        subtitle: 'Interactive technology clusters and node telemetry inspector',
        display_order: 7,
        content: {
          eyebrow: 'SYSTEM CAPABILITIES',
          heading: 'TECHNOLOGY CLUSTERS & CORE COMPETENCIES.',
          description: 'Interactive telemetry matrix detailing core systems programming, AI pipelines, network infrastructure, and software ergonomics.'
        }
      },
      {
        section_key: 'about',
        title: 'About Section',
        subtitle: 'Behind the terminal, academic foundation, process steps, and creator philosophy',
        display_order: 8,
        content: {
          eyebrow: '02 / BEHIND THE TERMINAL',
          heading: 'NOT JUST CODE.\nBUT SOLVING MEANINGFUL PROBLEMS.',
          description: 'I am Jamshed Ali, a Computer Systems Engineering student at Sukkur IBA University, researcher, and developer from Sukkur, Pakistan. Working across AI, cybersecurity, and full-stack software development, I combine engineering precision with creative craftsmanship.',
          foundation_heading: 'ACADEMIC & TECHNICAL FOUNDATION',
          foundation_subheading: 'EDUCATION & VENTURE',
          foundation_rows: [
            {
              title: 'Sukkur IBA University',
              badge: 'CSE-V',
              text: 'B.S. in Computer Systems Engineering. Microprocessors, algorithms, operating systems, and networking.'
            },
            {
              title: 'AuraNix Technologies',
              badge: 'Founder & CEO',
              text: 'Technology enterprise delivering intelligent software, AI agents, and secure digital infrastructure.'
            },
            {
              title: 'Community Leadership & Training',
              badge: 'Lead & Trainer',
              text: 'WordPress Campus Connect (Sukkur IBA) · Dream Institute Sukkur · CSE Society Lead'
            }
          ],
          toolkit_heading: 'TECHNICAL TOOLKIT',
          skill_tags: [
            'C / C++',
            'Python',
            'JavaScript / Node.js',
            'Java',
            'React',
            'WordPress & PHP',
            'Machine Learning',
            'Cybersecurity',
            'Computer Networks',
            'Signals & Systems',
            'Cisco Packet Tracer',
            'Technical Writing'
          ],
          software_icons: [
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
          ],
          process_heading: 'FROM CONCEPT TO PRODUCTION',
          process_steps: [
            { num: '01', title: 'THE ARCHITECTURE', text: 'Deconstructing requirements, threat boundaries, and system constraints into a solid modular foundation.' },
            { num: '02', title: 'THE ALGORITHM', text: 'Crafting deterministic data structures and performant algorithmic logic optimized for throughput.' },
            { num: '03', title: 'THE INTERFACE', text: 'Engineering responsive, accessible frontend ergonomics with dark cinematic polish and pixel precision.' },
            { num: '04', title: 'THE HARDENING', text: 'Rigorous stress-testing, security audits, static analysis, and cross-platform verification.' },
            { num: '05', title: 'THE DEPLOYMENT', text: 'Continuous integration, automated build pipelines, and production deployment with live telemetry.' }
          ],
          quote_text: 'Code is poetry,\nand every coder\nis a poet.',
          quote_author: 'Jamshed Ali',
          quote_subtext: 'BUILDING IDEAS\nINTO MEANINGFUL REALITY.'
        }
      },
      {
        section_key: 'journey',
        title: 'Journey & Experience',
        subtitle: 'Timeline of academic milestones, corporate leadership, and training roles',
        display_order: 9,
        content: {
          eyebrow: '03 / THE JOURNEY',
          heading: 'DISCIPLINE. INNOVATION. MOMENTUM.',
          resume_label: 'RESUME',
          resume_url: './Asset/cv/Jamshed_Ali_Resume.pdf',
          milestones_eyebrow: 'KEY MILESTONES',
          milestones_heading: 'REAL WINS.\nMEASURABLE IMPACT.'
        }
      },
      {
        section_key: 'contact',
        title: 'Contact Section',
        subtitle: 'Communication hub, direct channels, WhatsApp brief, and reel teaser',
        display_order: 10,
        content: {
          eyebrow: '04 / INITIATE CONTACT',
          heading: 'LET’S WORK\nTOGETHER.',
          description: 'Have a project, research inquiry, or engineering problem in mind?\nLet’s engineer something exceptional together.',
          cta_label: 'START A CONVERSATION',
          cta_url: 'https://wa.me/923701228685',
          channels: [
            { type: 'email', label: 'PRIMARY EMAIL', value: 'engr.jamshed.ali.rind@gmail.com', href: 'mailto:engr.jamshed.ali.rind@gmail.com' },
            { type: 'linkedin', label: 'LINKEDIN', value: 'linkedin.com/in/jamshedali', href: 'https://linkedin.com/in/jamshedali' },
            { type: 'github', label: 'GITHUB / CODE', value: 'github.com/auranixtech', href: 'https://github.com/auranixtech' },
            { type: 'phone', label: 'WHATSAPP / DIRECT', value: '+92 370 1228685', href: 'https://wa.me/923701228685' },
            { type: 'location', label: 'ACADEMIC & WORK BASE', value: 'Sukkur, Sindh, Pakistan', href: '' }
          ],
          brief_summary: 'Send a Project Brief',
          brief_note: 'This brief directly formats and opens a message draft in WhatsApp.'
        }
      },
      {
        section_key: 'footer',
        title: 'Footer',
        subtitle: 'Copyright, wordmark, and social links',
        display_order: 11,
        content: {
          wordmark: 'JAMSHED ALI®',
          copyright: `© ${new Date().getFullYear()} JAMSHED ALI. CODE IS POETRY. ALL RIGHTS RESERVED.`,
          github_url: 'https://github.com/auranixtech',
          linkedin_url: 'https://linkedin.com/in/jamshedali'
        }
      },
      {
        section_key: 'navigation',
        title: 'Header & Navigation',
        subtitle: 'Navigation anchors, wordmark, motion toggle, and quick contact button',
        display_order: 0,
        content: {
          wordmark: 'JAMSHED ALI®',
          contact_button_label: 'Let’s talk',
          contact_button_url: '#contact',
          items: [
            { id: 'portfolio', label: 'Works', href: '#portfolio', is_visible: true, display_order: 1 },
            { id: 'awards', label: 'Contributions', href: '#awards', is_visible: true, display_order: 2 },
            { id: 'auranix', label: 'AuraNix', href: '#auranix', is_visible: true, display_order: 3 },
            { id: 'ecosystem', label: 'Ecosystem', href: '#ecosystem', is_visible: true, display_order: 4 },
            { id: 'about', label: 'About', href: '#about', is_visible: true, display_order: 5 },
            { id: 'experience', label: 'Journey', href: '#experience', is_visible: true, display_order: 6 },
            { id: 'contact', label: 'Contact', href: '#contact', is_visible: true, display_order: 7 }
          ]
        }
      }
    ];

    const insertSection = db.prepare(`
      INSERT INTO sections (section_key, title, subtitle, display_order, content)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const sec of initialSections) {
      insertSection.run(sec.section_key, sec.title, sec.subtitle, sec.display_order, JSON.stringify(sec.content));
    }
  }

  // Check projects
  const projectsCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  if (projectsCount === 0) {
    const rawProjectsPath = path.join(ROOT_DIR, 'src', 'data', 'projects.json');
    if (fs.existsSync(rawProjectsPath)) {
      const rawProjects = JSON.parse(fs.readFileSync(rawProjectsPath, 'utf8'));
      const insertProj = db.prepare(`
        INSERT INTO projects (slug, title, category, year, role, description, full_content, type, media_url, image_url, renders, is_featured, is_published, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const featuredTitles = [
        'AGENTIC AI FOR AUTONOMOUS CYBER-DEFENSE',
        'ZENITH CYBERSECURITY DASHBOARD',
        'AURANIX TECHNOLOGIES OFFICIAL PORTAL'
      ];

      rawProjects.forEach((p, idx) => {
        const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const isFeatured = featuredTitles.includes(p.title) ? 1 : 0;
        insertProj.run(
          slug,
          p.title,
          p.category || 'General',
          p.year || '2026',
          p.role || '',
          p.description || '',
          JSON.stringify([
            { type: 'paragraph', content: p.description || '' },
            { type: 'meta', role: p.role, year: p.year, category: p.category }
          ]),
          p.type || 'website',
          p.media || '',
          p.image || '',
          p.renders ? JSON.stringify(p.renders) : null,
          isFeatured,
          1,
          idx + 1
        );
      });
    }
  }

  // Check skills
  const skillsCount = db.prepare('SELECT COUNT(*) as count FROM skills').get().count;
  if (skillsCount === 0) {
    const initialClusters = [
      {
        cluster_id: 'ai-ml',
        cluster_name: 'Autonomous AI & Agents',
        cluster_icon: 'Cpu',
        cluster_color: '#ef4151',
        cluster_description: 'Multi-agent cognitive decision pipelines, human-in-the-loop governance, and neural language synthesis.',
        nodes: [
          { name: 'Agentic AI Systems', level: 'Research Lead', icon: 'ai', project: 'Agentic Cyber-Defense Framework' },
          { name: 'Python & PyTorch', level: 'Advanced Core', icon: 'python', project: 'Neural Decision Models & Automation' },
          { name: 'Intelligent NLP & Processing', level: 'Production', icon: 'ai', project: 'AuraWord Processing Suite' },
          { name: 'Machine Learning', level: 'Engineering', icon: 'ai', project: 'Predictive Cybersecurity Telemetry' }
        ]
      },
      {
        cluster_id: 'fullstack',
        cluster_name: 'Full-Stack & Systems',
        cluster_icon: 'Globe',
        cluster_color: '#ff7a45',
        cluster_description: 'Ultra-low-latency web architectures, reactive client states, and native low-level systems execution.',
        nodes: [
          { name: 'C / C++', level: 'Core Engineering', icon: 'cpp', project: 'Microprocessors & Signals Programming' },
          { name: 'React 19 & Framer', level: 'Production Master', icon: 'react', project: 'AuraNix Technologies & Portfolios' },
          { name: 'JavaScript & Node.js', level: 'Full-Stack', icon: 'nodejs', project: 'Full-Stack Web Systems & APIs' },
          { name: 'Java Programming', level: 'Systems Level', icon: 'java', project: 'Object-Oriented Software Design' },
          { name: 'WordPress & PHP', level: 'Campus Trainer', icon: 'wordpress', project: 'Campus Connect 100+ Students' }
        ]
      },
      {
        cluster_id: 'cybersecurity',
        cluster_name: 'Cybersecurity & Networks',
        cluster_icon: 'Shield',
        cluster_color: '#13c2c2',
        cluster_description: 'Zero-trust infrastructure modeling, network packet tracing, and real-time security dashboard telemetry.',
        nodes: [
          { name: 'Zero-Trust Architecture', level: 'Architecture', icon: 'security', project: 'Zenith Cybersecurity Suite' },
          { name: 'Cisco Packet Tracer', level: 'Network Topology', icon: 'cisco', project: 'Campus Enterprise Topologies' },
          { name: 'Computer Networks', level: 'Academic Honors', icon: 'security', project: 'OSI Protocol Layer Analysis' },
          { name: 'Signals & Systems', level: 'CSE-V Level', icon: 'security', project: 'Discrete Signals & Filter Theory' }
        ]
      },
      {
        cluster_id: 'tools',
        cluster_name: 'Engineering Ecosystem',
        cluster_icon: 'Terminal',
        cluster_color: '#9254de',
        cluster_description: 'Modern development tooling, automated build chains, version control, and literary technical writing.',
        nodes: [
          { name: 'VS Code & Tooling', level: 'Daily Driver', icon: 'vscode', project: 'Multi-Language IDE Workspaces' },
          { name: 'Git & GitHub Enterprise', level: 'Version Master', icon: 'git', project: 'auranixtech Enterprise Repos' },
          { name: 'Linux System Ops', level: 'Environment', icon: 'vscode', project: 'Command Line Scripting & Shell' },
          { name: 'Technical & Creative Writing', level: 'Published Author', icon: 'vscode', project: 'Dastan e Hasrat (داستانِ حسرت)' }
        ]
      }
    ];

    const insertSkill = db.prepare(`
      INSERT INTO skills (cluster_id, cluster_name, cluster_icon, cluster_color, cluster_description, name, level, icon, project, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let order = 1;
    for (const cluster of initialClusters) {
      for (const node of cluster.nodes) {
        insertSkill.run(
          cluster.cluster_id,
          cluster.cluster_name,
          cluster.cluster_icon,
          cluster.cluster_color,
          cluster.cluster_description,
          node.name,
          node.level,
          node.icon,
          node.project,
          order++
        );
      }
    }
  }

  // Check experiences
  const expCount = db.prepare('SELECT COUNT(*) as count FROM experiences').get().count;
  if (expCount === 0) {
    const initialExp = [
      {
        date_range: '2025 · PRESENT',
        title: 'Founder & CEO',
        place: 'AuraNix Technologies (auranix.tech)',
        description: 'Steering the technological vision, engineering architecture, and digital intelligence strategy. Architecting full-stack digital platforms, autonomous AI workflows, and hardened enterprise software solutions.'
      },
      {
        date_range: '2024 · PRESENT',
        title: 'Computer Systems Engineering (CSE-V)',
        place: 'Sukkur IBA University',
        description: 'Undergraduate engineering curriculum covering microprocessors, computer architecture, data structures & algorithms, signals and systems, computer networks, and discrete systems programming in C++ and Java.'
      },
      {
        date_range: '2026',
        title: 'Lead Organizer & Technical Trainer',
        place: 'WordPress Campus Connect · Sukkur IBA University',
        description: 'Spearheaded the technical campus initiative, organizing training bootcamps for over 100 university students in full-site editing, custom block theme architecture, and production web deployment.'
      },
      {
        date_range: '2025 · PRESENT',
        title: 'Event & Discipline Management Lead',
        place: 'CSE Society · Sukkur IBA University',
        description: 'Directing event logistics, participant management, and operational discipline for department symposiums, hackathons, and technical workshops across the university.'
      },
      {
        date_range: '2025 – 2026',
        title: 'Technical Workshop Trainer',
        place: 'Dream Institute Sukkur',
        description: 'Conducted hands-on web engineering and software development workshops for aspiring engineers, focusing on modern JavaScript, responsive interfaces, and practical software tooling.'
      }
    ];

    const insertExp = db.prepare(`
      INSERT INTO experiences (date_range, title, place, description, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    initialExp.forEach((e, idx) => {
      insertExp.run(e.date_range, e.title, e.place, e.description, idx + 1);
    });
  }

  // Check milestones
  const msCount = db.prepare('SELECT COUNT(*) as count FROM milestones').get().count;
  if (msCount === 0) {
    const initialMilestones = [
      {
        year: '2026',
        title: 'Agentic AI Research Framework',
        event: 'Human-in-the-Loop Cyber-Defense Architecture for Critical Infrastructure',
        description: 'Published & co-authored framework exploring multi-agent cognitive decision pipelines and human-in-the-loop governance for Pakistan’s critical digital infrastructure.',
        link_url: 'https://auranix.tech/research',
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
      },
      {
        year: '2026',
        title: 'AuraNix Technologies Launch',
        event: 'Founder & CEO of Enterprise Tech Venture (auranix.tech)',
        description: 'Established AuraNix Technologies to deliver intelligent digital products, secure web architectures, and scalable technology solutions.',
        link_url: 'https://auranix.tech',
        image_url: './Asset/img/auranix-logo.png'
      },
      {
        year: '2026',
        title: 'WordPress Campus Connect Organizer',
        event: 'Sukkur IBA University Hands-on Development Program',
        description: 'Organized and trained 100+ engineering students in modern CMS engineering, theme development, and responsive website deployment.',
        link_url: 'https://auranix.tech',
        image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop'
      },
      {
        year: '2025',
        title: 'Author of Dastan e Hasrat (داستانِ حسرت)',
        event: 'Published Urdu Philosophical & Contemplative Poetry Book',
        description: 'Authored and published a celebrated collection of Urdu poetry embodying the creative philosophy that Code is Poetry, and Every Coder is a Poet.',
        link_url: 'https://auranix.tech',
        image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop'
      },
      {
        year: '2025',
        title: 'CSE Society Management Lead',
        event: 'Department of Computer Systems Engineering Leadership',
        description: 'Elected/appointed to lead Event and Discipline Management for major technical symposiums and academic initiatives at Sukkur IBA University.',
        link_url: 'https://auranix.tech',
        image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop'
      },
      {
        year: '2025',
        title: 'Web Engineering Workshop Trainer',
        event: 'Dream Institute Sukkur Training Bootcamp',
        description: 'Delivered specialized practical software development and web engineering masterclasses for engineering students.',
        link_url: 'https://auranix.tech',
        image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop'
      }
    ];

    const insertMs = db.prepare(`
      INSERT INTO milestones (year, title, event, description, link_url, image_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    initialMilestones.forEach((m, idx) => {
      insertMs.run(m.year, m.title, m.event, m.description, m.link_url, m.image_url, idx + 1);
    });
  }

  // Check brands
  const brandsCount = db.prepare('SELECT COUNT(*) as count FROM brands').get().count;
  if (brandsCount === 0) {
    const rawBrandsPath = path.join(ROOT_DIR, 'src', 'data', 'brands.json');
    if (fs.existsSync(rawBrandsPath)) {
      const rawBrands = JSON.parse(fs.readFileSync(rawBrandsPath, 'utf8'));
      const insertBrand = db.prepare(`
        INSERT INTO brands (name, image, category, display_order)
        VALUES (?, ?, ?, ?)
      `);

      rawBrands.forEach((b, idx) => {
        insertBrand.run(b.name, `./Asset/svg/brand/${b.file}`, 'Partner/Tech', idx + 1);
      });
    }
  }

  // Check media
  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media').get().count;
  if (mediaCount === 0) {
    const insertMedia = db.prepare(`
      INSERT INTO media (filename, original_name, mime_type, file_size, width, height, category, alt_text, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const imgDir = path.join(ROOT_DIR, 'Asset', 'img');
    if (fs.existsSync(imgDir)) {
      const files = fs.readdirSync(imgDir);
      for (const f of files) {
        const full = path.join(imgDir, f);
        const stats = fs.statSync(full);
        if (stats.isFile()) {
          const ext = path.extname(f).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
          insertMedia.run(f, f, mime, stats.size, 1200, 800, 'img', f.replace(/\.[^.]+$/, ''), `./Asset/img/${f}`);
        }
      }
    }
  }
}

// Helper: Get complete portfolio content for public site or preview
export function getSiteContent(isDraft = false) {
  // Settings
  const settingsRows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const row of settingsRows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  // Sections
  const sectionsRows = db.prepare('SELECT * FROM sections WHERE is_visible = 1 ORDER BY display_order ASC').all();
  const sections = {};
  const sectionsList = [];
  for (const s of sectionsRows) {
    let parsedContent;
    try {
      parsedContent = (isDraft && s.has_draft && s.draft_content)
        ? JSON.parse(s.draft_content)
        : JSON.parse(s.content);
    } catch {
      parsedContent = s.content;
    }
    sections[s.section_key] = parsedContent;
    sectionsList.push({
      key: s.section_key,
      title: s.title,
      subtitle: s.subtitle,
      display_order: s.display_order,
      layout_variant: s.layout_variant,
      is_visible: Boolean(s.is_visible),
      has_draft: Boolean(s.has_draft),
      content: parsedContent
    });
  }

  // Projects
  const projectQuery = isDraft
    ? 'SELECT * FROM projects ORDER BY display_order ASC'
    : 'SELECT * FROM projects WHERE is_published = 1 ORDER BY display_order ASC';
  const projectsRows = db.prepare(projectQuery).all();
  const projects = projectsRows.map(p => ({
    ...p,
    renders: p.renders ? JSON.parse(p.renders) : null,
    full_content: p.full_content ? JSON.parse(p.full_content) : null,
    tags: p.tags ? JSON.parse(p.tags) : []
  }));

  // Skills
  const skillsRows = db.prepare('SELECT * FROM skills WHERE is_visible = 1 ORDER BY display_order ASC').all();

  // Group skills by cluster
  const clustersMap = new Map();
  for (const s of skillsRows) {
    if (!clustersMap.has(s.cluster_id)) {
      clustersMap.set(s.cluster_id, {
        id: s.cluster_id,
        name: s.cluster_name,
        icon: s.cluster_icon,
        color: s.cluster_color,
        description: s.cluster_description,
        nodes: []
      });
    }
    clustersMap.get(s.cluster_id).nodes.push({
      id: `skill-${s.id}`,
      name: s.name,
      level: s.level,
      icon: s.icon,
      project: s.project
    });
  }
  const clusters = Array.from(clustersMap.values());

  // Experiences
  const experiences = db.prepare('SELECT * FROM experiences WHERE is_visible = 1 ORDER BY display_order ASC').all();

  // Milestones
  const milestones = db.prepare('SELECT * FROM milestones WHERE is_visible = 1 ORDER BY display_order ASC').all();

  // Brands
  const brands = db.prepare('SELECT * FROM brands WHERE is_visible = 1 ORDER BY display_order ASC').all();

  return {
    settings,
    sections,
    sectionsList,
    projects,
    clusters,
    experiences,
    milestones,
    brands
  };
}

// Initialize database right away
initDatabase();

