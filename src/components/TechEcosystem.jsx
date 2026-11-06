import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Shield, Globe, Terminal, CheckCircle2, ArrowUpRight, Sparkles, Layers } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const CLUSTERS = [
  {
    id: 'ai-ml',
    name: 'Autonomous AI & Agents',
    icon: Cpu,
    color: '#ef4151',
    description: 'Multi-agent cognitive decision pipelines, human-in-the-loop governance, and neural language synthesis.',
    nodes: [
      { id: 'agentic-ai', name: 'Agentic AI Systems', level: 'Research Lead', icon: 'ai', project: 'Agentic Cyber-Defense Framework' },
      { id: 'python', name: 'Python & PyTorch', level: 'Advanced Core', icon: 'python', project: 'Neural Decision Models & Automation' },
      { id: 'nlp', name: 'Intelligent NLP & Processing', level: 'Production', icon: 'ai', project: 'AuraWord Processing Suite' },
      { id: 'ml-algorithms', name: 'Machine Learning', level: 'Engineering', icon: 'ai', project: 'Predictive Cybersecurity Telemetry' }
    ]
  },
  {
    id: 'fullstack',
    name: 'Full-Stack & Systems',
    icon: Globe,
    color: '#ff7a45',
    description: 'Ultra-low-latency web architectures, reactive client states, and native low-level systems execution.',
    nodes: [
      { id: 'cpp', name: 'C / C++', level: 'Core Engineering', icon: 'cpp', project: 'Microprocessors & Signals Programming' },
      { id: 'react', name: 'React 19 & Framer', level: 'Production Master', icon: 'react', project: 'AuraNix Technologies & Portfolios' },
      { id: 'javascript', name: 'JavaScript & Node.js', level: 'Full-Stack', icon: 'nodejs', project: 'Full-Stack Web Systems & APIs' },
      { id: 'java', name: 'Java Programming', level: 'Systems Level', icon: 'java', project: 'Object-Oriented Software Design' },
      { id: 'wordpress', name: 'WordPress & PHP', level: 'Campus Trainer', icon: 'wordpress', project: 'Campus Connect 100+ Students' }
    ]
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & Networks',
    icon: Shield,
    color: '#13c2c2',
    description: 'Zero-trust infrastructure modeling, network packet tracing, and real-time security dashboard telemetry.',
    nodes: [
      { id: 'zero-trust', name: 'Zero-Trust Architecture', level: 'Architecture', icon: 'security', project: 'Zenith Cybersecurity Suite' },
      { id: 'cisco', name: 'Cisco Packet Tracer', level: 'Network Topology', icon: 'cisco', project: 'Campus Enterprise Topologies' },
      { id: 'networks', name: 'Computer Networks', level: 'Academic Honors', icon: 'security', project: 'OSI Protocol Layer Analysis' },
      { id: 'signals', name: 'Signals & Systems', level: 'CSE-V Level', icon: 'security', project: 'Discrete Signals & Filter Theory' }
    ]
  },
  {
    id: 'tools',
    name: 'Engineering Ecosystem',
    icon: Terminal,
    color: '#9254de',
    description: 'Modern development tooling, automated build chains, version control, and literary technical writing.',
    nodes: [
      { id: 'vscode', name: 'VS Code & Tooling', level: 'Daily Driver', icon: 'vscode', project: 'Multi-Language IDE Workspaces' },
      { id: 'git', name: 'Git & GitHub Enterprise', level: 'Version Master', icon: 'git', project: 'auranixtech Enterprise Repos' },
      { id: 'linux', name: 'Linux System Ops', level: 'Environment', icon: 'vscode', project: 'Command Line Scripting & Shell' },
      { id: 'writing', name: 'Technical & Creative Writing', level: 'Published Author', icon: 'vscode', project: 'Dastan e Hasrat (داستانِ حسرت)' }
    ]
  }
];

const ICON_MAP = {
  Cpu,
  Shield,
  Globe,
  Terminal,
  Layers,
  Sparkles
};

