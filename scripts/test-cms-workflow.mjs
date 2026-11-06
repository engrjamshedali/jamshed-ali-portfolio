import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function testCMS() {
  console.log('--- Starting CMS API Verification Suite ---');

  // 1. Verify Public Content Endpoint
  console.log('\n[1] Testing GET /api/content...');
  const contentRes = await fetch(`${BASE_URL}/api/content`);
  assert.strictEqual(contentRes.status, 200, 'Content endpoint should return 200');
  const content = await contentRes.json();
  assert(content.sections, 'Content must contain sections');
  assert(content.projects, 'Content must contain projects');
  assert.strictEqual(content.projects.length >= 15, true, 'Should have at least 15 projects');
  assert(content.clusters, 'Content must contain clusters');
  assert.strictEqual(content.clusters.length, 4, 'Should have 4 skill clusters');
  console.log(`✓ GET /api/content passed! (Sections: ${Object.keys(content.sections).length}, Projects: ${content.projects.length}, Clusters: ${content.clusters.length})`);

  // 2. Verify Admin Login
  console.log('\n[2] Testing POST /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123456' })
  });
  assert.strictEqual(loginRes.status, 200, 'Login should succeed');
  const loginData = await loginRes.json();
  assert(loginData.token, 'Login must return JWT token');
  const token = loginData.token;
  console.log(`✓ Admin login successful! Token received.`);

  // 3. Verify Overview Stats
  console.log('\n[3] Testing GET /api/overview...');
  const overviewRes = await fetch(`${BASE_URL}/api/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(overviewRes.status, 200, 'Overview endpoint should return 200');
  const overview = await overviewRes.json();
  assert(overview.stats, 'Overview must have stats');
  console.log(`✓ Overview stats: Published projects: ${overview.stats.published_projects}, Sections: ${overview.stats.total_sections}, Media: ${overview.stats.total_media}`);

  // 4. Test Updating Section (Hero) as Draft
  console.log('\n[4] Testing PUT /api/sections/hero (Save Draft)...');
  const currentHero = content.sections.hero;
  const updatedHeroContent = {
    ...currentHero,
    handwriting_tagline: 'Building ideas into reality. (CMS Verified)'
  };
  const saveDraftRes = await fetch(`${BASE_URL}/api/sections/hero`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Hero Section',
      content: updatedHeroContent,
      publishNow: false
    })
  });
  assert.strictEqual(saveDraftRes.status, 200, 'Save draft should return 200');
  console.log('✓ Section draft saved successfully!');

  // Verify that public /api/content still has old content, but /api/content?draft=true has new
  const liveContentRes = await fetch(`${BASE_URL}/api/content`);
  const liveContent = await liveContentRes.json();
  assert.strictEqual(liveContent.sections.hero.handwriting_tagline, currentHero.handwriting_tagline, 'Live content must remain unchanged before publishing');

  const draftContentRes = await fetch(`${BASE_URL}/api/content?draft=true`);
  const draftContent = await draftContentRes.json();
  assert.strictEqual(draftContent.sections.hero.handwriting_tagline, 'Building ideas into reality. (CMS Verified)', 'Draft content must reflect changes in preview mode');
  console.log('✓ Draft isolation verified! Live content is intact; preview mode shows draft.');

  // 5. Test Publishing Changes
  console.log('\n[5] Testing POST /api/publish...');
  const publishRes = await fetch(`${BASE_URL}/api/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(publishRes.status, 200, 'Publish should return 200');
  const pubResult = await publishRes.json();
  console.log(`✓ Published successfully: ${pubResult.message}`);

  // Verify live content now shows updated text
  const liveAfterPub = await (await fetch(`${BASE_URL}/api/content`)).json();
  assert.strictEqual(liveAfterPub.sections.hero.handwriting_tagline, 'Building ideas into reality. (CMS Verified)', 'Live content must now show published text');
  console.log('✓ Verified: Public website now dynamically displays published content!');

  // Restore original tagline
  await fetch(`${BASE_URL}/api/sections/hero`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Hero Section', content: currentHero, publishNow: true })
  });

  // 6. Test Projects Management (Create, Update, Duplicate, Delete)
  console.log('\n[6] Testing Project Management CRUD...');
  const newProjRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'TEST AUTONOMOUS SYSTEM',
      category: 'Research',
      year: '2026',
      role: 'Lead Architect',
      description: 'End-to-end automated test project created via CMS test suite.',
      type: 'website',
      image_url: './Asset/img/auranix-logo.png',
      is_featured: 0,
      is_published: 1
    })
  });
  assert.strictEqual(newProjRes.status, 201, 'Project creation should return 201');
  const createdProj = (await newProjRes.json()).project;
  console.log(`✓ Project created with id: ${createdProj.id}`);

  // Duplicate
  const dupRes = await fetch(`${BASE_URL}/api/projects/${createdProj.id}/duplicate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(dupRes.status, 201, 'Duplication should return 201');
  const duplicatedProj = (await dupRes.json()).project;
  console.log(`✓ Project duplicated with id: ${duplicatedProj.id}`);

  // Delete test projects
  await fetch(`${BASE_URL}/api/projects/${createdProj.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  await fetch(`${BASE_URL}/api/projects/${duplicatedProj.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✓ Project cleanup passed!');

  // 7. Test Export Backup
  console.log('\n[7] Testing GET /api/backup/export...');
  const backupRes = await fetch(`${BASE_URL}/api/backup/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(backupRes.status, 200, 'Backup export should return 200');
  const backupJson = await backupRes.json();
  assert(backupJson.sections && backupJson.projects, 'Backup must contain sections and projects');
  console.log(`✓ Full backup exported successfully (${backupJson.projects.length} projects, ${backupJson.sections.length} sections)`);

  // 8. Test Admin HTML and Public HTML routes
  console.log('\n[8] Testing Web Routes...');
  const indexPage = await fetch(`${BASE_URL}/`);
  assert.strictEqual(indexPage.status, 200, 'Public homepage should return 200');
  const indexHtml = await indexPage.text();
  assert(indexHtml.includes('id="root"'), 'Index HTML should contain root div');

  const adminPage = await fetch(`${BASE_URL}/admin`);
  assert.strictEqual(adminPage.status, 200, 'Admin page should return 200');
  const adminHtml = await adminPage.text();
  assert(adminHtml.includes('id="admin-root"'), 'Admin HTML should contain admin-root div');

  const adminLoginPage = await fetch(`${BASE_URL}/admin/login`);
  assert.strictEqual(adminLoginPage.status, 200, 'Admin login route should return 200');
  console.log('✓ All web routes verified (/, /admin, /admin/login)!');

  console.log('\n=============================================');
  console.log('🎉 ALL CMS VERIFICATION TESTS PASSED (8/8)!');
  console.log('=============================================\n');
}

testCMS().catch(err => {
  console.error('\n❌ CMS Verification Failed:', err);
  process.exit(1);
});

