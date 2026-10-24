import axios from 'axios';

async function test() {
  const base = 'http://localhost:3000/api';
  console.log('--- Testing Live News Endpoints on Port 3000 ---');

  try {
    const res1 = await axios.get(`${base}/news/top?country=in&pageSize=6`);
    console.log('✓ /news/top?country=in: status =', res1.status, 'articles count =', res1.data.articles?.length);
    console.log('  Sample title:', res1.data.articles?.[0]?.title);
    console.log('  Source:', res1.data.articles?.[0]?.source?.name);
    console.log('  Hash:', res1.data.articles?.[0]?.hash);

    const firstHash = res1.data.articles?.[0]?.hash;

    const res2 = await axios.get(`${base}/news/top?category=technology&pageSize=4`);
    console.log('✓ /news/top?category=technology: articles count =', res2.data.articles?.length);
    console.log('  Tech title:', res2.data.articles?.[0]?.title);

    const res3 = await axios.get(`${base}/news/search?q=space&pageSize=4`);
    console.log('✓ /news/search?q=space: articles count =', res3.data.articles?.length);
    console.log('  Space title:', res3.data.articles?.[0]?.title);

    if (firstHash) {
      const res4 = await axios.get(`${base}/news/resolve/${firstHash}`);
      console.log('✓ /news/resolve/:hash: status =', res4.status, 'title matches:', res4.data.article?.title === res1.data.articles?.[0]?.title);
    }

    console.log('\nALL ENDPOINTS SUCCEEDED WITH REAL DATA!');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

test();
