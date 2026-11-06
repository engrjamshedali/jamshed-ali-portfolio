import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Image,
  Sliders,
  Eye,
  Settings,
  History,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Copy,
  Upload,
  Search,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Send,
  X,
  FileText,
  User,
  Shield,
  Briefcase,
  Award,
  Cpu,
  Globe,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import './admin.css';

// Toast Context
const ToastContext = createContext(null);

function useToast() {
  return useContext(ToastContext);
}

// Auth Context
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

// Media Picker Modal Component
function MediaPickerModal({ isOpen, onClose, onSelect }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const toast = useToast();
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    loadMedia();
  }, [isOpen, filter, search]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter !== 'all') q.set('category', filter);
      if (search) q.set('search', search);

      const res = await fetch(`/api/media?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMediaList(data);
    } catch (err) {
      toast.show('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const form = new FormData();
    for (const f of files) form.append('files', f);
    form.append('category', filter !== 'all' ? filter : 'general');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (res.ok) {
        toast.show('Media uploaded successfully', 'success');
        loadMedia();
        if (data.media && data.media[0]) {
          onSelect(data.media[0].url);
          onClose();
        }
      } else {
        toast.show(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      toast.show('Upload error: ' + err.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: '840px' }}>
        <div className="adm-modal-header">
          <div className="adm-card-title">
            <Image size={18} color="var(--adm-red)" />
            Select Image or Upload Media
          </div>
          <button className="adm-btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleUpload}
              multiple
              accept="image/*,.pdf"
            />
            <button
              className="adm-btn adm-btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} />
              {uploading ? 'Uploading…' : 'Upload From Computer'}
            </button>
            <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
              <input
                className="adm-input"
                placeholder="Or paste external image URL…"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
              />
              <button
                className="adm-btn adm-btn-secondary"
                disabled={!customUrl}
                onClick={() => {
                  onSelect(customUrl);
                  onClose();
                }}
              >
                Use URL
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="adm-tabs" style={{ marginBottom: 0 }}>
              {['all', 'img', 'general', 'projects', 'brand'].map(cat => (
                <button
                  key={cat}
                  className={`adm-tab-btn ${filter === cat ? 'active' : ''}`}
                  onClick={() => setFilter(cat)}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ width: '220px' }}>
              <input
                className="adm-input"
                placeholder="Search media…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-muted)' }}>
              Loading media library…
            </div>
          ) : mediaList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-muted)' }}>
              No media items found. Upload an image above!
            </div>
          ) : (
            <div className="adm-media-grid" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {mediaList.map(item => (
                <div
                  key={item.id}
                  className="adm-media-item"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  title={item.original_name}
                >
                  <img src={item.url} alt={item.alt_text || item.original_name} />
                  <div className="adm-media-meta">{item.original_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn adm-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Image Field with Preview & Picker
function ImagePickerField({ label, value, onChange, hint }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="adm-field adm-form-full">
      <div className="adm-field-label">
        <span>{label}</span>
        {hint && <span className="adm-field-hint">{hint}</span>}
      </div>
      <div className="adm-image-preview-box">
        <img
          src={value || './Asset/img/favicon.svg'}
          alt="Preview"
          className="adm-image-thumb"
          onError={e => { e.currentTarget.src = './Asset/img/favicon.svg'; }}
        />
        <div className="adm-image-controls">
          <input
            className="adm-input"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="Image path or URL (e.g., ./Asset/img/... or https://...)"
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={() => setPickerOpen(true)}
            >
              <Image size={13} /> Select from Media Library
            </button>
            {value && (
              <button
                type="button"
                className="adm-btn adm-btn-outline adm-btn-sm"
                onClick={() => onChange('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={url => onChange(url)}
      />
    </div>
  );
}

// ==========================================
// VIEW: DASHBOARD OVERVIEW
// ==========================================
function OverviewView({ onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const { token } = useAuth();
  const toast = useToast();

  const loadData = async () => {
    try {
      const res = await fetch('/api/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      toast.show('Failed to load overview data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublishAll = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.show(data.message, 'success');
        loadData();
      } else {
        toast.show(data.error || 'Publish failed', 'error');
      }
    } catch (err) {
      toast.show('Network error during publishing', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--adm-muted)' }}>Loading dashboard metrics…</div>;
  }

  const stats = overview?.stats || {};

  return (
    <div>
      {/* Quick Action Banner */}
      <div className="adm-card" style={{ background: 'linear-gradient(135deg, #220e12, #140d0f)', borderColor: '#5e1d27' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Welcome back, Jamshed Ali
            </h2>
            <p style={{ color: 'var(--adm-muted)', fontSize: '13px' }}>
              Portfolio CMS is fully active. You have complete live control over all content, projects, media, and layout.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="adm-btn adm-btn-primary"
              onClick={handlePublishAll}
              disabled={publishing || stats.pending_drafts_count === 0}
            >
              <Send size={14} />
              {publishing ? 'Publishing…' : stats.pending_drafts_count > 0 ? `Publish ${stats.pending_drafts_count} Changes` : 'All Published'}
            </button>
            <button className="adm-btn adm-btn-outline" onClick={() => onNavigate('preview')}>
              <Eye size={14} /> Live Preview
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Published Projects</span>
            <div className="adm-kpi-icon"><FolderKanban size={18} /></div>
          </div>
          <div className="adm-kpi-val">{stats.published_projects ?? 0}</div>
          <div className="adm-kpi-meta">Live in selected works archive</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Draft / Hidden</span>
            <div className="adm-kpi-icon" style={{ background: '#302113', color: '#f59e0b' }}><FileText size={18} /></div>
          </div>
          <div className="adm-kpi-val">{stats.draft_projects ?? 0}</div>
          <div className="adm-kpi-meta">Unpublished project records</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Managed Sections</span>
            <div className="adm-kpi-icon"><Layers size={18} /></div>
          </div>
          <div className="adm-kpi-val">{stats.total_sections ?? 0}</div>
          <div className="adm-kpi-meta">Hero, Works, AuraNix, About, etc.</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Media Files</span>
            <div className="adm-kpi-icon"><Image size={18} /></div>
          </div>
          <div className="adm-kpi-val">{stats.total_media ?? 0}</div>
          <div className="adm-kpi-meta">Assets in central library</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Skills &amp; Tech</span>
            <div className="adm-kpi-icon"><Cpu size={18} /></div>
          </div>
          <div className="adm-kpi-val">{stats.total_skills ?? 0}</div>
          <div className="adm-kpi-meta">Across 4 technology clusters</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-top">
            <span className="adm-kpi-label">Key Milestones</span>
            <div className="adm-kpi-icon"><Award size={18} /></div>
          </div>
          <div className="adm-kpi-val">{stats.total_milestones ?? 0}</div>
          <div className="adm-kpi-meta">Verified career recognitions</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">Quick Management Shortcuts</div>
            <div className="adm-card-subtitle">One-click direct actions to manage popular sections</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'start' }} onClick={() => onNavigate('projects', { action: 'new' })}>
            <Plus size={16} color="var(--adm-red)" /> Add New Project
          </button>
          <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'start' }} onClick={() => onNavigate('sections', { section: 'hero' })}>
            <Edit size={16} color="var(--adm-red)" /> Edit Hero Section
          </button>
          <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'start' }} onClick={() => onNavigate('sections', { section: 'about' })}>
            <User size={16} color="var(--adm-red)" /> Update About Info
          </button>
          <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'start' }} onClick={() => onNavigate('skills')}>
            <Cpu size={16} color="var(--adm-red)" /> Manage Skills &amp; Tech
          </button>
          <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'start' }} onClick={() => onNavigate('media')}>
            <Upload size={16} color="var(--adm-red)" /> Upload Media Asset
          </button>
          <button className="adm-btn adm-btn-outline" style={{ justifyContent: 'start' }} onClick={() => onNavigate('builder')}>
            <Sliders size={16} color="var(--adm-red)" /> Reorder Sections
          </button>
        </div>
      </div>

      {/* Drafts Review & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-card-header">
            <div>
              <div className="adm-card-title">
                Sections with Draft Changes
                {overview?.draft_sections?.length > 0 && (
                  <span className="adm-badge adm-badge-warning">{overview.draft_sections.length} pending</span>
                )}
              </div>
              <div className="adm-card-subtitle">Unpublished edits awaiting review</div>
            </div>
          </div>
          {overview?.draft_sections?.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--adm-muted)' }}>
              All sections are up to date and published live.
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.draft_sections?.map(s => (
                    <tr key={s.section_key}>
                      <td><strong>{s.title}</strong></td>
                      <td><span className="adm-badge adm-badge-warning">Draft</span></td>
                      <td>
                        <button
                          className="adm-btn adm-btn-outline adm-btn-sm"
                          onClick={() => onNavigate('sections', { section: s.section_key })}
                        >
                          Edit &amp; Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-card-header">
            <div>
              <div className="adm-card-title">Recent Content Activity</div>
              <div className="adm-card-subtitle">Audit history of changes made</div>
            </div>
            <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => onNavigate('history')}>
              View All
            </button>
          </div>
          {overview?.recent_revisions?.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--adm-muted)' }}>
              No revisions recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overview?.recent_revisions?.map(rev => (
                <div
                  key={rev.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--adm-border)',
                    background: '#120d0f',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{rev.summary}</div>
                    <div style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>
                      By {rev.author} • {new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="adm-badge adm-badge-neutral">{rev.revision_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: VISUAL SECTION BUILDER
// ==========================================
function SectionBuilderView({ onNavigate }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const toast = useToast();

  const loadSections = async () => {
    try {
      const res = await fetch('/api/sections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSections(data);
    } catch {
      toast.show('Failed to load sections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    copy.forEach((s, idx) => { s.display_order = idx; });
    setSections(copy);
  };

  const toggleVisibility = (index) => {
    const copy = [...sections];
    copy[index].is_visible = copy[index].is_visible ? 0 : 1;
    setSections(copy);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const payload = sections.map((s, idx) => ({
        section_key: s.section_key,
        display_order: idx,
        is_visible: Boolean(s.is_visible)
      }));

      const res = await fetch('/api/sections/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sections: payload })
      });

      if (res.ok) {
        toast.show('Section hierarchy and visibility updated', 'success');
      } else {
        toast.show('Failed to save layout', 'error');
      }
    } catch (err) {
      toast.show('Error saving layout: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading section structure…</div>;

  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">
              <Sliders size={18} color="var(--adm-red)" />
              Visual Section Builder
            </div>
            <div className="adm-card-subtitle">
              Reorder page sections, control visibility, and customize layout appearance on the public portfolio
            </div>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={saveOrder} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Layout Order'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sections.map((sec, idx) => (
            <div
              key={sec.section_key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid var(--adm-border)',
                background: sec.is_visible ? 'var(--adm-card)' : '#100a0b',
                opacity: sec.is_visible ? 1 : 0.65
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span
                  style={{
                    fontFamily: 'var(--adm-mono)',
                    color: 'var(--adm-red)',
                    fontWeight: '700',
                    fontSize: '13px',
                    width: '28px'
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sec.title}
                    {sec.has_draft ? <span className="adm-badge adm-badge-warning">Draft Edits</span> : null}
                    {!sec.is_visible && <span className="adm-badge adm-badge-danger">Hidden</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>
                    Key: <code>{sec.section_key}</code> • {sec.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="adm-btn-icon"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  title="Move Up"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="adm-btn-icon"
                  onClick={() => move(idx, 1)}
                  disabled={idx === sections.length - 1}
                  title="Move Down"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className={`adm-btn-icon ${!sec.is_visible ? 'adm-btn-danger' : ''}`}
                  onClick={() => toggleVisibility(idx)}
                  title={sec.is_visible ? 'Hide section' : 'Show section'}
                >
                  {sec.is_visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  onClick={() => onNavigate('sections', { section: sec.section_key })}
                >
                  <Edit size={12} /> Edit Content
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: SECTIONS CONTENT EDITORS
// ==========================================
function SectionsManagerView({ initialSectionKey = 'hero' }) {
  const [selectedKey, setSelectedKey] = useState(initialSectionKey);
  const [sectionData, setSectionData] = useState(null);
  const [sectionsList, setSectionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const toast = useToast();

  const loadSectionsList = async () => {
    try {
      const res = await fetch('/api/sections', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSectionsList(data);
    } catch {}
  };

  const loadSection = async (key) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sections/${key}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSectionData(data);
    } catch {
      toast.show('Failed to load section content', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectionsList();
  }, []);

  useEffect(() => {
    loadSection(selectedKey);
  }, [selectedKey]);

  const handleSave = async (publishNow = false) => {
    setSaving(true);
    try {
      const contentToSave = sectionData.draft_content || sectionData.content;
      const res = await fetch(`/api/sections/${selectedKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: sectionData.title,
          subtitle: sectionData.subtitle,
          is_visible: sectionData.is_visible,
          content: contentToSave,
          publishNow
        })
      });

      const resData = await res.json();
      if (res.ok) {
        toast.show(publishNow ? 'Section published live!' : 'Draft saved successfully', 'success');
        loadSection(selectedKey);
        loadSectionsList();
      } else {
        toast.show(resData.error || 'Failed to save', 'error');
      }
    } catch (err) {
      toast.show('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateContentField = (key, val) => {
    setSectionData(prev => {
      const activeContent = prev.draft_content || prev.content;
      return {
        ...prev,
        draft_content: {
          ...activeContent,
          [key]: val
        }
      };
    });
  };

  if (loading && !sectionData) return <div style={{ padding: '40px' }}>Loading section editor…</div>;

  const currentContent = sectionData?.draft_content || sectionData?.content || {};

  return (
    <div>
      {/* Section Selector Tab Bar */}
      <div className="adm-card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--adm-muted)', textTransform: 'uppercase' }}>Select Section:</span>
            <select
              className="adm-select"
              style={{ width: '250px' }}
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
            >
              {sectionsList.map(s => (
                <option key={s.section_key} value={s.section_key}>
                  {s.title} {s.has_draft ? '★ (Draft)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="adm-btn adm-btn-secondary"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save size={14} /> Save Draft
            </button>
            <button
              className="adm-btn adm-btn-primary"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              <Send size={14} /> Publish Live
            </button>
          </div>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">
              {sectionData.title}
              {sectionData.has_draft ? (
                <span className="adm-badge adm-badge-warning">Unpublished Changes</span>
              ) : (
                <span className="adm-badge adm-badge-success">Live Published</span>
              )}
            </div>
            <div className="adm-card-subtitle">{sectionData.subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(sectionData.is_visible)}
                onChange={e => setSectionData({ ...sectionData, is_visible: e.target.checked ? 1 : 0 })}
              />
              Section Visible on Site
            </label>
          </div>
        </div>

        {/* SECTION-SPECIFIC FORM FIELDS */}
        {selectedKey === 'hero' && (
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-field-label">Top Eyebrow 1</label>
              <input
                className="adm-input"
                value={currentContent.eyebrow1 || ''}
                onChange={e => updateContentField('eyebrow1', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Top Eyebrow 2</label>
              <input
                className="adm-input"
                value={currentContent.eyebrow2 || ''}
                onChange={e => updateContentField('eyebrow2', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Availability Badge Text</label>
              <input
                className="adm-input"
                value={currentContent.availability_text || ''}
                onChange={e => updateContentField('availability_text', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Background Display Title</label>
              <input
                className="adm-input"
                value={currentContent.background_word || ''}
                onChange={e => updateContentField('background_word', e.target.value)}
              />
            </div>

            <ImagePickerField
              label="Hero Portrait Cutout"
              value={currentContent.portrait_image}
              onChange={val => updateContentField('portrait_image', val)}
              hint="Studio cutout portrait of Jamshed Ali (transparent PNG recommended)"
            />

            <div className="adm-field">
              <label className="adm-field-label">Handwriting Tagline</label>
              <input
                className="adm-input"
                value={currentContent.handwriting_tagline || ''}
                onChange={e => updateContentField('handwriting_tagline', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Main Name Heading</label>
              <input
                className="adm-input"
                value={currentContent.name_heading || ''}
                onChange={e => updateContentField('name_heading', e.target.value)}
              />
            </div>

            <div className="adm-field adm-form-full">
              <label className="adm-field-label">
                Dynamic Keywords (Animated Title Cycler)
                <span className="adm-field-hint">Comma-separated</span>
              </label>
              <input
                className="adm-input"
                value={Array.isArray(currentContent.dynamic_keywords) ? currentContent.dynamic_keywords.join(', ') : ''}
                onChange={e => updateContentField('dynamic_keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>

            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Bio Description</label>
              <textarea
                className="adm-textarea"
                rows="3"
                value={currentContent.bio_description || ''}
                onChange={e => updateContentField('bio_description', e.target.value)}
              />
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Primary CTA Button Label</label>
              <input
                className="adm-input"
                value={currentContent.primary_cta_label || ''}
                onChange={e => updateContentField('primary_cta_label', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Primary CTA Target Anchor</label>
              <input
                className="adm-input"
                value={currentContent.primary_cta_url || ''}
                onChange={e => updateContentField('primary_cta_url', e.target.value)}
              />
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Location Label</label>
              <input
                className="adm-input"
                value={currentContent.location_label || ''}
                onChange={e => updateContentField('location_label', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">CV Download Link / File</label>
              <input
                className="adm-input"
                value={currentContent.cv_download_url || ''}
                onChange={e => updateContentField('cv_download_url', e.target.value)}
              />
            </div>

            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Manifesto Quote</label>
              <textarea
                className="adm-textarea"
                rows="2"
                value={currentContent.manifesto_quote || ''}
                onChange={e => updateContentField('manifesto_quote', e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedKey === 'about' && (
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-field-label">Eyebrow</label>
              <input
                className="adm-input"
                value={currentContent.eyebrow || ''}
                onChange={e => updateContentField('eyebrow', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Heading</label>
              <input
                className="adm-input"
                value={currentContent.heading || ''}
                onChange={e => updateContentField('heading', e.target.value)}
              />
            </div>
            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Description Paragraph</label>
              <textarea
                className="adm-textarea"
                rows="3"
                value={currentContent.description || ''}
                onChange={e => updateContentField('description', e.target.value)}
              />
            </div>

            <div className="adm-field adm-form-full">
              <label className="adm-field-label">
                Technical Toolkit Tags (Comma separated)
              </label>
              <input
                className="adm-input"
                value={Array.isArray(currentContent.skill_tags) ? currentContent.skill_tags.join(', ') : ''}
                onChange={e => updateContentField('skill_tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Quote Text</label>
              <textarea
                className="adm-textarea"
                rows="2"
                value={currentContent.quote_text || ''}
                onChange={e => updateContentField('quote_text', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Quote Author</label>
              <input
                className="adm-input"
                value={currentContent.quote_author || ''}
                onChange={e => updateContentField('quote_author', e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedKey === 'auranix' && (
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-field-label">Eyebrow</label>
              <input
                className="adm-input"
                value={currentContent.eyebrow || ''}
                onChange={e => updateContentField('eyebrow', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Heading</label>
              <input
                className="adm-input"
                value={currentContent.heading || ''}
                onChange={e => updateContentField('heading', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Visit Button Label</label>
              <input
                className="adm-input"
                value={currentContent.visit_label || ''}
                onChange={e => updateContentField('visit_label', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Visit URL</label>
              <input
                className="adm-input"
                value={currentContent.visit_url || ''}
                onChange={e => updateContentField('visit_url', e.target.value)}
              />
            </div>
            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Company Description</label>
              <textarea
                className="adm-textarea"
                rows="3"
                value={currentContent.description || ''}
                onChange={e => updateContentField('description', e.target.value)}
              />
            </div>
            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Executive Philosophy Quote</label>
              <textarea
                className="adm-textarea"
                rows="2"
                value={currentContent.card_quote || ''}
                onChange={e => updateContentField('card_quote', e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedKey === 'breakdown' && (
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-field-label">Eyebrow</label>
              <input
                className="adm-input"
                value={currentContent.eyebrow || ''}
                onChange={e => updateContentField('eyebrow', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Heading</label>
              <input
                className="adm-input"
                value={currentContent.heading || ''}
                onChange={e => updateContentField('heading', e.target.value)}
              />
            </div>
            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Description</label>
              <textarea
                className="adm-textarea"
                rows="2"
                value={currentContent.description || ''}
                onChange={e => updateContentField('description', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Before / Left Label</label>
              <input
                className="adm-input"
                value={currentContent.raw_label || ''}
                onChange={e => updateContentField('raw_label', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">After / Right Label</label>
              <input
                className="adm-input"
                value={currentContent.final_label || ''}
                onChange={e => updateContentField('final_label', e.target.value)}
              />
            </div>
            <ImagePickerField
              label="Before (Wireframe / Blueprint Image)"
              value={currentContent.raw_image}
              onChange={val => updateContentField('raw_image', val)}
            />
            <ImagePickerField
              label="After (Production Dashboard Image)"
              value={currentContent.final_image}
              onChange={val => updateContentField('final_image', val)}
            />
          </div>
        )}

        {selectedKey === 'contact' && (
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-field-label">Eyebrow</label>
              <input
                className="adm-input"
                value={currentContent.eyebrow || ''}
                onChange={e => updateContentField('eyebrow', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Heading</label>
              <input
                className="adm-input"
                value={currentContent.heading || ''}
                onChange={e => updateContentField('heading', e.target.value)}
              />
            </div>
            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Description</label>
              <textarea
                className="adm-textarea"
                rows="2"
                value={currentContent.description || ''}
                onChange={e => updateContentField('description', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">WhatsApp CTA Label</label>
              <input
                className="adm-input"
                value={currentContent.cta_label || ''}
                onChange={e => updateContentField('cta_label', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">WhatsApp URL / Phone Number</label>
              <input
                className="adm-input"
                value={currentContent.cta_url || ''}
                onChange={e => updateContentField('cta_url', e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedKey === 'footer' && (
          <div className="adm-form-grid">
            <div className="adm-field">
              <label className="adm-field-label">Wordmark</label>
              <input
                className="adm-input"
                value={currentContent.wordmark || ''}
                onChange={e => updateContentField('wordmark', e.target.value)}
              />
            </div>
            <div className="adm-field adm-form-full">
              <label className="adm-field-label">Copyright Notice</label>
              <input
                className="adm-input"
                value={currentContent.copyright || ''}
                onChange={e => updateContentField('copyright', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">GitHub URL</label>
              <input
                className="adm-input"
                value={currentContent.github_url || ''}
                onChange={e => updateContentField('github_url', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">LinkedIn URL</label>
              <input
                className="adm-input"
                value={currentContent.linkedin_url || ''}
                onChange={e => updateContentField('linkedin_url', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Generic JSON editor fallback for any other sections */}
        {!['hero', 'about', 'auranix', 'breakdown', 'contact', 'footer'].includes(selectedKey) && (
          <div className="adm-field adm-form-full">
            <label className="adm-field-label">Section Content (Structured JSON)</label>
            <textarea
              className="adm-textarea"
              style={{ fontFamily: 'var(--adm-mono)', fontSize: '12px' }}
              rows="14"
              value={JSON.stringify(currentContent, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setSectionData({ ...sectionData, draft_content: parsed });
                } catch {}
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VIEW: ADVANCED PROJECTS MANAGER
// ==========================================
function ProjectsManagerView({ initialAction }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [editingProject, setEditingProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const toast = useToast();

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.show('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    if (initialAction === 'new') {
      openNewProject();
    }
  }, [initialAction]);

  const openNewProject = () => {
    setEditingProject({
      title: '',
      slug: '',
      category: 'Web Development',
      year: new Date().getFullYear().toString(),
      role: 'Lead Architect',
      description: '',
      type: 'website',
      media_url: '',
      image_url: './Asset/img/auranix-logo.png',
      is_featured: 0,
      is_published: 1,
      renders: null
    });
    setIsModalOpen(true);
  };

  const openEditProject = (p) => {
    setEditingProject({ ...p });
    setIsModalOpen(true);
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.show('Project duplicated', 'success');
        loadProjects();
      } else {
        toast.show(data.error || 'Duplicate failed', 'error');
      }
    } catch {
      toast.show('Network error', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete project: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.show('Project deleted', 'success');
        loadProjects();
      } else {
        toast.show('Delete failed', 'error');
      }
    } catch {
      toast.show('Network error', 'error');
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isNew = !editingProject.id;
    const url = isNew ? '/api/projects' : `/api/projects/${editingProject.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingProject)
      });
      const data = await res.json();
      if (res.ok) {
        toast.show(isNew ? 'Project created!' : 'Project updated!', 'success');
        setIsModalOpen(false);
        loadProjects();
      } else {
        toast.show(data.error || 'Failed to save project', 'error');
      }
    } catch (err) {
      toast.show('Error saving project: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];

  const filtered = projects.filter(p => {
    const matchesCat = filterCat === 'All' || p.category === filterCat;
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">
              <FolderKanban size={18} color="var(--adm-red)" />
              Projects &amp; Archive Management
            </div>
            <div className="adm-card-subtitle">
              Manage all {projects.length} portfolio case studies, system architectures, and live platforms
            </div>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={openNewProject}>
            <Plus size={14} /> Add New Project
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1 }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`adm-btn adm-btn-sm ${filterCat === cat ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                onClick={() => setFilterCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ width: '260px' }}>
            <input
              className="adm-input"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading project portfolio…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--adm-muted)' }}>No projects match your filter.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--adm-mono)', color: 'var(--adm-red)' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={p.image_url}
                          alt=""
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px', background: '#000' }}
                          onError={e => { e.currentTarget.src = './Asset/img/auranix-logo.png'; }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>{p.role || 'Contributor'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-badge adm-badge-neutral">{p.category}</span></td>
                    <td><span className="adm-badge adm-badge-neutral">{p.type}</span></td>
                    <td>{p.year}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {p.is_published ? (
                          <span className="adm-badge adm-badge-success">Published</span>
                        ) : (
                          <span className="adm-badge adm-badge-warning">Draft</span>
                        )}
                        {Boolean(p.is_featured) && (
                          <span className="adm-badge adm-badge-danger">Featured</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="adm-btn-icon" onClick={() => openEditProject(p)} title="Edit Project">
                          <Edit size={14} />
                        </button>
                        <button className="adm-btn-icon" onClick={() => handleDuplicate(p.id)} title="Duplicate">
                          <Copy size={14} />
                        </button>
                        <button className="adm-btn-icon adm-btn-danger" onClick={() => handleDelete(p.id, p.title)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROJECT MODAL */}
      {isModalOpen && editingProject && (
        <div className="adm-modal-backdrop" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="adm-modal" style={{ maxWidth: '880px' }}>
            <div className="adm-modal-header">
              <div className="adm-card-title">
                <FolderKanban size={18} color="var(--adm-red)" />
                {editingProject.id ? `Edit Project: ${editingProject.title}` : 'Add New Project'}
              </div>
              <button className="adm-btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProject}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-field adm-form-full">
                    <label className="adm-field-label">Project Title *</label>
                    <input
                      className="adm-input"
                      required
                      value={editingProject.title}
                      onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
                      placeholder="e.g. AGENTIC AI FOR AUTONOMOUS CYBER-DEFENSE"
                    />
                  </div>

                  <div className="adm-field">
                    <label className="adm-field-label">Category *</label>
                    <input
                      className="adm-input"
                      required
                      value={editingProject.category}
                      onChange={e => setEditingProject({ ...editingProject, category: e.target.value })}
                      placeholder="Research, Web Development, AI & ML, Cybersecurity..."
                    />
                  </div>

                  <div className="adm-field">
                    <label className="adm-field-label">Project Type</label>
                    <select
                      className="adm-select"
                      value={editingProject.type}
                      onChange={e => setEditingProject({ ...editingProject, type: e.target.value })}
                    >
                      <option value="website">Live Platform / Website</option>
                      <option value="render">System Architecture (3D/Multi-angle)</option>
                      <option value="image">Image Case Study</option>
                      <option value="youtube">YouTube Video</option>
                      <option value="drive">Google Drive Video</option>
                    </select>
                  </div>

                  <div className="adm-field">
                    <label className="adm-field-label">Role / Attribution</label>
                    <input
                      className="adm-input"
                      value={editingProject.role || ''}
                      onChange={e => setEditingProject({ ...editingProject, role: e.target.value })}
                      placeholder="e.g. Founder & Lead Architect"
                    />
                  </div>

                  <div className="adm-field">
                    <label className="adm-field-label">Year</label>
                    <input
                      className="adm-input"
                      value={editingProject.year || ''}
                      onChange={e => setEditingProject({ ...editingProject, year: e.target.value })}
                      placeholder="2026"
                    />
                  </div>

                  <ImagePickerField
                    label="Main Thumbnail Image *"
                    value={editingProject.image_url}
                    onChange={val => setEditingProject({ ...editingProject, image_url: val })}
                    hint="High-resolution screenshot or poster"
                  />

                  <div className="adm-field adm-form-full">
                    <label className="adm-field-label">Live Link / Media URL</label>
                    <input
                      className="adm-input"
                      value={editingProject.media_url || ''}
                      onChange={e => setEditingProject({ ...editingProject, media_url: e.target.value })}
                      placeholder="https://auranix.tech or demo URL"
                    />
                  </div>

                  <div className="adm-field adm-form-full">
                    <label className="adm-field-label">Short Description *</label>
                    <textarea
                      className="adm-textarea"
                      required
                      rows="3"
                      value={editingProject.description}
                      onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                      placeholder="Technical overview, problem solved, impact, architecture..."
                    />
                  </div>

                  {editingProject.type === 'render' && (
                    <div className="adm-field adm-form-full" style={{ padding: '16px', background: '#110d0e', borderRadius: '8px', border: '1px solid var(--adm-border)' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Multi-Angle Architecture Views</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>Topology Image</label>
                          <input
                            className="adm-input"
                            value={editingProject.renders?.[0]?.solid || ''}
                            onChange={e => {
                              const r = editingProject.renders ? [...editingProject.renders] : [{ solid: '', material: '', final: '' }];
                              r[0].solid = e.target.value;
                              setEditingProject({ ...editingProject, renders: r });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>Architecture Image</label>
                          <input
                            className="adm-input"
                            value={editingProject.renders?.[0]?.material || ''}
                            onChange={e => {
                              const r = editingProject.renders ? [...editingProject.renders] : [{ solid: '', material: '', final: '' }];
                              r[0].material = e.target.value;
                              setEditingProject({ ...editingProject, renders: r });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>Production System Image</label>
                          <input
                            className="adm-input"
                            value={editingProject.renders?.[0]?.final || ''}
                            onChange={e => {
                              const r = editingProject.renders ? [...editingProject.renders] : [{ solid: '', material: '', final: '' }];
                              r[0].final = e.target.value;
                              setEditingProject({ ...editingProject, renders: r });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="adm-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="feat"
                      checked={Boolean(editingProject.is_featured)}
                      onChange={e => setEditingProject({ ...editingProject, is_featured: e.target.checked ? 1 : 0 })}
                    />
                    <label htmlFor="feat" style={{ cursor: 'pointer', fontWeight: '600' }}>Feature in Hero &amp; Top Showcase</label>
                  </div>

                  <div className="adm-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="pub"
                      checked={Boolean(editingProject.is_published)}
                      onChange={e => setEditingProject({ ...editingProject, is_published: e.target.checked ? 1 : 0 })}
                    />
                    <label htmlFor="pub" style={{ cursor: 'pointer', fontWeight: '600' }}>Published (Visible on site)</label>
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving…' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// VIEW: MEDIA LIBRARY
// ==========================================
function MediaLibraryView() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const { token } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const loadMedia = async () => {
    try {
      const q = new URLSearchParams();
      if (filter !== 'all') q.set('category', filter);
      if (search) q.set('search', search);

      const res = await fetch(`/api/media?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMediaList(data);
    } catch {
      toast.show('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filter, search]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const form = new FormData();
    for (const f of files) form.append('files', f);
    form.append('category', filter !== 'all' ? filter : 'general');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (res.ok) {
        toast.show(data.message || 'Media uploaded', 'success');
        loadMedia();
      } else {
        toast.show(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      toast.show('Upload error: ' + err.message, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete media item "${name}" permanently?`)) return;
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.show('Media deleted', 'success');
        setSelectedMedia(null);
        loadMedia();
      } else {
        toast.show('Delete failed', 'error');
      }
    } catch {
      toast.show('Network error', 'error');
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.show('Image URL copied to clipboard!', 'info');
  };

  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">
              <Image size={18} color="var(--adm-red)" />
              Central Media &amp; Image Library
            </div>
            <div className="adm-card-subtitle">
              Upload, replace, and organize all website images, logos, and vector assets
            </div>
          </div>
          <div>
            <input
              type="file"
              ref={fileRef}
              style={{ display: 'none' }}
              multiple
              accept="image/*,.pdf"
              onChange={handleUpload}
            />
            <button
              className="adm-btn adm-btn-primary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Images'}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div className="adm-tabs" style={{ marginBottom: 0 }}>
            {['all', 'img', 'general', 'projects', 'brand'].map(cat => (
              <button
                key={cat}
                className={`adm-tab-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ width: '250px' }}>
            <input
              className="adm-input"
              placeholder="Search by filename or alt…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid and Details */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedMedia ? '1fr 340px' : '1fr', gap: '20px' }}>
          <div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading media files…</div>
            ) : mediaList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--adm-muted)' }}>No media files found.</div>
            ) : (
              <div className="adm-media-grid">
                {mediaList.map(item => (
                  <div
                    key={item.id}
                    className={`adm-media-item ${selectedMedia?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMedia(item)}
                  >
                    <img src={item.url} alt={item.alt_text} />
                    <div className="adm-media-meta">{item.original_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedMedia && (
            <div style={{ background: '#120d0f', border: '1px solid var(--adm-border)', borderRadius: '10px', padding: '20px', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Media Details</div>
                <button className="adm-btn-icon" onClick={() => setSelectedMedia(null)}><X size={15} /></button>
              </div>

              <div style={{ width: '100%', aspectRatio: '1.4', background: '#080808', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px', border: '1px solid var(--adm-border)' }}>
                <img src={selectedMedia.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--adm-muted)' }}>Filename:</span>
                  <div style={{ fontWeight: '600', wordBreak: 'break-all' }}>{selectedMedia.original_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--adm-muted)' }}>File Size:</span>
                  <div>{(selectedMedia.file_size / 1024).toFixed(1)} KB</div>
                </div>
                <div>
                  <span style={{ color: 'var(--adm-muted)' }}>URL / Path:</span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input className="adm-input" readOnly value={selectedMedia.url} style={{ fontSize: '11px' }} />
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => copyUrl(selectedMedia.url)}>Copy</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" style={{ width: '100%' }} onClick={() => handleDelete(selectedMedia.id, selectedMedia.original_name)}>
                    <Trash2 size={13} /> Delete Media
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: LIVE WEBSITE PREVIEW
// ==========================================
function LivePreviewView() {
  const [device, setDevice] = useState('desktop'); // desktop (100%), tablet (768px), mobile (390px)
  const [isDraftMode, setIsDraftMode] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const iframeRef = useRef(null);
  const { token } = useAuth();
  const toast = useToast();

  const previewUrl = isDraftMode ? '/?preview=true' : '/';

  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `${previewUrl}&t=${Date.now()}`;
    }
  };

  const handlePublishAll = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.show(data.message, 'success');
        reloadIframe();
      } else {
        toast.show(data.error || 'Publish failed', 'error');
      }
    } catch {
      toast.show('Publish network error', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const widths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px'
  };

  return (
    <div>
      {/* Viewport Control Bar */}
      <div className="adm-card" style={{ padding: '12px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--adm-muted)' }}>DEVICE:</span>
            <button
              className={`adm-btn adm-btn-sm ${device === 'desktop' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
              onClick={() => setDevice('desktop')}
            >
              <Monitor size={14} /> Desktop (1440px)
            </button>
            <button
              className={`adm-btn adm-btn-sm ${device === 'tablet' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
              onClick={() => setDevice('tablet')}
            >
              <Tablet size={14} /> Tablet (768px)
            </button>
            <button
              className={`adm-btn adm-btn-sm ${device === 'mobile' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
              onClick={() => setDevice('mobile')}
            >
              <Smartphone size={14} /> Mobile (390px)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDraftMode}
                onChange={e => setIsDraftMode(e.target.checked)}
              />
              Show Draft Changes
            </label>

            <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={reloadIframe} title="Reload Preview">
              <RefreshCw size={13} /> Reload
            </button>

            <a className="adm-btn adm-btn-secondary adm-btn-sm" href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} /> Open Live Site
            </a>

            <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={handlePublishAll} disabled={publishing}>
              <Send size={13} /> {publishing ? 'Publishing…' : 'Publish All'}
            </button>
          </div>
        </div>
      </div>

      {/* Frame Container */}
      <div style={{ display: 'flex', justifyContent: 'center', background: '#050404', padding: '20px', borderRadius: '10px', minHeight: '820px', border: '1px solid var(--adm-border)' }}>
        <div style={{ width: widths[device], transition: 'width 0.3s ease', background: '#090909', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', borderRadius: device === 'desktop' ? '0' : '16px', overflow: 'hidden', border: device === 'desktop' ? 'none' : '4px solid #221a1d' }}>
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title="Portfolio Live Preview"
            style={{ width: '100%', height: '800px', border: 'none', background: '#090909' }}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: HISTORY & BACKUPS
// ==========================================
function HistoryBackupsView() {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const { token } = useAuth();
  const toast = useToast();
  const importFileRef = useRef(null);

  const loadRevisions = async () => {
    try {
      const res = await fetch('/api/revisions', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRevisions(data);
    } catch {
      toast.show('Failed to load revisions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, []);

  const handleRestore = async (id, summary) => {
    if (!window.confirm(`Restore content snapshot from: "${summary}"? This will overwrite existing draft and published sections with that revision.`)) return;

    setRestoring(true);
    try {
      const res = await fetch(`/api/revisions/${id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.show(data.message, 'success');
        loadRevisions();
      } else {
        toast.show(data.error || 'Restore failed', 'error');
      }
    } catch {
      toast.show('Network error during restore', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleExportBackup = () => {
    window.open(`/api/backup/export?token=${token}`, '_blank');
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(json)
      });
      const data = await res.json();
      if (res.ok) {
        toast.show('Backup restored successfully!', 'success');
        loadRevisions();
      } else {
        toast.show(data.error || 'Restore failed', 'error');
      }
    } catch (err) {
      toast.show('Invalid backup file: ' + err.message, 'error');
    } finally {
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  return (
    <div>
      {/* Backup Card */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">
              <History size={18} color="var(--adm-red)" />
              Database Backups &amp; Disaster Recovery
            </div>
            <div className="adm-card-subtitle">
              Export complete portfolio content as a single JSON file or restore from a previous backup
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="adm-btn adm-btn-primary" onClick={handleExportBackup}>
              Export Full Backup (JSON)
            </button>
            <input
              type="file"
              ref={importFileRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImportBackup}
            />
            <button className="adm-btn adm-btn-outline" onClick={() => importFileRef.current?.click()}>
              Import / Restore Backup
            </button>
          </div>
        </div>
      </div>

      {/* Revisions Table */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">Revision History &amp; Snapshots</div>
            <div className="adm-card-subtitle">Point-in-time snapshots created automatically on publishing and section edits</div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading revision logs…</div>
        ) : revisions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--adm-muted)' }}>No revisions recorded yet.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Action Summary</th>
                  <th>Type</th>
                  <th>Author</th>
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'right' }}>Rollback</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map(rev => (
                  <tr key={rev.id}>
                    <td style={{ fontFamily: 'var(--adm-mono)', color: 'var(--adm-red)' }}>#{rev.id}</td>
                    <td style={{ fontWeight: '600' }}>{rev.summary}</td>
                    <td><span className="adm-badge adm-badge-neutral">{rev.revision_type}</span></td>
                    <td>{rev.author}</td>
                    <td>{new Date(rev.created_at).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="adm-btn adm-btn-outline adm-btn-sm"
                        onClick={() => handleRestore(rev.id, rev.summary)}
                        disabled={restoring}
                      >
                        Restore Snapshot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VIEW: SITE SETTINGS
// ==========================================
function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [profileData, setProfileData] = useState({ username: '', email: '', current_password: '', new_password: '' });
  const { token, user } = useAuth();
  const toast = useToast();

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSettings(data);
      if (user) {
        setProfileData(prev => ({ ...prev, username: user.username, email: user.email }));
      }
    } catch {
      toast.show('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (key, val) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(val)
      });
      if (res.ok) {
        toast.show(`${key.toUpperCase()} settings updated`, 'success');
      } else {
        toast.show('Failed to update settings', 'error');
      }
    } catch (err) {
      toast.show('Error saving settings: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.show('Admin security credentials updated successfully!', 'success');
        setProfileData(prev => ({ ...prev, current_password: '', new_password: '' }));
      } else {
        toast.show(data.error || 'Failed to update profile', 'error');
      }
    } catch {
      toast.show('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <div style={{ padding: '40px' }}>Loading settings…</div>;

  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <div className="adm-card-title">
              <Settings size={18} color="var(--adm-red)" />
              Website Configuration &amp; Security Settings
            </div>
            <div className="adm-card-subtitle">
              Manage global metadata, SEO tags, social accounts, and admin authentication
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="adm-tabs">
          <button className={`adm-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
          <button className={`adm-tab-btn ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')}>SEO &amp; Sharing</button>
          <button className={`adm-tab-btn ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>Social Profiles</button>
          <button className={`adm-tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Admin Security</button>
        </div>

        {activeTab === 'general' && (
          <form onSubmit={e => { e.preventDefault(); handleSaveSettings('general', settings.general); }}>
            <div className="adm-form-grid">
              <div className="adm-field adm-form-full">
                <label className="adm-field-label">Website Title</label>
                <input
                  className="adm-input"
                  value={settings.general?.site_title || ''}
                  onChange={e => setSettings({ ...settings, general: { ...settings.general, site_title: e.target.value } })}
                />
              </div>
              <div className="adm-field adm-form-full">
                <label className="adm-field-label">Site Meta Description</label>
                <textarea
                  className="adm-textarea"
                  rows="2"
                  value={settings.general?.site_description || ''}
                  onChange={e => setSettings({ ...settings, general: { ...settings.general, site_description: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Author Name</label>
                <input
                  className="adm-input"
                  value={settings.general?.author_name || ''}
                  onChange={e => setSettings({ ...settings, general: { ...settings.general, author_name: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Tagline</label>
                <input
                  className="adm-input"
                  value={settings.general?.tagline || ''}
                  onChange={e => setSettings({ ...settings, general: { ...settings.general, tagline: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Primary Location</label>
                <input
                  className="adm-input"
                  value={settings.general?.location || ''}
                  onChange={e => setSettings({ ...settings, general: { ...settings.general, location: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Email</label>
                <input
                  className="adm-input"
                  value={settings.general?.email || ''}
                  onChange={e => setSettings({ ...settings, general: { ...settings.general, email: e.target.value } })}
                />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
                <Save size={14} /> Save General Settings
              </button>
            </div>
          </form>
        )}

        {activeTab === 'seo' && (
          <form onSubmit={e => { e.preventDefault(); handleSaveSettings('seo', settings.seo); }}>
            <div className="adm-form-grid">
              <div className="adm-field adm-form-full">
                <label className="adm-field-label">SEO Meta Title</label>
                <input
                  className="adm-input"
                  value={settings.seo?.meta_title || ''}
                  onChange={e => setSettings({ ...settings, seo: { ...settings.seo, meta_title: e.target.value } })}
                />
              </div>
              <div className="adm-field adm-form-full">
                <label className="adm-field-label">Open Graph (OG) Description</label>
                <textarea
                  className="adm-textarea"
                  rows="2"
                  value={settings.seo?.meta_description || ''}
                  onChange={e => setSettings({ ...settings, seo: { ...settings.seo, meta_description: e.target.value } })}
                />
              </div>
              <ImagePickerField
                label="Open Graph Share Image"
                value={settings.seo?.og_image}
                onChange={val => setSettings({ ...settings, seo: { ...settings.seo, og_image: val } })}
                hint="Image shown when link is shared on LinkedIn, Twitter, WhatsApp (1200x630)"
              />
              <div className="adm-field adm-form-full">
                <label className="adm-field-label">Keywords</label>
                <input
                  className="adm-input"
                  value={settings.seo?.keywords || ''}
                  onChange={e => setSettings({ ...settings, seo: { ...settings.seo, keywords: e.target.value } })}
                />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
                <Save size={14} /> Save SEO Settings
              </button>
            </div>
          </form>
        )}

        {activeTab === 'social' && (
          <form onSubmit={e => { e.preventDefault(); handleSaveSettings('social', settings.social); }}>
            <div className="adm-form-grid">
              <div className="adm-field">
                <label className="adm-field-label">GitHub URL</label>
                <input
                  className="adm-input"
                  value={settings.social?.github || ''}
                  onChange={e => setSettings({ ...settings, social: { ...settings.social, github: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">LinkedIn URL</label>
                <input
                  className="adm-input"
                  value={settings.social?.linkedin || ''}
                  onChange={e => setSettings({ ...settings, social: { ...settings.social, linkedin: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">WhatsApp URL</label>
                <input
                  className="adm-input"
                  value={settings.social?.whatsapp || ''}
                  onChange={e => setSettings({ ...settings, social: { ...settings.social, whatsapp: e.target.value } })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">AuraNix Technologies URL</label>
                <input
                  className="adm-input"
                  value={settings.social?.auranix || ''}
                  onChange={e => setSettings({ ...settings, social: { ...settings.social, auranix: e.target.value } })}
                />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
                <Save size={14} /> Save Social Settings
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleUpdateSecurity}>
            <div className="adm-form-grid">
              <div className="adm-field">
                <label className="adm-field-label">Admin Username</label>
                <input
                  className="adm-input"
                  required
                  value={profileData.username}
                  onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Admin Email</label>
                <input
                  className="adm-input"
                  type="email"
                  required
                  value={profileData.email}
                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">Current Password (Required for changes)</label>
                <input
                  className="adm-input"
                  type="password"
                  placeholder="Enter current password"
                  value={profileData.current_password}
                  onChange={e => setProfileData({ ...profileData, current_password: e.target.value })}
                />
              </div>
              <div className="adm-field">
                <label className="adm-field-label">New Password (Leave blank to keep current)</label>
                <input
                  className="adm-input"
                  type="password"
                  placeholder="At least 8 characters"
                  value={profileData.new_password}
                  onChange={e => setProfileData({ ...profileData, new_password: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
                <Shield size={14} /> Update Credentials
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VIEW: LOGIN VIEW
// ==========================================
function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user);
        toast.show('Welcome to Jamshed Ali Portfolio CMS', 'success');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error connecting to CMS server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090708', padding: '20px' }}>
      <div style={{ width: '420px', background: '#120d0f', border: '1px solid #331f24', borderRadius: '12px', padding: '36px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--adm-display)', fontSize: '28px', color: '#fff', letterSpacing: '-0.5px' }}>
            JAMSHED ALI<span style={{ color: 'var(--adm-red)' }}>®</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--adm-red)', fontWeight: '700', letterSpacing: '0.08em', marginTop: '4px' }}>
            PORTFOLIO CMS &amp; ADMIN SUITE
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#451016', border: '1px solid #781c26', color: '#ffc5cb', borderRadius: '6px', fontSize: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="adm-field" style={{ marginBottom: '16px' }}>
            <label className="adm-field-label">Username or Email</label>
            <input
              className="adm-input"
              required
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="adm-field" style={{ marginBottom: '24px' }}>
            <label className="adm-field-label">Password</label>
            <input
              className="adm-input"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button className="adm-btn adm-btn-primary" type="submit" style={{ width: '100%', height: '42px', fontSize: '14px' }} disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--adm-muted)' }}>
          Default initial credentials: <code>admin</code> / <code>Admin@123456</code>
          <br />
          <a href="/" style={{ color: 'var(--adm-red)', textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}>
            ← Return to Public Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN ADMIN APP ROOT COMPONENT
// ==========================================
export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('jamshed_admin_token') || '');
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('overview'); // overview, builder, sections, projects, media, preview, history, settings
  const [viewParams, setViewParams] = useState({});
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('jamshed_admin_token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('jamshed_admin_token');
  };

  // Verify token on mount
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => setUser(data.user))
      .catch(() => handleLogout());
  }, [token]);

  const navigate = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
    setSidebarOpen(false);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };

  if (!token) {
    return (
      <ToastContext.Provider value={{ show: showToast }}>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <div className="adm-toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
              {t.type === 'success' && <Check size={16} />}
              {t.type === 'error' && <AlertCircle size={16} />}
              {t.message}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user }}>
      <ToastContext.Provider value={{ show: showToast }}>
        <div className="adm-layout">
          {/* SIDEBAR NAVIGATION */}
          <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="adm-sidebar-brand">
              <div className="adm-brand-logo">
                JAMSHED ALI <span>CMS</span>
              </div>
              <button className="adm-btn-icon" onClick={toggleTheme} title="Toggle theme">
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            <div className="adm-nav-group">
              <div className="adm-nav-title">Management</div>
              <button
                className={`adm-nav-item ${currentView === 'overview' ? 'active' : ''}`}
                onClick={() => navigate('overview')}
              >
                <LayoutDashboard size={16} /> Overview
              </button>
              <button
                className={`adm-nav-item ${currentView === 'builder' ? 'active' : ''}`}
                onClick={() => navigate('builder')}
              >
                <Sliders size={16} /> Visual Section Builder
              </button>
              <button
                className={`adm-nav-item ${currentView === 'sections' ? 'active' : ''}`}
                onClick={() => navigate('sections')}
              >
                <Layers size={16} /> Section Content
              </button>
              <button
                className={`adm-nav-item ${currentView === 'projects' ? 'active' : ''}`}
                onClick={() => navigate('projects')}
              >
                <FolderKanban size={16} /> Projects &amp; Archive
              </button>
              <button
                className={`adm-nav-item ${currentView === 'media' ? 'active' : ''}`}
                onClick={() => navigate('media')}
              >
                <Image size={16} /> Media Library
              </button>

              <div className="adm-nav-title" style={{ marginTop: '16px' }}>Site Control</div>
              <button
                className={`adm-nav-item ${currentView === 'preview' ? 'active' : ''}`}
                onClick={() => navigate('preview')}
              >
                <Eye size={16} /> Live Preview
              </button>
              <button
                className={`adm-nav-item ${currentView === 'history' ? 'active' : ''}`}
                onClick={() => navigate('history')}
              >
                <History size={16} /> Revisions &amp; Backups
              </button>
              <button
                className={`adm-nav-item ${currentView === 'settings' ? 'active' : ''}`}
                onClick={() => navigate('settings')}
              >
                <Settings size={16} /> Website Settings
              </button>
            </div>

            <div className="adm-sidebar-footer">
              <div className="adm-user-chip">
                <div className="adm-user-avatar">JA</div>
                <div className="adm-user-info">
                  <div className="adm-user-name">{user?.username || 'Jamshed Ali'}</div>
                  <div className="adm-user-role">Super Administrator</div>
                </div>
              </div>
              <button className="adm-btn-icon" onClick={handleLogout} title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="adm-main">
            <header className="adm-header">
              <div className="adm-header-left">
                <div className="adm-header-title">
                  {currentView === 'overview' && 'Dashboard Overview'}
                  {currentView === 'builder' && 'Visual Section Builder'}
                  {currentView === 'sections' && 'Section Content Editors'}
                  {currentView === 'projects' && 'Projects & Case Studies'}
                  {currentView === 'media' && 'Media & Image Library'}
                  {currentView === 'preview' && 'Live Responsive Preview'}
                  {currentView === 'history' && 'Revisions & Backups'}
                  {currentView === 'settings' && 'Site & Security Settings'}
                </div>
              </div>

              <div className="adm-header-right">
                <a className="adm-btn adm-btn-outline adm-btn-sm" href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={13} /> View Live Portfolio
                </a>
              </div>
            </header>

            <main className="adm-content">
              {currentView === 'overview' && <OverviewView onNavigate={navigate} />}
              {currentView === 'builder' && <SectionBuilderView onNavigate={navigate} />}
              {currentView === 'sections' && <SectionsManagerView initialSectionKey={viewParams.section || 'hero'} />}
              {currentView === 'projects' && <ProjectsManagerView initialAction={viewParams.action} />}
              {currentView === 'media' && <MediaLibraryView />}
              {currentView === 'preview' && <LivePreviewView />}
              {currentView === 'history' && <HistoryBackupsView />}
              {currentView === 'settings' && <SettingsView />}
            </main>
          </div>

          {/* TOAST ALERTS */}
          <div className="adm-toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
                {t.type === 'success' && <Check size={16} />}
                {t.type === 'error' && <AlertCircle size={16} />}
                {t.message}
              </div>
            ))}
          </div>
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

// Render Admin React App
const rootEl = document.getElementById('admin-root');
if (rootEl) {
  createRoot(rootEl).render(<AdminApp />);
}

