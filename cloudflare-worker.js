export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({error:'POST only'}), {status:405, headers:{'content-type':'application/json'}});
    }
    try {
      const { grade, summary } = await request.json();
      const prompt = [
        { role: 'system', content: 'Ты — методист начальной школы в Беларуси. По результатам короткого теста даёшь короткий (2–4 предложения) совет по темам, которые нужно подтянуть. Пиши по-русски, дружелюбно, без терминов.' },
        { role: 'user', content: `Класс: ${grade}. Результаты теста (в формате: "пример | ответ ученика | правильный ответ"):
` +
          summary.map(s => `${s.question} | ${s.user} | ${s.correct}`).join('
') +
          '
Сформируй короткий совет, какие темы повторить и что потренировать на неделю.' }
      ];

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: prompt,
          temperature: 0.5,
          max_tokens: 200
        })
      });

      const data = await resp.json();
      const advice = data?.choices?.[0]?.message?.content?.trim() || '';
      return new Response(JSON.stringify({ advice }), { headers: {'content-type':'application/json'} });
    } catch (e) {
      return new Response(JSON.stringify({ advice: '' }), { headers: {'content-type':'application/json'} });
    }
  }
};
