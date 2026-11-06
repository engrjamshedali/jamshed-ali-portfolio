import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, getSiteContent } from './db.mjs';
import {
  requireAuth,
  hashPassword,
  comparePassword,
  generateToken,
  checkLoginRateLimit,
  resetLoginRateLimit
} from './auth.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'Asset', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    const unique = `${base}-${Date.now()}${ext}`;
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'application/pdf'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, SVG, GIF, PDF`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter
});

const router = express.Router();

// Helper to log a content revision
function logRevision(type, summary, author = 'Admin') {
  try {
    const fullState = getSiteContent(false);
    db.prepare(`
      INSERT INTO content_revisions (revision_type, summary, snapshot, author)
      VALUES (?, ?, ?, ?)
    `).run(type, summary, JSON.stringify(fullState), author);
  } catch (err) {
    console.error('Failed to log revision:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: rateLimit.message });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ? OR email = ?').get(username, username);
  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  resetLoginRateLimit(ip);
  db.prepare("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  const token = generateToken(user);
  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

router.get('/auth/setup-status', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
  res.json({ hasAdmin: count > 0 });
});

router.post('/auth/setup', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
  if (count > 0) {
    return res.status(400).json({ error: 'Admin user already exists. Setup is locked.' });
  }

  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Username, valid email, and password (at least 8 chars) are required' });
  }

  const hash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO admin_users (username, email, password_hash)
    VALUES (?, ?, ?)
  `).run(username, email, hash);

  const user = { id: result.lastInsertRowid, username, email };
  const token = generateToken(user);

  res.status(201).json({
    message: 'Admin account initialized successfully',
    token,
    user
  });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.put('/auth/update-profile', requireAuth, (req, res) => {
  const { username, email, current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);

  if (new_password) {
    if (!current_password || !comparePassword(current_password, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const newHash = hashPassword(new_password);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
  }

  if (username || email) {
    db.prepare('UPDATE admin_users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?')
      .run(username || user.username, email || user.email, req.user.id);
  }

  const updated = db.prepare('SELECT id, username, email FROM admin_users WHERE id = ?').get(req.user.id);
  res.json({ message: 'Profile updated successfully', user: updated });
});

// ==========================================
// 2. PUBLIC & PREVIEW CONTENT
// ==========================================

router.get('/content', (req, res) => {
  const isDraft = req.query.draft === 'true';
  const data = getSiteContent(isDraft);
  res.json(data);
});

// ==========================================
// 3. OVERVIEW / DASHBOARD ANALYTICS
// ==========================================

router.get('/overview', requireAuth, (req, res) => {
  const totalPublishedProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE is_published = 1').get().count;
  const totalDraftProjects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE is_published = 0').get().count;
  const totalSections = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;
  const totalMedia = db.prepare('SELECT COUNT(*) as count FROM media').get().count;
  const totalSkills = db.prepare('SELECT COUNT(*) as count FROM skills').get().count;
  const totalMilestones = db.prepare('SELECT COUNT(*) as count FROM milestones').get().count;

  // Check draft sections
  const draftSections = db.prepare('SELECT section_key, title FROM sections WHERE has_draft = 1').all();

  // Recent revisions
  const recentRevisions = db.prepare('SELECT * FROM content_revisions ORDER BY id DESC LIMIT 5').all();

  // Last update time
  const lastSectionUpdate = db.prepare('SELECT MAX(updated_at) as last_time FROM sections').get().last_time;

  res.json({
    stats: {
      published_projects: totalPublishedProjects,
      draft_projects: totalDraftProjects,
      total_sections: totalSections,
      total_media: totalMedia,
      total_skills: totalSkills,
      total_milestones: totalMilestones,
      pending_drafts_count: draftSections.length + totalDraftProjects
    },
    draft_sections: draftSections,
    last_updated: lastSectionUpdate,
    recent_revisions: recentRevisions
  });
});

// ==========================================
// 4. SECTIONS MANAGEMENT
// ==========================================

router.get('/sections', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sections ORDER BY display_order ASC').all();
  const list = rows.map(r => ({
    ...r,
    content: JSON.parse(r.content),
    draft_content: r.draft_content ? JSON.parse(r.draft_content) : null
  }));
  res.json(list);
});

router.get('/sections/:key', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(req.params.key);
  if (!row) {
    return res.status(404).json({ error: 'Section not found' });
  }
  res.json({
    ...row,
    content: JSON.parse(row.content),
    draft_content: row.draft_content ? JSON.parse(row.draft_content) : null
  });
});

