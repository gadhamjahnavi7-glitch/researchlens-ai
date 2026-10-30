import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { ResearchProject } from '../src/models/ResearchProject.js';
import { Document } from '../src/models/Document.js';
import { DocumentChunk } from '../src/models/DocumentChunk.js';

let server;
let baseUrl;
let authToken = '';
let testUserId = '';
let testProjectId = '';

before(async () => {
  await connectDB();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

test('Health Check: GET /api/health returns 200 and healthy status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.service, 'ResearchLens AI Backend');
});

test('Auth: Register new researcher account', async () => {
  const email = `researcher_${Date.now()}@university.edu`;
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Jane Vance',
      email,
      password: 'SecureResearchPassword123!'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.name, 'Dr. Jane Vance');
  authToken = data.token;
  testUserId = data.user.id;
});

test('Auth: Reject duplicate email registration with 409 Conflict', async () => {
  const user = await User.findById(testUserId);
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Researcher',
      email: user.email,
      password: 'AnotherPassword123!'
    })
  });

  assert.equal(res.status, 409);
});

test('Auth: Login with valid credentials', async () => {
  const user = await User.findById(testUserId);
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: 'SecureResearchPassword123!'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
});

test('Auth: Reject invalid credentials with 401 Unauthorized', async () => {
  const user = await User.findById(testUserId);
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: 'WrongPassword'
    })
  });

  assert.equal(res.status, 401);
});

test('Security: Protected route rejects unauthenticated request with 401', async () => {
  const res = await fetch(`${baseUrl}/api/projects`);
  assert.equal(res.status, 401);
});

test('Projects: Create new research project with authentication', async () => {
  const res = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      title: 'Neuroplasticity & Working Memory Modulation',
      description: 'Systematic investigation of targeted working memory protocols.',
      tags: ['Cognitive Neuroscience', 'Neuroplasticity']
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.project.title, 'Neuroplasticity & Working Memory Modulation');
  testProjectId = data.project._id;
});

test('Demo Data: Seed sample research workspace with papers and chunks', async () => {
  const res = await fetch(`${baseUrl}/api/projects/seed-sample`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.project);
  assert.ok(data.documentsCount >= 3);
  testProjectId = data.project._id;
});

test('Documents: Fetch indexed documents and verify chunk counts', async () => {
  const res = await fetch(`${baseUrl}/api/documents?projectId=${testProjectId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.documents.length >= 3);
  const firstDoc = data.documents[0];
  assert.ok(firstDoc.chunkCount > 0);
  assert.equal(firstDoc.processingStatus, 'completed');
});

test('Research Chat: Ask cross-document inquiry and verify grounded evidence', async () => {
  const res = await fetch(`${baseUrl}/api/research/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      projectId: testProjectId,
      question: 'What effect does 0.5mg melatonin have on psychomotor vigilance and attention lapses?'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.message.content.length > 50);
  assert.ok(data.message.citations.length > 0);
  const firstCitation = data.message.citations[0];
  assert.ok(firstCitation.excerpt);
  assert.ok(firstCitation.pageNumber >= 1);
});

test('Contradictions: Detect cross-document disagreements with verifiable citations', async () => {
  const res = await fetch(`${baseUrl}/api/research/compare-claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      projectId: testProjectId,
      topic: 'Circadian entrainment efficacy'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.comparisons.length > 0);
  const comp = data.comparisons[0];
  assert.ok(comp.claimA.statement);
  assert.ok(comp.claimB.statement);
  assert.ok(comp.potentialReasons.length > 0);
  assert.equal(comp.requiresHumanReview, true);
});

test('Knowledge Discovery: Extract themes, concept graph, and research gaps', async () => {
  const res = await fetch(`${baseUrl}/api/discovery/${testProjectId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.discovery.themes.length > 0);
  assert.ok(data.discovery.graphData.nodes.length > 0);
  assert.ok(data.discovery.researchGaps.length > 0);
});

test('Reports: Generate structured evidence-grounded research report', async () => {
  const res = await fetch(`${baseUrl}/api/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      projectId: testProjectId,
      researchQuestion: 'How do pharmacological vs photic interventions compare in mitigating cognitive fatigue?'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.report.reportContent.executiveSummary);
  assert.ok(data.report.reportContent.majorFindings.length > 0);
  assert.ok(data.report.sourceReferences.length > 0);

  // Test Markdown export
  const exportRes = await fetch(`${baseUrl}/api/reports/${data.report._id}/export?format=markdown`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  assert.equal(exportRes.status, 200);
  const markdownText = await exportRes.text();
  assert.ok(markdownText.includes('# '));
  assert.ok(markdownText.includes('Executive Summary'));
  assert.ok(markdownText.includes('References'));
});

test('Search: Search keywords and verify page-numbered matching chunks', async () => {
  const res = await fetch(`${baseUrl}/api/search?q=melatonin&projectId=${testProjectId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.chunks.length > 0);
  assert.ok(data.chunks[0].pageNumber >= 1);
});

