import axios from 'axios';

async function testAI() {
  console.log('Testing GET /api/llm/chat...');
  try {
    const res = await axios.post('http://localhost:5000/api/llm/chat', {
      articleText: 'SpaceX successfully launched Starship today.',
      question: 'What did SpaceX launch?'
    });
    console.log('Chat response:', res.data.answer);
  } catch(e) {
    console.log('Chat failed:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\nTesting GET /api/llm/explain...');
  try {
    const res = await axios.post('http://localhost:5000/api/llm/explain', {
      articleText: 'SpaceX successfully launched Starship today.',
      level: 'eli5'
    });
    console.log('Explain response:', res.data.summary);
  } catch(e) {
    console.log('Explain failed:', e.response?.status, e.response?.data || e.message);
  }
}
testAI();
