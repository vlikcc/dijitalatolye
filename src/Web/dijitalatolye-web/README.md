# DijitalAtölye Web

React 19 + Vite + TypeScript + Tailwind + TanStack Query + Zustand iskelet.
Vertical slice akışı:

- `/login`, `/register` → Identity API
- `/teacher/contents/new` → ZIP yükle (Storage presigned + Content submit)
- `/editor/queue` → kuyruğu izle
- `/editor/review/:id` → AI raporu + sandboxed iframe önizleme + karar
- `/play/:slug` → public oynatma (sandboxed iframe)

Tüm istekler `/api/*` üzerinden YARP API Gateway'e proxylenir.

## Komutlar

```bash
npm install
npm run dev   # http://localhost:5173
npm run build
```
