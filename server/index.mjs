import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './api.mjs';
import './db.mjs'; // ensures db initialized

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Agent-Readiness: RFC 8288 Link headers and Content Signals
app.use((req, res, next) => {
  res.setHeader('Content-Signal', 'search=yes, ai-train=no');
  res.setHeader(
    'Link',
    '<https://jamshedali.me/llms.txt>; rel="alternate"; type="text/plain", ' +
    '<https://jamshedali.me/index.md>; rel="alternate"; type="text/markdown", ' +
    '<https://jamshedali.me/.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"'
  );
  next();
});

// Static asset delivery
app.use('/Asset', express.static(path.join(ROOT_DIR, 'Asset')));
app.use('/Asset/uploads', express.static(path.join(ROOT_DIR, 'Asset', 'uploads')));

// Search engine & crawler directives
app.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').sendFile(path.join(ROOT_DIR, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml; charset=utf-8').sendFile(path.join(ROOT_DIR, 'sitemap.xml'));
});

// LLMs text files (plain text specification)
app.get('/llms.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').sendFile(path.join(ROOT_DIR, 'llms.txt'));
});

app.get('/llms-full.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').sendFile(path.join(ROOT_DIR, 'llms-full.txt'));
});

// Model Context Protocol (MCP) Server Card (SEP-1649)
app.get(['/.well-known/mcp/server-card.json', '/.well-known/mcp.json'], (req, res) => {
  const cardPath = path.join(ROOT_DIR, '.well-known', 'mcp', 'server-card.json');
  if (fs.existsSync(cardPath)) {
    res.type('application/json; charset=utf-8').send(fs.readFileSync(cardPath, 'utf8'));
  } else {
    res.status(404).json({ error: 'MCP Server Card not found' });
  }
});

// Raw Markdown content endpoint
app.get(['/index.md', '/portfolio.md'], (req, res) => {
  res.type('text/markdown; charset=utf-8').sendFile(path.join(ROOT_DIR, 'index.md'));
});

// MCP JSON-RPC Server Endpoint for AI Agents
app.all('/api/mcp', (req, res) => {
  if (req.method === 'GET') {
    return res.json({
      name: "jamshedali-portfolio",
      version: "1.0.0",
      description: "Model Context Protocol endpoint for Jamshed Ali's portfolio.",
      serverCard: "/.well-known/mcp/server-card.json",
      toolsEndpoint: "/api/mcp"
    });
  }

  const { jsonrpc, id, method, params } = req.body || {};
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: "get_bio",
            description: "Get Jamshed Ali's biographical details, academic background at Sukkur IBA University, and AuraNix Technologies leadership info.",
            inputSchema: { type: "object", properties: {} }
          },
          {
            name: "get_projects",
            description: "List verified engineering, research, and software projects by Jamshed Ali.",
            inputSchema: {
              type: "object",
              properties: { category: { type: "string" } }
            }
          },
          {
            name: "submit_inquiry",
            description: "Submit a project brief or collaboration inquiry to Jamshed Ali.",
            inputSchema: {
              type: "object",
              required: ["name", "email", "message"],
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                message: { type: "string" }
              }
            }
          }
        ]
      }
    });
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    if (toolName === 'get_bio') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                name: "Jamshed Ali",
                title: "Computer Systems Engineering Student, Developer, Researcher & Founder",
                university: "Sukkur IBA University (CSE-V)",
                company: "AuraNix Technologies (Founder & CEO)",
                location: "Sukkur, Sindh, Pakistan",
                website: "https://jamshedali.me",
                email: "engr.jamshed.ali.rind@gmail.com",
                phone: "+92 370 1228685"
              }, null, 2)
            }
          ]
        }
      });
    }

    if (toolName === 'get_projects') {
      const projects = [
        { title: "Agentic AI for Autonomous Cyber-Defense", category: "Research", stack: "Python, LangGraph, PyShark, Docker" },
        { title: "Zenith Cybersecurity Dashboard", category: "Cybersecurity", stack: "React, Framer Motion, Node.js, WebSockets" },
        { title: "AuraNix Technologies Official Platform", category: "Web Development", url: "https://auranix.tech" },
        { title: "Shikarpur Sweets E-Commerce", category: "Web Development", stack: "React, Node.js, Express, SQLite" },
        { title: "AuraWord Intelligent Processing", category: "AI & ML", stack: "Python, Tesseract OCR, Gemini API" }
      ];
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }]
        }
      });
    }

    if (toolName === 'submit_inquiry') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: "text", text: "Inquiry registered successfully. Reachable via engr.jamshed.ali.rind@gmail.com and WhatsApp +923701228685." }]
        }
      });
    }
  }

  res.json({
    jsonrpc: '2.0',
    id: id || null,
    result: { status: 'ok', server: 'jamshedali-portfolio-mcp' }
  });
});