export default function TechEcosystem({ clusters: propClusters, sectionData }) {
  const [activeCluster, setActiveCluster] = useState('all');
  const [hoveredNode, setHoveredNode] = useState(null);

  const rawClusters = propClusters && propClusters.length > 0 ? propClusters : CLUSTERS;
  const effectiveClusters = rawClusters.map(c => ({
    ...c,
    icon: typeof c.icon === 'string' ? (ICON_MAP[c.icon] || Cpu) : (c.icon || Cpu)
  }));

  const filteredClusters = activeCluster === 'all'
    ? effectiveClusters
    : effectiveClusters.filter(c => c.id === activeCluster);

  const totalNodesCount = effectiveClusters.reduce((acc, c) => acc + (c.nodes?.length || 0), 0);

  return (
    <section id="ecosystem" className="tech-ecosystem section-wrap" aria-labelledby="ecosystem-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{sectionData?.eyebrow || '05 / INTERACTIVE TECH ECOSYSTEM'}</span>
          <h2 id="ecosystem-heading">
            {sectionData?.heading ? (
              sectionData.heading
            ) : (
              <>CONNECTED INTELLIGENCE<span className="accent">.</span></>
            )}
          </h2>
        </div>
        <div className="ecosystem-pill-counter">
          <span className="display" style={{ color: 'var(--red)', fontSize: '24px' }}>{totalNodesCount || 17}</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
            ENGINEERED TECHNOLOGIES
          </span>
        </div>
      </div>

      <p className="ecosystem-intro-p" style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '640px', marginBottom: '28px', lineHeight: 1.8 }}>
        {sectionData?.description || 'Explore how artificial intelligence, full-stack systems programming, cybersecurity telemetry, and engineering tools converge into a unified engineering architecture. Hover over any node to inspect project integrations.'}
      </p>

      {/* Cluster Navigation Controls */}
      <div className="ecosystem-filters" role="group" aria-label="Technology Clusters" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <button
          className={`ecosystem-filter-btn ${activeCluster === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCluster('all')}
        >
          All Clusters
        </button>
        {effectiveClusters.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              className={`ecosystem-filter-btn ${activeCluster === c.id ? 'active' : ''}`}
              onClick={() => setActiveCluster(c.id)}
              style={{
                borderColor: activeCluster === c.id ? c.color : undefined
              }}
            >
              <Icon size={13} style={{ color: c.color }} />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Connected Clusters Grid */}
      <div className="ecosystem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px' }}>
        {filteredClusters.map((cluster, cIdx) => {
          const Icon = cluster.icon;
          return (
            <motion.div
              key={cluster.id}
              className="ecosystem-cluster-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: cIdx * 0.08, ease: EASE }}
              style={{
                background: 'linear-gradient(145deg, #120e10 0%, #0a0909 100%)',
                border: '1px solid #2d1c20',
                borderRadius: '6px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle Ambient Color Top Accent */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${cluster.color}, transparent)`
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: 'rgba(239, 65, 81, 0.08)',
                      border: `1px solid ${cluster.color}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cluster.color
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                    {cluster.name}
                  </h3>
                </div>
                <span style={{ fontSize: '9px', color: cluster.color, fontWeight: 700, letterSpacing: '0.06em' }}>
                  0{cIdx + 1}
                </span>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                {cluster.description}
              </p>

              {/* Node List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cluster.nodes.map(node => {
                  const isHovered = hoveredNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      className="ecosystem-node"
                      onPointerEnter={() => setHoveredNode({ ...node, clusterColor: cluster.color, clusterName: cluster.name })}
                      onPointerLeave={() => setHoveredNode(null)}
                      onMouseEnter={() => setHoveredNode({ ...node, clusterColor: cluster.color, clusterName: cluster.name })}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{
                        padding: '10px 14px',
                        background: isHovered ? 'rgba(239, 65, 81, 0.12)' : 'rgba(18, 14, 15, 0.75)',
                        border: `1px solid ${isHovered ? cluster.color : '#26191c'}`,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'default',
                        transition: 'all 0.22s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={`./Asset/svg/${node.icon}.svg`}
                          alt=""
                          width="18"
                          height="18"
                          style={{
                            objectFit: 'contain',
                            filter: isHovered ? 'none' : 'grayscale(0.4)',
                            transition: 'filter 0.2s'
                          }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f2efeb' }}>
                          {node.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '8px',
                          padding: '3px 6px',
                          borderRadius: '2px',
                          background: '#090909',
                          color: isHovered ? cluster.color : 'var(--muted)',
                          border: `1px solid ${isHovered ? cluster.color : '#332326'}`,
                          fontWeight: 600,
                          letterSpacing: '0.03em'
                        }}
                      >
                        {node.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Node Telemetry Inspector */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            className="node-telemetry-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{
              marginTop: '22px',
              padding: '14px 20px',
              background: 'linear-gradient(90deg, #1c0f13 0%, #100b0d 100%)',
              border: `1px solid ${hoveredNode.clusterColor}66`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: hoveredNode.clusterColor,
                  boxShadow: `0 0 8px ${hoveredNode.clusterColor}`
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                INSPECTING: {hoveredNode.name}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                [CLUSTER: {hoveredNode.clusterName}]
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '10px' }}>
              <span style={{ color: 'var(--muted)' }}>
                APPLICATION: <strong style={{ color: '#fff' }}>{hoveredNode.project}</strong>
              </span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={12} /> VERIFIED STATUS
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

