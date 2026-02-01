// End-to-end test of the verification flow
import { craftPost } from './craft-post.js';

const keyword = process.argv[2] || 'test';
const post = craftPost(keyword);
console.log(JSON.stringify(post));
