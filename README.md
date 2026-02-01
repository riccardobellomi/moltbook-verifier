# Moltbook AI Verifier 🦞

A proof-of-concept server that verifies Moltbook posts are created by AI, not humans.

## How It Works

1. **Client requests a challenge** (`GET /challenge`)
   - Server issues a random keyword from 7,000+ common English words
   - Client has 30 seconds to respond (configurable)

2. **Client crafts a valid post** using the keyword:
   - **Title rule**: Must contain exactly 2 words whose letter sum (A=1, B=2...Z=26) equals the keyword's sum
   - **Content rule**: First letters of evenly-spaced words must spell the keyword

3. **Client submits post** (`POST /verify`)
   - Server validates using `ai-verification` package
   - Returns verification result

## Why This Works

- Humans can't quickly calculate letter sums and craft matching words
- AI can algorithmically generate valid posts in milliseconds
- Configurable timeout prevents human cheating

## Project Structure

```
moltbook-verifier/
├── src/
│   ├── config/         # Configuration management
│   ├── middleware/     # Express middleware (security, validation, errors)
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic (keywords, sessions, verification)
│   ├── utils/          # Helpers and logger
│   ├── app.js          # Express app factory
│   └── index.js        # Entry point
├── craft-post.js       # Helper to generate valid AI posts
├── .env.example        # Environment variables template
└── package.json
```

## Installation

```bash
git clone https://github.com/riccardobellomi/moltbook-verifier.git
cd moltbook-verifier
npm install
cp .env.example .env  # Configure as needed
```

## Usage

### Start Server

```bash
# Production
npm start

# Development
npm run dev
```

Server runs on port 3000 (or `PORT` env variable).

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/challenge` | GET | Get a keyword challenge |
| `/verify` | POST | Submit a post for verification |
| `/status` | GET | Check server status |
| `/help` | GET | API documentation |
| `/health` | GET | Health check (for load balancers) |

### Example Flow

```bash
# 1. Get challenge
curl http://localhost:3000/challenge
# {"keyword":"charter","hint":{"letterSum":73},...}

# 2. Submit valid post
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"title":"the zzta the zzta","content":"could having after really through every really"}'
# {"verification":{"is_ai":true},...}
```

### Generate Valid Posts

Use the helper script to craft posts that pass verification:

```bash
node craft-post.js "security"
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `CHALLENGE_TIMEOUT_SECONDS` | 30 | Time limit for challenges |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## Security Features

- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Sanitizes all inputs
- **Request Size Limits**: Prevents large payload attacks
- **Error Handling**: No sensitive info leaked in production
- **Graceful Shutdown**: Proper cleanup on termination

## Design Patterns

- **Singleton Services**: KeywordService, SessionService
- **Dependency Injection**: Services injected via imports
- **Middleware Pipeline**: Security → Validation → Route → Error
- **Factory Pattern**: `createApp()` for testability
- **Configuration Object**: Centralized, frozen config

## Post Format (Moltbook Compatible)

```json
{
  "title": "string (required, max 500 chars)",
  "content": "string (required, max 10000 chars)",
  "submolt": "string (optional, defaults to 'general')"
}
```

## Verification Rules

### Title Verification
- Calculate letter sum of keyword (A=1, B=2, ..., Z=26)
- Title must contain **exactly 2 words** with that same sum
- Non-letter characters are ignored

### Description Verification
- Split content into words
- Take evenly-spaced words (positions: `floor(total/keywordLength * i)`)
- First letters of these words must spell the keyword

## Dependencies

- `express` - Web server
- `helmet` - Security headers
- `cors` - Cross-origin support
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation
- `winston` - Logging
- `dotenv` - Environment configuration
- `ai-verification` - Verification algorithms

## Keywords Source

Keywords fetched from [google-10000-english](https://github.com/first20hours/google-10000-english) (filtered to 3-8 character words).

## License

MIT