router.put('/sections/:key', requireAuth, (req, res) => {
  const { title, subtitle, is_visible, layout_variant, content, publishNow } = req.body;
  const existing = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(req.params.key);
  if (!existing) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const contentJson = JSON.stringify(content);
  const safeTitle = title ?? existing.title;
  const safeSubtitle = subtitle ?? existing.subtitle ?? '';
  const safeVisible = is_visible !== undefined ? (is_visible ? 1 : 0) : existing.is_visible;
  const safeLayout = layout_variant ?? existing.layout_variant ?? 'default';

  if (publishNow) {
    db.prepare(`
      UPDATE sections
      SET title = ?,
          subtitle = ?,
          is_visible = ?,
          layout_variant = ?,
          content = ?,
          draft_content = NULL,
          has_draft = 0,
          updated_at = datetime('now')
      WHERE section_key = ?
    `).run(safeTitle, safeSubtitle, safeVisible, safeLayout, contentJson, req.params.key);

    logRevision('section_publish', `Published section: ${existing.title}`, req.user.username);
  } else {
    // Save as draft
    db.prepare(`
      UPDATE sections
      SET title = ?,
          subtitle = ?,
          is_visible = ?,
          layout_variant = ?,
          draft_content = ?,
          has_draft = 1,
          updated_at = datetime('now')
      WHERE section_key = ?
    `).run(safeTitle, safeSubtitle, safeVisible, safeLayout, contentJson, req.params.key);
  }

  const updated = db.prepare('SELECT * FROM sections WHERE section_key = ?').get(req.params.key);
  res.json({
    message: publishNow ? 'Section published' : 'Draft saved successfully',
    section: {
      ...updated,
      content: JSON.parse(updated.content),
      draft_content: updated.draft_content ? JSON.parse(updated.draft_content) : null
    }
  });
});

router.post('/sections/reorder', requireAuth, (req, res) => {
  const { sections } = req.body; // array of { section_key, display_order, is_visible }
  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: 'Expected array of sections' });
  }

  const updateStmt = db.prepare(`
    UPDATE sections
    SET display_order = ?, is_visible = ?, updated_at = datetime('now')
    WHERE section_key = ?
  `);

  for (const s of sections) {
    updateStmt.run(s.display_order, s.is_visible ? 1 : 0, s.section_key);
  }

  logRevision('sections_reorder', 'Reordered and configured section visibility', req.user.username);
  res.json({ message: 'Sections reordered successfully' });
});

// ==========================================
// 5. PROJECTS MANAGEMENT
// ==========================================

router.get('/projects', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY display_order ASC').all();
  const projects = rows.map(p => ({
    ...p,
    renders: p.renders ? JSON.parse(p.renders) : null,
    full_content: p.full_content ? JSON.parse(p.full_content) : null,
    tags: p.tags ? JSON.parse(p.tags) : []
  }));
  res.json(projects);
});

router.get('/projects/:id', requireAuth, (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
  if (!p) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({
    ...p,
    renders: p.renders ? JSON.parse(p.renders) : null,
    full_content: p.full_content ? JSON.parse(p.full_content) : null,
    tags: p.tags ? JSON.parse(p.tags) : []
  });
});

