// ===== Настройки =====
// Укажи URL своего Cloudflare Worker, когда развернёшь его (см. файл cloudflare-worker.js и README)
const ADVICE_ENDPOINT = localStorage.getItem('new1.karpgopader.workers.dev') || ''; // можно задать через консоль или код

// ===== Генерация примеров по классам =====
function makeQuestion(grade){
  switch (grade) {
    case '1': return qAddSub(1,10,true);
    case '2': return qAddSub(1,100,false);
    case '3': return randomChoice([qAddSub(1,100,false), qMul(1,10)]);
    case '4': return randomChoice([qAddSub(1,100,false), qMul(1,12), qDiv(1,12,true)]);
    case '5': return randomChoice([qAddSub(1,100,false), qMul(2,12), qDiv(2,12,false)]);
    default: return qAddSub(1,10,true);
  }
}

function qAddSub(min,max,noNegative){
  const a = rand(min, max), b = rand(min, max);
  const op = Math.random() < 0.5 ? '+' : '-';
  let ans = op === '+' ? a+b : a-b;
  if (noNegative && op==='-' && a-b<0) return qAddSub(min,max,noNegative);
  return { text: `${a} ${op} ${b}`, ans };
}
function qMul(min,max){
  const a = rand(min,max), b = rand(min,max);
  return { text: `${a} × ${b}`, ans: a*b };
}
function qDiv(min,max,forceTable){
  const a = rand(min,max), b = rand(min,max);
  const dividend = a*b;
  return { text: `${dividend} ÷ ${a}`, ans: b };
}

function randomChoice(itemOrArray){
  // если передали массив — выбрать случайный элемент
  if (Array.isArray(itemOrArray)) return itemOrArray[rand(0,itemOrArray.length-1)];
  // если функция вернула объект, просто вернуть его
  return itemOrArray;
}

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

// ===== Селекторы =====
const startBtn = document.getElementById('startBtn');
const gradeSel = document.getElementById('grade');
const quiz = document.getElementById('quiz');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answer');
const checkBtn = document.getElementById('checkBtn');
const skipBtn = document.getElementById('skipBtn');
const progressText = document.getElementById('progressText');
const feedback = document.getElementById('feedback');
const result = document.getElementById('result');
const scoreLine = document.getElementById('scoreLine');
const advice = document.getElementById('advice');
const restartBtn = document.getElementById('restartBtn');

let questions = [];
let userAnswers = [];
let idx = 0;
let correct = 0;

startBtn.addEventListener('click', () => {
  const grade = gradeSel.value;
  questions = Array.from({length:10}, () => makeQuestion(grade));
  userAnswers = Array(10).fill(null);
  idx = 0; correct = 0;
  document.querySelector('.intro').classList.add('hidden');
  result.classList.add('hidden');
  quiz.classList.remove('hidden');
  feedback.textContent = '';
  showQuestion();
});

checkBtn.addEventListener('click', () => submitAnswer());
answerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAnswer(); });
skipBtn.addEventListener('click', next);
restartBtn.addEventListener('click', () => {
  result.classList.add('hidden');
  document.querySelector('.intro').classList.remove('hidden');
});

function submitAnswer(){
  const val = Number(answerInput.value);
  if (Number.isNaN(val)) return;
  userAnswers[idx] = val;
  const ok = val === questions[idx].ans;
  feedback.textContent = ok ? 'Верно!' : `Неверно. Правильный ответ: ${questions[idx].ans}`;
  feedback.className = ok ? 'ok' : 'bad';
  if (ok) correct++;
  setTimeout(next, 600);
}

function showQuestion(){
  const q = questions[idx];
  questionText.textContent = q.text + ' = ?';
  progressText.textContent = `${idx+1} / ${questions.length}`;
  answerInput.value = '';
  answerInput.focus();
}

function next(){
  idx++;
  feedback.textContent = '';
  feedback.className = '';
  if (idx < questions.length) showQuestion();
  else finish();
}

async function finish(){
  quiz.classList.add('hidden');
  result.classList.remove('hidden');
  scoreLine.textContent = `Правильно: ${correct} из ${questions.length}`;

  // Сформируем краткую сводку для AI
  const grade = gradeSel.value;
  const summary = questions.map((q,i)=>({question:q.text, user:userAnswers[i], correct:q.ans}));
  advice.textContent = 'Формируем совет на основе результатов…';

  try {
    let text = '';
    if (ADVICE_ENDPOINT) {
      const resp = await fetch(ADVICE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ grade, summary })
      });
      const data = await resp.json();
      text = data.advice || '';
    }
    advice.textContent = text || fallbackAdvice(grade, correct, questions.length);
    advice.classList.remove('muted');
  } catch (e) {
    advice.textContent = fallbackAdvice(grade, correct, questions.length);
    advice.classList.remove('muted');
  }
}

function fallbackAdvice(grade, ok, total){
  const r = ok/total;
  if (r >= 0.9) return 'Отличный результат! Можно усложнять: примеры в 2 шага и задачи со словами.';
  if (r >= 0.6) return 'Хорошо! Рекомендуем потренировать таблицу умножения/деление и устный счёт.';
  return 'Нужно подтянуть базовые операции: сложение и вычитание в пределах выбранного класса.';
}

/* PWA установка */
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});
