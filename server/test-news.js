import axios from 'axios';
import 'dotenv/config';

const apiKey = process.env.NEWS_API_KEY;

async function test() {
  console.log('Testing with apiKey param...');
  try {
    const r1 = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: { country: 'us', apiKey }
    });
    console.log('Param SUCCESS', r1.status);
    return;
  } catch (e) { console.log('Param ERROR', e.response?.status, e.response?.data); }

  console.log('Testing with X-Api-Key...');
  try {
    const r2 = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: { country: 'us' },
      headers: { 'X-Api-Key': apiKey, 'User-Agent': 'Nexz-App/1.0' }
    });
    console.log('X-Api-Key SUCCESS', r2.status);
    return;
  } catch (e) { console.log('X-Api-Key ERROR', e.response?.status, e.response?.data); }

  console.log('Testing with Authorization Bearer...');
  try {
    const r3 = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: { country: 'us' },
      headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': 'Nexz-App/1.0' }
    });
    console.log('Authorization SUCCESS', r3.status);
    return;
  } catch (e) { console.log('Authorization ERROR', e.response?.status, e.response?.data); }

  console.log('Testing with gnews API (as fallback test)...');
  try {
    const r5 = await axios.get('https://saurav.tech/NewsAPI/top-headlines/category/general/us.json');
    console.log('saurav.tech SUCCESS', r5.status);
  } catch (e) { console.log('saurav.tech ERROR', e.response?.status); }
}

test();