router.post('/projects', requireAuth, (req, res) => {
  const {
    title,
    slug,
    category,
    year,
    role,
    description,
    full_content,
    type,
    media_url,
    image_url,
    renders,
    is_featured,
    is_published,
    display_order,
    tags
  } = req.body;

  if (!title || !description || !image_url) {
    return res.status(400).json({ error: 'Title, description, and thumbnail image URL are required' });
  }

  let finalSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = db.prepare('SELECT id FROM projects WHERE slug = ?').get(finalSlug);
  if (existing) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
  }

  const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM projects').get().m || 0;

  const result = db.prepare(`
    INSERT INTO projects (
      slug, title, category, year, role, description, full_content,
      type, media_url, image_url, renders, is_featured, is_published,
      display_order, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    finalSlug,
    title,
    category || 'General',
    year || new Date().getFullYear().toString(),
    role || '',
    description,
    full_content ? JSON.stringify(full_content) : null,
    type || 'website',
    media_url || '',
    image_url,
    renders ? JSON.stringify(renders) : null,
    is_featured ? 1 : 0,
    is_published !== undefined ? (is_published ? 1 : 0) : 1,
    display_order !== undefined ? display_order : maxOrder + 1,
    tags ? JSON.stringify(tags) : JSON.stringify([])
  );

  logRevision('project_create', `Created project: ${title}`, req.user.username);

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    message: 'Project created successfully',
    project: {
      ...created,
      renders: created.renders ? JSON.parse(created.renders) : null,
      full_content: created.full_content ? JSON.parse(created.full_content) : null,
      tags: created.tags ? JSON.parse(created.tags) : []
    }
  });
});

router.put('/projects/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const {
    title,
    slug,
    category,
    year,
    role,
    description,
    full_content,
    type,
    media_url,
    image_url,
    renders,
    is_featured,
    is_published,
    display_order,
    tags
  } = req.body;

  db.prepare(`
    UPDATE projects
    SET title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        category = COALESCE(?, category),
        year = COALESCE(?, year),
        role = COALESCE(?, role),
        description = COALESCE(?, description),
        full_content = COALESCE(?, full_content),
        type = COALESCE(?, type),
        media_url = COALESCE(?, media_url),
        image_url = COALESCE(?, image_url),
        renders = COALESCE(?, renders),
        is_featured = COALESCE(?, is_featured),
        is_published = COALESCE(?, is_published),
        display_order = COALESCE(?, display_order),
        tags = COALESCE(?, tags),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title,
    slug,
    category,
    year,
    role,
    description,
    full_content ? JSON.stringify(full_content) : null,
    type,
    media_url,
    image_url,
    renders !== undefined ? (renders ? JSON.stringify(renders) : null) : existing.renders,
    is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
    is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
    display_order,
    tags ? JSON.stringify(tags) : null,
    req.params.id
  );

  logRevision('project_update', `Updated project: ${title || existing.title}`, req.user.username);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({
    message: 'Project updated successfully',
    project: {
      ...updated,
      renders: updated.renders ? JSON.parse(updated.renders) : null,
      full_content: updated.full_content ? JSON.parse(updated.full_content) : null,
      tags: updated.tags ? JSON.parse(updated.tags) : []
    }
  });
});

router.delete('/projects/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  logRevision('project_delete', `Deleted project: ${existing.title}`, req.user.username);

  res.json({ message: 'Project deleted successfully' });
});

