import axios from 'axios';
(async () => {
  console.log('Profiling APIs...');
  const start1 = Date.now();
  try {
    await axios.get('https://newsapi.org/v2/top-headlines?country=in', {
      headers: { 'X-Api-Key': '568e0658c5965af1c578e091ba6cbfba', 'User-Agent': 'Nexz-App/1.0' },
      timeout: 15000
    });
  } catch(e) {
    console.log('NewsAPI failed in', Date.now() - start1, 'ms with status:', e.response?.status || e.message);
  }
  const start2 = Date.now();
  try {
    await axios.get('https://saurav.tech/NewsAPI/top-headlines/category/general/in.json');
    console.log('saurav.tech succeeded in', Date.now() - start2, 'ms');
  } catch(e) {
    console.log('saurav.tech failed in', Date.now() - start2, 'ms');
  }
})();
