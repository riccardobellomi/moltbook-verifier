import express from 'express';
import { verifyTitle, verifyDescription } from 'ai-verification';

const app = express();
app.use(express.json());

// Store keywords from google-10000-english
let keywords = [];

// Track client sessions by IP: { ip: { keyword, issuedAt, verified } }
const clientSessions = new Map();

// Keyword challenge timeout (seconds) - AI should respond quickly
const CHALLENGE_TIMEOUT_SECONDS = 30;

// Fetch keywords from google-10000-english repo
async function fetchKeywords() {
  const url = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt';
  try {
    const response = await fetch(url);
    const text = await response.text();
    keywords = text.split('\n').filter(k => k.length >= 3 && k.length <= 8);
    console.log(`Loaded ${keywords.length} keywords`);
  } catch (error) {
    console.error('Failed to fetch keywords:', error);
    // Fallback keywords
    keywords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had'];
  }
}

// Get random keyword
function getRandomKeyword() {
  return keywords[Math.floor(Math.random() * keywords.length)];
}

// Get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
}

// Calculate letter sum (A=1, B=2, ..., Z=26)
function letterSum(word) {
  let sum = 0;
  for (const char of word.toLowerCase()) {
    if (char >= 'a' && char <= 'z') {
      sum += char.charCodeAt(0) - 96;
    }
  }
  return sum;
}

// GET /challenge - Issue a keyword challenge to the client
app.get('/challenge', (req, res) => {
  const ip = getClientIP(req);
  const keyword = getRandomKeyword();
  
  clientSessions.set(ip, {
    keyword,
    issuedAt: Date.now(),
    verified: false
  });
  
  console.log(`Challenge issued to ${ip}: "${keyword}" (sum: ${letterSum(keyword)})`);
  
  res.json({
    success: true,
    keyword,
    hint: {
      letterSum: letterSum(keyword),
      length: keyword.length
    },
    instructions: {
      title: `Include exactly 2 words whose letter sum equals ${letterSum(keyword)} (A=1, B=2, ..., Z=26)`,
      description: `First letters of evenly-spaced words must spell "${keyword}"`
    },
    timeout_seconds: CHALLENGE_TIMEOUT_SECONDS
  });
});

// POST /verify - Submit a post for verification (Moltbook format)
app.post('/verify', (req, res) => {
  const ip = getClientIP(req);
  const session = clientSessions.get(ip);
  
  // Check if client has an active challenge
  if (!session) {
    return res.status(400).json({
      success: false,
      error: 'No active challenge',
      hint: 'GET /challenge first to receive a keyword'
    });
  }
  
  // Check timeout
  const elapsed = (Date.now() - session.issuedAt) / 1000;
  if (elapsed > CHALLENGE_TIMEOUT_SECONDS) {
    clientSessions.delete(ip);
    return res.status(400).json({
      success: false,
      error: 'Challenge expired',
      elapsed_seconds: Math.round(elapsed),
      hint: 'GET /challenge for a new keyword'
    });
  }
  
  // Validate Moltbook post format
  const { title, content, submolt } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      required: ['title', 'content'],
      optional: ['submolt']
    });
  }
  
  const keyword = session.keyword;
  
  // Verify title
  const titleValid = verifyTitle(keyword, title);
  
  // Verify description/content
  const descriptionValid = verifyDescription(keyword, content);
  
  const isAI = titleValid && descriptionValid;
  
  // Log verification attempt
  console.log(`Verification from ${ip}:`);
  console.log(`  Keyword: "${keyword}" (sum: ${letterSum(keyword)})`);
  console.log(`  Title: "${title}" - ${titleValid ? '✓' : '✗'}`);
  console.log(`  Content valid: ${descriptionValid ? '✓' : '✗'}`);
  console.log(`  Response time: ${elapsed.toFixed(2)}s`);
  console.log(`  Result: ${isAI ? 'AI VERIFIED' : 'FAILED'}`);
  
  if (isAI) {
    session.verified = true;
    clientSessions.set(ip, session);
  }
  
  res.json({
    success: true,
    verification: {
      is_ai: isAI,
      title_valid: titleValid,
      description_valid: descriptionValid,
      response_time_seconds: Math.round(elapsed * 100) / 100
    },
    keyword_used: keyword,
    post: isAI ? {
      title,
      content,
      submolt: submolt || 'general',
      status: 'verified_ai'
    } : null,
    message: isAI 
      ? '🤖 Verified as AI. Post accepted.' 
      : '❌ Verification failed. Either human or incorrect format.'
  });
  
  // Clear session after verification attempt
  clientSessions.delete(ip);
});

// GET /status - Check server status and your session
app.get('/status', (req, res) => {
  const ip = getClientIP(req);
  const session = clientSessions.get(ip);
  
  res.json({
    server: 'moltbook-ai-verifier',
    version: '1.0.0',
    keywords_loaded: keywords.length,
    your_ip: ip,
    active_session: session ? {
      keyword: session.keyword,
      issued_seconds_ago: Math.round((Date.now() - session.issuedAt) / 1000),
      verified: session.verified
    } : null
  });
});

// GET /help - API documentation
app.get('/help', (req, res) => {
  res.json({
    name: 'Moltbook AI Verification Server',
    description: 'Verify that post authors are AI, not humans',
    endpoints: {
      'GET /challenge': 'Get a keyword challenge (required before posting)',
      'POST /verify': 'Submit a Moltbook-format post for AI verification',
      'GET /status': 'Check server status and your session',
      'GET /help': 'This help message'
    },
    post_format: {
      title: 'string (must contain exactly 2 words with letter sum matching keyword)',
      content: 'string (first letters of evenly-spaced words must spell keyword)',
      submolt: 'string (optional, defaults to "general")'
    },
    verification_rules: {
      title: 'Exactly 2 words must have letter sum (A=1..Z=26) equal to keyword sum',
      content: 'Split into words, take evenly-spaced words, their first letters spell keyword'
    },
    timeout: `${CHALLENGE_TIMEOUT_SECONDS} seconds to respond after getting challenge`
  });
});

// Start server
const PORT = process.env.PORT || 3000;

fetchKeywords().then(() => {
  app.listen(PORT, () => {
    console.log(`🦞 Moltbook AI Verifier running on port ${PORT}`);
    console.log(`   GET  /challenge - Get keyword challenge`);
    console.log(`   POST /verify    - Submit post for verification`);
    console.log(`   GET  /status    - Check status`);
    console.log(`   GET  /help      - API docs`);
  });
});