router.post('/projects/:id/duplicate', requireAuth, (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const newTitle = `${p.title} (Copy)`;
  const newSlug = `${p.slug}-copy-${Date.now().toString().slice(-4)}`;
  const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM projects').get().m || 0;

  const result = db.prepare(`
    INSERT INTO projects (
      slug, title, category, year, role, description, full_content,
      type, media_url, image_url, renders, is_featured, is_published,
      display_order, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    newSlug,
    newTitle,
    p.category,
    p.year,
    p.role,
    p.description,
    p.full_content,
    p.type,
    p.media_url,
    p.image_url,
    p.renders,
    0, // not featured by default
    maxOrder + 1,
    p.tags
  );

  logRevision('project_duplicate', `Duplicated project: ${p.title}`, req.user.username);

  const duplicated = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    message: 'Project duplicated successfully',
    project: {
      ...duplicated,
      renders: duplicated.renders ? JSON.parse(duplicated.renders) : null,
      full_content: duplicated.full_content ? JSON.parse(duplicated.full_content) : null,
      tags: duplicated.tags ? JSON.parse(duplicated.tags) : []
    }
  });
});

router.post('/projects/reorder', requireAuth, (req, res) => {
  const { orderList } = req.body; // array of { id, display_order }
  if (!Array.isArray(orderList)) {
    return res.status(400).json({ error: 'Expected orderList array' });
  }

  const updateStmt = db.prepare('UPDATE projects SET display_order = ? WHERE id = ?');
  for (const item of orderList) {
    updateStmt.run(item.display_order, item.id);
  }

  res.json({ message: 'Projects reordered successfully' });
});

// ==========================================
// 6. SKILLS & TECHNOLOGIES
// ==========================================

router.get('/skills', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM skills ORDER BY cluster_id, display_order ASC').all();
  res.json(rows);
});

router.post('/skills', requireAuth, (req, res) => {
  const { cluster_id, cluster_name, cluster_icon, cluster_color, cluster_description, name, level, icon, project, display_order, is_visible } = req.body;
  if (!name || !cluster_id) {
    return res.status(400).json({ error: 'Skill name and cluster are required' });
  }

  const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM skills WHERE cluster_id = ?').get(cluster_id).m || 0;

  const result = db.prepare(`
    INSERT INTO skills (cluster_id, cluster_name, cluster_icon, cluster_color, cluster_description, name, level, icon, project, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cluster_id,
    cluster_name || cluster_id,
    cluster_icon || 'Cpu',
    cluster_color || '#ef4151',
    cluster_description || '',
    name,
    level || 'Core',
    icon || 'vscode',
    project || '',
    display_order !== undefined ? display_order : maxOrder + 1,
    is_visible !== undefined ? (is_visible ? 1 : 0) : 1
  );

  logRevision('skill_create', `Added skill: ${name}`, req.user.username);
  const created = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Skill created', skill: created });
});

router.put('/skills/:id', requireAuth, (req, res) => {
  const { cluster_id, cluster_name, cluster_icon, cluster_color, cluster_description, name, level, icon, project, display_order, is_visible } = req.body;
  db.prepare(`
    UPDATE skills
    SET cluster_id = COALESCE(?, cluster_id),
        cluster_name = COALESCE(?, cluster_name),
        cluster_icon = COALESCE(?, cluster_icon),
        cluster_color = COALESCE(?, cluster_color),
        cluster_description = COALESCE(?, cluster_description),
        name = COALESCE(?, name),
        level = COALESCE(?, level),
        icon = COALESCE(?, icon),
        project = COALESCE(?, project),
        display_order = COALESCE(?, display_order),
        is_visible = COALESCE(?, is_visible)
    WHERE id = ?
  `).run(
    cluster_id, cluster_name, cluster_icon, cluster_color, cluster_description,
    name, level, icon, project, display_order,
    is_visible !== undefined ? (is_visible ? 1 : 0) : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
  res.json({ message: 'Skill updated', skill: updated });
});

router.delete('/skills/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
  res.json({ message: 'Skill deleted' });
});

// ==========================================
// 7. EXPERIENCES (JOURNEY)
// ==========================================

router.get('/experiences', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM experiences ORDER BY display_order ASC').all();
  res.json(rows);
});

