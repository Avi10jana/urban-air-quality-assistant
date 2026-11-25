# 🌍 AirGuide — Urban Air Quality Assistant

> A GenAI-powered assistant helping families and communities navigate severe winter smog and urban air pollution.

[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org)

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live AQI Dashboard** | Real-time air quality with WHO standard breakdown (PM2.5, PM10, NO₂, O₃) |
| 🤖 **Gemini AI Chat** | Streaming multi-turn conversation with location & AQI context |
| 📅 **Low-Emission Routines** | Personalized morning/afternoon/evening plans based on AQI & lifestyle |
| 🌱 **Impact Calculator** | CO₂ savings, health improvements, and cost savings for lifestyle changes |
| 🏠 **Indoor Hacks** | Plants, ventilation, purifiers, and cooking tips tailored to your home |
| 👨‍👩‍👧‍👦 **Family Profiles** | Customized alerts for children, elderly, and vulnerable members |

## 🏗️ Architecture

```
├── backend/          # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server.ts           # Express app with Helmet, CORS, rate limiting
│   │   ├── routes/
│   │   │   ├── chat.ts         # SSE streaming chat endpoint
│   │   │   ├── aqi.ts          # AQI fetch with OpenAQ + mock fallback
│   │   │   └── routines.ts     # Routines, impact, indoor hacks
│   │   ├── services/
│   │   │   ├── geminiService.ts # Gemini API (Interactions API, streaming)
│   │   │   └── aqiService.ts   # AQI calculation (US EPA breakpoints)
│   │   └── middleware/
│   │       ├── rateLimiter.ts  # Per-route rate limiting
│   │       └── validate.ts     # Zod schema validation
│   └── tests/
│       ├── aqi.test.ts         # AQI calculation & mock data tests
│       └── validation.test.ts  # Zod schema validation tests
└── frontend/         # React + TypeScript + Vite
    ├── src/
    │   ├── App.tsx             # Root with profile-gated routing
    │   ├── components/
    │   │   ├── Dashboard/      # AQI gauge, pollutant bars, quick actions
    │   │   ├── Chat/           # Streaming SSE chat with markdown rendering
    │   │   ├── Routines/       # AI-generated daily schedule cards
    │   │   ├── Impact/         # Lifestyle change impact calculator
    │   │   ├── Indoor/         # Indoor air quality hacks
    │   │   └── Profile/        # Onboarding profile setup form
    │   ├── hooks/
    │   │   ├── useChat.ts      # Chat state with streaming & multi-turn
    │   │   └── useAQI.ts       # AQI data with geolocation support
    │   └── services/
    │       └── api.ts          # Typed fetch wrappers for all endpoints
    └── src/tests/              # Vitest + Testing Library tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
```

```env
GEMINI_API_KEY=your_key_here
PORT=3001
NODE_ENV=development
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🧪 Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# With coverage
npm run test:coverage
```

## 🤖 Gemini API Usage

This app uses the **Interactions API** (current SDK `@google/genai >= 3.2.0`):

- **Multi-turn chat**: `previous_interaction_id` for stateful conversations
- **Streaming**: SSE events for real-time response rendering
- **Structured output**: `response_mime_type: "application/json"` for routines & impact
- **System prompts**: AQI-aware, location-specific, family-sensitive instructions
- **Model**: `gemini-4-hydrogen` (1M token context, multimodal)

## 🛡️ Security

- Helmet.js security headers
- Zod input validation on all endpoints
- Rate limiting (global + per-route)
- API key never logged or exposed to frontend
- CORS restricted to known origins

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML (`role="main"`, `role="tabpanel"`, `role="alert"`, etc.)
- `aria-label`, `aria-live`, `aria-pressed`, `aria-selected` throughout
- Focus-visible keyboard navigation
- Reduced motion support via `prefers-reduced-motion`
- Screen reader-friendly loading states

## 📊 AQI Scale (US EPA)

| AQI | Level | Action |
|---|---|---|
| 0–50 | 🟢 Good | No precautions |
| 51–100 | 🟡 Moderate | Sensitive groups cautious |
| 101–150 | 🟠 Unhealthy for Sensitive Groups | Limit outdoor exertion |
| 151–200 | 🔴 Unhealthy | Wear N95, limit outdoor time |
| 201–300 | 🟣 Very Unhealthy | Health alert, avoid outdoors |
| 301+ | ⚫ Hazardous | Emergency, stay indoors |

## 🌐 AQI Data Sources

- Primary: [OpenAQ v3 API](https://docs.openaq.org/) (requires free API key)
- Fallback: Built-in mock data for 15+ major cities (Delhi, Mumbai, Beijing, LA, London, Tokyo, etc.)
