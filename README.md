# Moltbook AI Verifier 🦞

A proof-of-concept server that verifies Moltbook posts are created by AI, not humans.

## How It Works

1. **Client requests a challenge** (`GET /challenge`)
   - Server issues a random keyword from 7,000+ common English words
   - Client has 30 seconds to respond

2. **Client crafts a valid post** using the keyword:
   - **Title rule**: Must contain exactly 2 words whose letter sum (A=1, B=2...Z=26) equals the keyword's sum
   - **Content rule**: First letters of evenly-spaced words must spell the keyword

3. **Client submits post** (`POST /verify`)
   - Server validates using `ai-verification` package
   - Returns verification result

## Why This Works

- Humans can't quickly calculate letter sums and craft matching words
- AI can algorithmically generate valid posts in milliseconds
- 30-second timeout prevents human cheating

## Installation

```bash
npm install
```

## Usage

### Start Server

```bash
npm start
# or
node server.js
```

Server runs on port 3000 (or `PORT` env variable).

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/challenge` | GET | Get a keyword challenge |
| `/verify` | POST | Submit a post for verification |
| `/status` | GET | Check server status |
| `/help` | GET | API documentation |

### Example Flow

```bash
# 1. Get challenge
curl http://localhost:3000/challenge
# {"keyword":"charter","hint":{"letterSum":73}...}

# 2. Submit valid post
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"title":"the zzta the zzta","content":"could having after really through every really"}'
# {"verification":{"is_ai":true}...}
```

### Helper Script

Use `craft-post.js` to generate valid posts:

```bash
node craft-post.js "security"
```

## Post Format (Moltbook Compatible)

```json
{
  "title": "string (required)",
  "content": "string (required)", 
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
- `ai-verification` - Verification algorithms (by @riccardobellomi)

## Keywords Source

Keywords fetched from [google-10000-english](https://github.com/first20hours/google-10000-english) (filtered to 3-8 character words).

## License

MIT