router.post('/experiences', requireAuth, (req, res) => {
  const { date_range, title, place, description, display_order, is_visible } = req.body;
  if (!title || !place || !date_range) {
    return res.status(400).json({ error: 'Title, place, and date range are required' });
  }

  const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM experiences').get().m || 0;
  const result = db.prepare(`
    INSERT INTO experiences (date_range, title, place, description, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    date_range,
    title,
    place,
    description || '',
    display_order !== undefined ? display_order : maxOrder + 1,
    is_visible !== undefined ? (is_visible ? 1 : 0) : 1
  );

  logRevision('experience_create', `Added experience: ${title}`, req.user.username);
  const created = db.prepare('SELECT * FROM experiences WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Experience added', experience: created });
});

router.put('/experiences/:id', requireAuth, (req, res) => {
  const { date_range, title, place, description, display_order, is_visible } = req.body;
  db.prepare(`
    UPDATE experiences
    SET date_range = COALESCE(?, date_range),
        title = COALESCE(?, title),
        place = COALESCE(?, place),
        description = COALESCE(?, description),
        display_order = COALESCE(?, display_order),
        is_visible = COALESCE(?, is_visible)
    WHERE id = ?
  `).run(
    date_range, title, place, description, display_order,
    is_visible !== undefined ? (is_visible ? 1 : 0) : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM experiences WHERE id = ?').get(req.params.id);
  res.json({ message: 'Experience updated', experience: updated });
});

router.delete('/experiences/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM experiences WHERE id = ?').run(req.params.id);
  res.json({ message: 'Experience deleted' });
});

// ==========================================
// 8. MILESTONES & RECOGNITION
// ==========================================

router.get('/milestones', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM milestones ORDER BY display_order ASC').all();
  res.json(rows);
});

router.post('/milestones', requireAuth, (req, res) => {
  const { year, title, event, description, link_url, image_url, category, display_order, is_visible } = req.body;
  if (!year || !title || !event) {
    return res.status(400).json({ error: 'Year, title, and event/subtitle are required' });
  }

  const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM milestones').get().m || 0;
  const result = db.prepare(`
    INSERT INTO milestones (year, title, event, description, link_url, image_url, category, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    year,
    title,
    event,
    description || '',
    link_url || '',
    image_url || '',
    category || 'Milestone',
    display_order !== undefined ? display_order : maxOrder + 1,
    is_visible !== undefined ? (is_visible ? 1 : 0) : 1
  );

  logRevision('milestone_create', `Added milestone: ${title}`, req.user.username);
  const created = db.prepare('SELECT * FROM milestones WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Milestone added', milestone: created });
});

router.put('/milestones/:id', requireAuth, (req, res) => {
  const { year, title, event, description, link_url, image_url, category, display_order, is_visible } = req.body;
  db.prepare(`
    UPDATE milestones
    SET year = COALESCE(?, year),
        title = COALESCE(?, title),
        event = COALESCE(?, event),
        description = COALESCE(?, description),
        link_url = COALESCE(?, link_url),
        image_url = COALESCE(?, image_url),
        category = COALESCE(?, category),
        display_order = COALESCE(?, display_order),
        is_visible = COALESCE(?, is_visible)
    WHERE id = ?
  `).run(
    year, title, event, description, link_url, image_url, category, display_order,
    is_visible !== undefined ? (is_visible ? 1 : 0) : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id);
  res.json({ message: 'Milestone updated', milestone: updated });
});

router.delete('/milestones/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
  res.json({ message: 'Milestone deleted' });
});

// ==========================================
// 9. BRANDS ECOSYSTEM
// ==========================================

router.get('/brands', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM brands ORDER BY display_order ASC').all();
  res.json(rows);
});

