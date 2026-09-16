import axios from 'axios';

async function test() {
  console.log('Testing GET /api/news/top (First Request)');
  let start = Date.now();
  try {
    await axios.get('http://localhost:5000/api/news/top?country=in');
    console.log('First request took:', Date.now() - start, 'ms');
  } catch(e) {
    console.log('First request failed:', e.message);
  }

  console.log('Testing GET /api/news/top (Second Request - Cached)');
  start = Date.now();
  try {
    await axios.get('http://localhost:5000/api/news/top?country=in');
    console.log('Second request took:', Date.now() - start, 'ms');
  } catch(e) {
    console.log('Second request failed:', e.message);
  }
}
test();
