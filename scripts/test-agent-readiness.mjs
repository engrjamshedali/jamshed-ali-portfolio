import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startServer } from '../server/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_PORT = process.env.PORT || 3000;

async function request(path, options = {}) {
  const url = `http://127.0.0.1:${TEST_PORT}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    text
  };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🤖 AGENT-READINESS VERIFICATION SUITE (ALL 15 GOALS)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}: ${details}`);
      failed++;
    }
  }

  try {
    // Wait briefly for server initialization
    await new Promise(r => setTimeout(r, 1000));

    // Goal 1: Content Signals declared in robots.txt
    const robots = await request('/robots.txt');
    assert(
      'Goal 1: Content Signals declared in robots.txt',
      robots.status === 200 && /Content-Signal:\s*search=yes,\s*ai-train=no/i.test(robots.text),
      `Expected Content-Signal in robots.txt, got: ${robots.text.slice(0, 150)}`
    );

    // Goal 2: Missing pages return a real 404
    const notFound = await request('/non-existent-page-test-404-' + Date.now());
    assert(
      'Goal 2: Missing pages return a real 404 status code',
      notFound.status === 404,
      `Expected status 404, got status ${notFound.status}`
    );

    // Goal 3: Content is readable without JavaScript
    const homeHtml = await request('/');
    const textOnly = homeHtml.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const hasRichCopy = textOnly.includes('Jamshed Ali') &&
                        textOnly.includes('Sukkur IBA University') &&
                        textOnly.includes('AuraNix Technologies') &&
                        textOnly.includes('Agentic AI') &&
                        textOnly.length > 1500;
    assert(
      'Goal 3: Content is readable without JavaScript (>1500 chars of pre-rendered copy)',
      hasRichCopy,
      `Raw text length was ${textOnly.length} chars`
    );

    // Goal 4: Title, meta description and canonical are present
    const hasTitle = /<title>[^<]+<\/title>/i.test(homeHtml.text);
    const hasMetaDesc = /<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(homeHtml.text);
    const hasCanonical = /<link\s+rel=["']canonical["']\s+href=["']https:\/\/jamshedali\.me\/["']/i.test(homeHtml.text);
    assert(
      'Goal 4: Title, meta description and canonical link are present',
      hasTitle && hasMetaDesc && hasCanonical,
      `hasTitle: ${hasTitle}, hasMetaDesc: ${hasMetaDesc}, hasCanonical: ${hasCanonical}`
    );

    // Goal 5: JSON-LD structured data is present and valid JSON
    const jsonLdMatch = homeHtml.text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    let jsonLdData = null;
    if (jsonLdMatch) {
      try {
        jsonLdData = JSON.parse(jsonLdMatch[1].trim());
      } catch (e) {
        jsonLdData = null;
      }
    }
    assert(
      'Goal 5: JSON-LD structured data is present and valid',
      jsonLdData !== null,
      `Failed to parse JSON-LD: ${jsonLdMatch ? jsonLdMatch[1].slice(0, 100) : 'none found'}`
    );

    // Goal 6: Organization or LocalBusiness schema is complete
    const graph = jsonLdData?.['@graph'] || (jsonLdData ? [jsonLdData] : []);
    const orgNode = graph.find(node => {
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      return types.includes('Organization') || types.includes('LocalBusiness') || types.includes('ProfessionalService');
    });
    assert(
      'Goal 6: Organization or LocalBusiness schema is complete',
      orgNode && orgNode.name && orgNode.url,
      `Organization node: ${JSON.stringify(orgNode)}`
    );

    // Goal 7: Entity is linked to external profiles via sameAs
    const personOrOrg = graph.find(node => node.sameAs && Array.isArray(node.sameAs) && node.sameAs.length > 0);
    assert(
      'Goal 7: Entity is linked to external profiles via sameAs',
      personOrOrg !== undefined && personOrOrg.sameAs.some(link => link.includes('github') || link.includes('linkedin')),
      `sameAs links: ${JSON.stringify(personOrOrg?.sameAs)}`
    );

    // Goal 8: Structured data covers several schema types
    const typesPresent = new Set();
    graph.forEach(node => {
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      types.forEach(t => typesPresent.add(t));
    });
    assert(
      'Goal 8: Structured data covers several schema types (≥ 4 types)',
      typesPresent.size >= 4,
      `Found schema types: ${Array.from(typesPresent).join(', ')}`
    );

    // Goal 9: About, contact and legal pages are linked and return 200
    const hasAboutLink = /href=["']\/about["']/i.test(homeHtml.text);
    const hasContactLink = /href=["']\/contact["']/i.test(homeHtml.text);
    const hasTermsLink = /href=["']\/terms["']/i.test(homeHtml.text);
    const hasPrivacyLink = /href=["']\/privacy["']/i.test(homeHtml.text);

    const aboutRes = await request('/about');
    const contactRes = await request('/contact');
    const termsRes = await request('/terms');
    const privacyRes = await request('/privacy');

    assert(
      'Goal 9: About, contact and legal pages are linked and return HTTP 200',
      hasAboutLink && hasContactLink && hasTermsLink && hasPrivacyLink &&
      aboutRes.status === 200 && contactRes.status === 200 && termsRes.status === 200 && privacyRes.status === 200,
      `Links: about=${hasAboutLink}, contact=${hasContactLink}, terms=${hasTermsLink}, privacy=${hasPrivacyLink} | Statuses: about=${aboutRes.status}, contact=${contactRes.status}, terms=${termsRes.status}, privacy=${privacyRes.status}`
    );

    // Goal 10: llms.txt is served as plain text
    const llmsRes = await request('/llms.txt');
    const isPlainText = llmsRes.headers['content-type']?.includes('text/plain');
    assert(
      'Goal 10: /llms.txt is served as plain text (HTTP 200)',
      llmsRes.status === 200 && isPlainText,
      `Status: ${llmsRes.status}, Content-Type: ${llmsRes.headers['content-type']}`
    );

    // Goal 11: llms.txt is well-formed
    const startsWithHeading = /^#\s+[^\n]+/m.test(llmsRes.text);
    const hasBlockquote = /^>\s+[^\n]+/m.test(llmsRes.text);
    const hasMarkdownLinks = /\[[^\]]+\]\(https?:\/\/[^\)]+\)/.test(llmsRes.text);
    assert(
      'Goal 11: llms.txt is well-formed (# heading, > summary, markdown links)',
      startsWithHeading && hasBlockquote && hasMarkdownLinks,
      `Heading: ${startsWithHeading}, Blockquote: ${hasBlockquote}, Markdown links: ${hasMarkdownLinks}`
    );

    // Goal 12: Serves Markdown when an agent asks for it
    const mdRes = await request('/', { headers: { 'Accept': 'text/markdown' } });
    const isMarkdownType = mdRes.headers['content-type']?.includes('text/markdown');
    const isMarkdownContent = mdRes.text.startsWith('# Jamshed Ali');
    assert(
      'Goal 12: Serves Markdown representation for Accept: text/markdown',
      mdRes.status === 200 && isMarkdownType && isMarkdownContent,
      `Status: ${mdRes.status}, Content-Type: ${mdRes.headers['content-type']}, startsWith: ${mdRes.text.slice(0, 30)}`
    );

    // Goal 13: Homepage advertises resources via Link headers
    const linkHeader = homeHtml.headers['link'] || '';
    const hasLlmsLink = linkHeader.includes('llms.txt') && linkHeader.includes('rel="alternate"');
    const hasMdLink = linkHeader.includes('index.md') && linkHeader.includes('rel="alternate"');
    assert(
      'Goal 13: Homepage emits RFC 8288 Link header for llms.txt and markdown',
      hasLlmsLink && hasMdLink,
      `Link header: ${linkHeader}`
    );

    // Goal 14: Site exposes WebMCP tools to in-browser agents
    const hasToolNameAttr = /toolname=["']contactJamshed["']/i.test(homeHtml.text);
    const hasToolDescAttr = /tooldescription=["'][^"']+["']/i.test(homeHtml.text);
    const hasModelContextCall = homeHtml.text.includes('navigator.modelContext.registerTool');
    assert(
      'Goal 14: Site exposes WebMCP tools (Form annotations & registerTool call)',
      hasToolNameAttr && hasToolDescAttr && hasModelContextCall,
      `toolname: ${hasToolNameAttr}, tooldescription: ${hasToolDescAttr}, registerTool: ${hasModelContextCall}`
    );

    // Goal 15: MCP Server Card is published at /.well-known/mcp/server-card.json
    const mcpCardRes = await request('/.well-known/mcp/server-card.json');
    let mcpCardJson = null;
    try {
      mcpCardJson = JSON.parse(mcpCardRes.text);
    } catch {}
    const isValidCard = mcpCardJson &&
                        mcpCardJson.name &&
                        mcpCardJson.version &&
                        mcpCardJson.endpoint &&
                        mcpCardJson.capabilities;
    assert(
      'Goal 15: MCP Server Card (SEP-1649) is published at /.well-known/mcp/server-card.json',
      mcpCardRes.status === 200 &&
      mcpCardRes.headers['content-type']?.includes('application/json') &&
      isValidCard,
      `Status: ${mcpCardRes.status}, Content-Type: ${mcpCardRes.headers['content-type']}, parsed: ${Boolean(mcpCardJson)}`
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
