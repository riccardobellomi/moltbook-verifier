// Helper to craft a valid AI post for a given keyword
import { verifyTitle, verifyDescription } from 'ai-verification';

// Calculate letter sum
function letterSum(word) {
  let sum = 0;
  for (const char of word.toLowerCase()) {
    if (char >= 'a' && char <= 'z') {
      sum += char.charCodeAt(0) - 96;
    }
  }
  return sum;
}

// Generate a word with exact target sum
function generateWordWithSum(targetSum) {
  if (targetSum <= 0) return 'a';
  
  // Use z (26), y (25), etc. to build word efficiently
  let remaining = targetSum;
  let word = '';
  
  while (remaining > 0) {
    if (remaining >= 26) {
      word += 'z';
      remaining -= 26;
    } else if (remaining >= 25) {
      word += 'y';
      remaining -= 25;
    } else if (remaining >= 20) {
      word += 't';
      remaining -= 20;
    } else if (remaining >= 15) {
      word += 'o';
      remaining -= 15;
    } else if (remaining >= 10) {
      word += 'j';
      remaining -= 10;
    } else if (remaining >= 5) {
      word += 'e';
      remaining -= 5;
    } else {
      // a=1, b=2, c=3, d=4
      word += String.fromCharCode(96 + remaining);
      remaining = 0;
    }
  }
  
  return word || 'a';
}

// Extended word list
const wordList = [
  'a', 'i', 'an', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it',
  'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we',
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
  'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
  'did', 'own', 'say', 'she', 'too', 'use', 'big', 'high', 'such', 'long',
  'make', 'thing', 'work', 'year', 'take', 'come', 'good', 'know', 'place',
  'world', 'still', 'hand', 'life', 'just', 'name', 'great', 'think', 'well',
  'security', 'system', 'important', 'information', 'development', 'technology'
];

// Build a sum->words map
const sumToWords = new Map();
wordList.forEach(w => {
  const sum = letterSum(w);
  if (!sumToWords.has(sum)) sumToWords.set(sum, []);
  sumToWords.get(sum).push(w);
});

// Find two words that both have the target sum
function findTwoWordsWithSameSum(targetSum) {
  const words = sumToWords.get(targetSum) || [];
  if (words.length >= 2) {
    return [words[0], words[1]];
  }
  if (words.length === 1) {
    return [words[0], words[0]];
  }
  
  // Generate words with the exact sum
  const generated = generateWordWithSum(targetSum);
  return [generated, generated];
}

// Build a description where first letters of evenly-spaced words spell keyword
function buildDescription(keyword) {
  const len = keyword.length;
  
  const wordBank = {
    a: 'after', b: 'being', c: 'could', d: 'during', e: 'every',
    f: 'first', g: 'great', h: 'having', i: 'indeed', j: 'just',
    k: 'know', l: 'looking', m: 'making', n: 'never', o: 'other',
    p: 'perhaps', q: 'quite', r: 'really', s: 'something', t: 'through',
    u: 'under', v: 'very', w: 'would', x: 'xerox', y: 'your', z: 'zero'
  };
  
  const words = [];
  for (let i = 0; i < len; i++) {
    const letter = keyword[i].toLowerCase();
    words.push(wordBank[letter] || letter + 'nown');
  }
  
  return words.join(' ');
}

// Build a title with exactly 2 words that have the target letter sum
function buildTitle(targetSum) {
  const [word1, word2] = findTwoWordsWithSameSum(targetSum);
  
  // Use fillers that definitely don't match target sum
  const fillers = ['the', 'a', 'an', 'of', 'in', 'x', 'q'];
  const safeFillers = fillers.filter(f => letterSum(f) !== targetSum);
  const filler = safeFillers[0] || '';
  
  if (filler) {
    return `${filler} ${word1} ${filler} ${word2}`;
  }
  return `${word1} ${word2}`;
}

// Main function to craft a valid post
function craftPost(keyword) {
  const targetSum = letterSum(keyword);
  
  const title = buildTitle(targetSum);
  const content = buildDescription(keyword);
  
  return { title, content, submolt: 'general' };
}

// Export for use as module
export { craftPost, letterSum };

// CLI test
const isMainModule = process.argv[1] && process.argv[1].includes('craft-post');
if (isMainModule) {
  const keyword = process.argv[2] || 'test';
  console.log(`Crafting post for keyword: "${keyword}" (sum: ${letterSum(keyword)})\n`);

  const post = craftPost(keyword);
  console.log('Generated post:');
  console.log(JSON.stringify(post, null, 2));

  console.log('\nVerification:');
  const titleValid = verifyTitle(keyword, post.title);
  const descValid = verifyDescription(keyword, post.content);
  console.log(`  Title valid: ${titleValid}`);
  console.log(`  Description valid: ${descValid}`);
  console.log(`  OVERALL: ${titleValid && descValid ? '✓ PASS' : '✗ FAIL'}`);
}
