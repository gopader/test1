# Весёлый счёт (PWA) — 1–5 класс + совет от ChatGPT

Это версия с выбором класса (1–5), 10 задачами и интеграцией совета через ChatGPT (через Cloudflare Worker).

## Как запустить локально
1. Подними локальный сервер (например, VS Code + Live Server) в корне папки.
2. Открой на iPhone в Safari адрес сервера.
3. Поделиться → Добавить на экран «Домой».

## Как включить совет ChatGPT
Чтобы не хранить API-ключ в браузере, используется Cloudflare Worker-прокси.

### Шаги
1. Создай новый **Cloudflare Worker**.
2. Вставь в него код из `cloudflare-worker.js`.
3. В настройках Worker добавь переменную окружения `OPENAI_API_KEY` со своим ключом.
4. Разверни Worker — получишь URL вида `https://your-worker.example.workers.dev`.
5. В `script.js` можно задать URL:
   ```js
   localStorage.setItem('advice_url', 'https://your-worker.example.workers.dev');
   ```
   или прямо заменить константу `ADVICE_ENDPOINT` в начале `script.js`.

## Примечания
- Если `ADVICE_ENDPOINT` не задан, приложение покажет **локальный совет** (fallback).
- Список из 10 задач генерируется каждый раз заново в зависимости от выбранного класса.