router.post('/brands', requireAuth, (req, res) => {
  const { name, image, category, link_url, display_order, is_visible } = req.body;
  if (!name || !image) {
    return res.status(400).json({ error: 'Brand name and image URL are required' });
  }

  const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM brands').get().m || 0;
  const result = db.prepare(`
    INSERT INTO brands (name, image, category, link_url, display_order, is_visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    image,
    category || 'Tech',
    link_url || '',
    display_order !== undefined ? display_order : maxOrder + 1,
    is_visible !== undefined ? (is_visible ? 1 : 0) : 1
  );

  const created = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Brand added', brand: created });
});

router.put('/brands/:id', requireAuth, (req, res) => {
  const { name, image, category, link_url, display_order, is_visible } = req.body;
  db.prepare(`
    UPDATE brands
    SET name = COALESCE(?, name),
        image = COALESCE(?, image),
        category = COALESCE(?, category),
        link_url = COALESCE(?, link_url),
        display_order = COALESCE(?, display_order),
        is_visible = COALESCE(?, is_visible)
    WHERE id = ?
  `).run(
    name, image, category, link_url, display_order,
    is_visible !== undefined ? (is_visible ? 1 : 0) : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  res.json({ message: 'Brand updated', brand: updated });
});

router.delete('/brands/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
  res.json({ message: 'Brand deleted' });
});

// ==========================================
// 10. MEDIA LIBRARY
// ==========================================

router.get('/media', requireAuth, (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM media WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (filename LIKE ? OR original_name LIKE ? OR alt_text LIKE ?)';
    const query = `%${search}%`;
    params.push(query, query, query);
  }

  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/media/upload', requireAuth, upload.array('files', 15), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const category = req.body.category || 'general';
  const insertStmt = db.prepare(`
    INSERT INTO media (filename, original_name, mime_type, file_size, width, height, category, alt_text, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdMedia = [];

  for (const file of req.files) {
    const url = `./Asset/uploads/${file.filename}`;
    const alt = file.originalname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const result = insertStmt.run(
      file.filename,
      file.originalname,
      file.mimetype,
      file.size,
      1200,
      800,
      category,
      alt,
      url
    );
    createdMedia.push({
      id: result.lastInsertRowid,
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      category,
      alt_text: alt,
      url
    });
  }

  logRevision('media_upload', `Uploaded ${createdMedia.length} media file(s)`, req.user.username);
  res.status(201).json({
    message: `${createdMedia.length} file(s) uploaded successfully`,
    media: createdMedia
  });
});

router.put('/media/:id', requireAuth, (req, res) => {
  const { alt_text, caption, category } = req.body;
  db.prepare(`
    UPDATE media
    SET alt_text = COALESCE(?, alt_text),
        caption = COALESCE(?, caption),
        category = COALESCE(?, category)
    WHERE id = ?
  `).run(alt_text, caption, category, req.params.id);

  const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  res.json({ message: 'Media metadata updated', media: updated });
});

router.delete('/media/:id', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!m) {
    return res.status(404).json({ error: 'Media not found' });
  }

  // If in uploads dir, remove physical file
  if (m.filename) {
    const targetPath = path.join(UPLOADS_DIR, m.filename);
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch (err) {
        console.warn('Failed to delete file from disk:', targetPath, err);
      }
    }
  }

  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
  logRevision('media_delete', `Deleted media: ${m.original_name}`, req.user.username);
  res.json({ message: 'Media deleted successfully' });
});

// ==========================================
// 11. SITE SETTINGS
// ==========================================

router.get('/settings', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const r of rows) {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch {
      settings[r.key] = r.value;
    }
  }
  res.json(settings);
});

router.put('/settings/:key', requireAuth, (req, res) => {
  const valString = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
  db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `).run(req.params.key, valString);

  logRevision('settings_update', `Updated site settings: ${req.params.key}`, req.user.username);
  res.json({ message: 'Settings updated successfully' });
});

// ==========================================
// 12. PUBLISHING & REVISIONS SYSTEM
// ==========================================

router.post('/publish', requireAuth, (req, res) => {
  // Promote all draft content to published content
  const draftSections = db.prepare('SELECT * FROM sections WHERE has_draft = 1').all();

  const updateStmt = db.prepare(`
    UPDATE sections
    SET content = draft_content,
        draft_content = NULL,
        has_draft = 0,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  for (const s of draftSections) {
    updateStmt.run(s.id);
  }

  // Publish any draft projects
  const draftProjectsCount = db.prepare('UPDATE projects SET is_published = 1 WHERE is_published = 0').run().changes;

  const totalPublished = draftSections.length + draftProjectsCount;
  logRevision('full_publish', `Published all updates (${draftSections.length} sections, ${draftProjectsCount} projects)`, req.user.username);

  res.json({
    message: `All changes published successfully (${totalPublished} items updated)`,
    publishedCount: totalPublished
  });
});

router.post('/discard', requireAuth, (req, res) => {
  // Clear draft content from sections
  db.prepare(`
    UPDATE sections
    SET draft_content = NULL,
        has_draft = 0
    WHERE has_draft = 1
  `).run();

  res.json({ message: 'Unpublished drafts discarded successfully' });
});