// Register existing REST API Routes
app.use('/api', apiRouter);

// Admin route handler - serve admin.html for /admin and any subroutes
app.use('/admin', (req, res) => {
  const adminHtmlPath = path.join(ROOT_DIR, 'admin.html');
  if (fs.existsSync(adminHtmlPath)) {
    res.sendFile(adminHtmlPath);
  } else {
    res.status(404).send('Admin dashboard HTML not found. Run npm run build first.');
  }
});

// Homepage route with Content Negotiation (Serve Markdown if requested)
app.get(['/', '/index.html'], (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) {
    res.type('text/markdown; charset=utf-8').sendFile(path.join(ROOT_DIR, 'index.md'));
  } else {
    res.type('text/html; charset=utf-8').sendFile(path.join(ROOT_DIR, 'index.html'));
  }
});

// About page
app.get('/about', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) {
    res.type('text/markdown; charset=utf-8').sendFile(path.join(ROOT_DIR, 'index.md'));
  } else {
    res.type('text/html; charset=utf-8').sendFile(path.join(ROOT_DIR, 'about.html'));
  }
});

// Contact page
app.get('/contact', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) {
    res.type('text/markdown; charset=utf-8').sendFile(path.join(ROOT_DIR, 'index.md'));
  } else {
    res.type('text/html; charset=utf-8').sendFile(path.join(ROOT_DIR, 'contact.html'));
  }
});

// Legal pages: Terms of Service and Privacy Policy
app.get('/terms', (req, res) => {
  res.type('text/html; charset=utf-8').sendFile(path.join(ROOT_DIR, 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.type('text/html; charset=utf-8').sendFile(path.join(ROOT_DIR, 'privacy.html'));
});

// 404 Handler for all other non-existent routes
app.use((req, res) => {
  res.status(404);
  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) {
    return res.json({ error: 'Not Found', status: 404, message: 'The requested resource does not exist.' });
  }
  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) {
    return res.type('text/markdown; charset=utf-8').send('# 404 Not Found\n\nThe requested resource does not exist on jamshedali.me.\n\n[Return to Homepage](https://jamshedali.me/)');
  }
  const notFoundHtml = path.join(ROOT_DIR, '404.html');
  if (fs.existsSync(notFoundHtml)) {
    return res.type('text/html; charset=utf-8').sendFile(notFoundHtml);
  }
  res.type('text/plain; charset=utf-8').send('404 Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 Jamshed Ali Portfolio & CMS Server Running!`);
      console.log(`🌐 Public Website:   http://localhost:${port}`);
      console.log(`🔒 Admin Dashboard: http://localhost:${port}/admin`);
      console.log(`🔑 Login Page:      http://localhost:${port}/admin/login`);
      console.log(`📡 REST API:        http://localhost:${port}/api/content`);
      console.log(`🤖 Agent llms.txt:  http://localhost:${port}/llms.txt`);
      console.log(`📋 MCP Server Card: http://localhost:${port}/.well-known/mcp/server-card.json`);
      console.log(`=================================================\n`);
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && !isNaN(port)) {
        console.warn(`Port ${port} is in use, trying port ${Number(port) + 1}...`);
        resolve(startServer(Number(port) + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Start server unconditionally for Hostinger Node.js hosting and direct CLI execution
startServer();

export default app;
