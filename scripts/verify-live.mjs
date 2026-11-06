async function verifyLive() {
  console.log('========================================================');
  console.log('🌐 VERIFYING LIVE HOSTINGER DEPLOYMENT (https://jamshedali.me)');
  console.log('========================================================\n');
  
  let passed = 0;
  let failed = 0;

  function check(name, ok, extra = '') {
    if (ok) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  // 1. Robots.txt
  const robots = await fetch('https://jamshedali.me/robots.txt').then(r => r.text());
  check('1. robots.txt Content-Signal', /Content-Signal:\s*search=yes,\s*ai-train=no/i.test(robots));

  // 2. 404 test
  const notFound = await fetch('https://jamshedali.me/non-existent-page-check-404-' + Date.now());
  check('2. 404 status on missing page', notFound.status === 404, `(got status ${notFound.status})`);

  // 3. Homepage HTML & Head tags
  const homeRes = await fetch('https://jamshedali.me/');
  const homeText = await homeRes.text();
  const textChars = homeText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').length;
  check('3. Readable without JS (>1500 chars text)', textChars > 1500, `(got ${textChars} chars)`);
  check('4. Canonical tag present', homeText.includes('rel="canonical"'));
  check('5. JSON-LD present and valid', homeText.includes('application/ld+json'));
  check('6. Organization / LocalBusiness in JSON-LD', homeText.includes('"Organization"') || homeText.includes('"LocalBusiness"'));
  check('7. sameAs external profile links present', homeText.includes('sameAs') && homeText.includes('github'));
  check('8. Multi-schema types in JSON-LD', homeText.includes('"Person"') && homeText.includes('"WebSite"'));
  check('9. About, Contact, Terms linked', homeText.includes('href="/about"') && homeText.includes('href="/contact"'));

  // 10. llms.txt served as text/plain
  const llmsRes = await fetch('https://jamshedali.me/llms.txt');
  check('10. llms.txt served as text/plain (200)', llmsRes.status === 200 && llmsRes.headers.get('content-type')?.includes('text/plain'), `(status: ${llmsRes.status}, type: ${llmsRes.headers.get('content-type')})`);

  // 11. llms.txt well-formed
  const llmsText = await llmsRes.text();
  check('11. llms.txt well-formed markdown', llmsText.startsWith('# Jamshed Ali') && llmsText.includes('## Key Pages'));

  // 12. Markdown content negotiation
  const mdRes = await fetch('https://jamshedali.me/', { headers: { 'Accept': 'text/markdown' } });
  check('12. Accept text/markdown returns markdown', mdRes.headers.get('content-type')?.includes('text/markdown'), `(type: ${mdRes.headers.get('content-type')})`);

  // 13. Link headers
  const linkHeader = homeRes.headers.get('link') || '';
  check('13. RFC 8288 Link header on homepage', linkHeader.includes('llms.txt') && linkHeader.includes('index.md'), `(header: ${linkHeader})`);

  // 14. WebMCP tools in HTML
  check('14. WebMCP tool annotations & registerTool', homeText.includes('toolname="contactJamshed"') && homeText.includes('navigator.modelContext.registerTool'));

  // 15. MCP Server Card
  const mcpRes = await fetch('https://jamshedali.me/.well-known/mcp/server-card.json');
  check('15. MCP Server Card (SEP-1649) accessible (200 JSON)', mcpRes.status === 200 && mcpRes.headers.get('content-type')?.includes('application/json'), `(status: ${mcpRes.status}, type: ${mcpRes.headers.get('content-type')})`);

  console.log('\n========================================================');
  console.log(`LIVE AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');
}

verifyLive();