router.get('/revisions', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, revision_type, summary, author, created_at FROM content_revisions ORDER BY id DESC LIMIT 50').all();
  res.json(rows);
});

router.post('/revisions/:id/restore', requireAuth, (req, res) => {
  const rev = db.prepare('SELECT * FROM content_revisions WHERE id = ?').get(req.params.id);
  if (!rev) {
    return res.status(404).json({ error: 'Revision not found' });
  }

  const snapshot = JSON.parse(rev.snapshot);

  // Restore settings
  if (snapshot.settings) {
    const insertSetting = db.prepare(`
      INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);
    for (const [k, v] of Object.entries(snapshot.settings)) {
      insertSetting.run(k, JSON.stringify(v));
    }
  }

  // Restore sections
  if (snapshot.sections) {
    const updateSec = db.prepare(`
      UPDATE sections
      SET content = ?, draft_content = NULL, has_draft = 0, updated_at = datetime('now')
      WHERE section_key = ?
    `);
    for (const [k, v] of Object.entries(snapshot.sections)) {
      updateSec.run(JSON.stringify(v), k);
    }
  }

  logRevision('revision_restore', `Restored content snapshot from revision #${rev.id} (${rev.summary})`, req.user.username);
  res.json({ message: `Restored snapshot from revision #${rev.id}` });
});

// ==========================================
// 13. BACKUP & EXPORT
// ==========================================

router.get('/backup/export', requireAuth, (req, res) => {
  const fullBackup = {
    exported_at: new Date().toISOString(),
    version: '2.0.0',
    admin_users: db.prepare('SELECT id, username, email, created_at, last_login FROM admin_users').all(),
    settings: db.prepare('SELECT * FROM site_settings').all(),
    sections: db.prepare('SELECT * FROM sections').all(),
    projects: db.prepare('SELECT * FROM projects').all(),
    skills: db.prepare('SELECT * FROM skills').all(),
    experiences: db.prepare('SELECT * FROM experiences').all(),
    milestones: db.prepare('SELECT * FROM milestones').all(),
    brands: db.prepare('SELECT * FROM brands').all(),
    media: db.prepare('SELECT * FROM media').all(),
    revisions: db.prepare('SELECT * FROM content_revisions ORDER BY id DESC LIMIT 20').all()
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=jamshed-portfolio-backup-${Date.now()}.json`);
  res.send(JSON.stringify(fullBackup, null, 2));
});

router.post('/backup/import', requireAuth, (req, res) => {
  const backup = req.body;
  if (!backup || !backup.sections || !backup.projects) {
    return res.status(400).json({ error: 'Invalid backup format' });
  }

  try {
    // Restore settings
    if (Array.isArray(backup.settings)) {
      const stmt = db.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))');
      for (const s of backup.settings) stmt.run(s.key, s.value);
    }

    // Restore sections
    if (Array.isArray(backup.sections)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO sections (section_key, title, subtitle, is_visible, display_order, layout_variant, content, draft_content, has_draft, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
      `);
      for (const s of backup.sections) {
        stmt.run(s.section_key, s.title, s.subtitle, s.is_visible, s.display_order, s.layout_variant, s.content, s.draft_content, s.has_draft);
      }
    }

    // Restore projects
    if (Array.isArray(backup.projects)) {
      db.prepare('DELETE FROM projects').run();
      const stmt = db.prepare(`
        INSERT INTO projects (slug, title, category, year, role, description, full_content, type, media_url, image_url, renders, is_featured, is_published, display_order, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of backup.projects) {
        stmt.run(p.slug, p.title, p.category, p.year, p.role, p.description, p.full_content, p.type, p.media_url, p.image_url, p.renders, p.is_featured, p.is_published, p.display_order, p.tags);
      }
    }

    logRevision('backup_import', 'Imported portfolio content from backup JSON file', req.user.username);
    res.json({ message: 'Backup restored successfully' });
  } catch (err) {
    console.error('Backup restore failed:', err);
    res.status(500).json({ error: 'Failed to restore backup: ' + err.message });
  }
});

export default router;
