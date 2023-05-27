# 🗣️️ Ask Biden!

> An All-American chatbot powered by [OpenAI](https://openai.com/) and [ElevenLabs](https://beta.elevenlabs.io/).

## ✨ Equivocates like a real Biden!

| Prompt | Possible Response |
|--------|-------------------|
| "Do it fart?" | "As an AI language model, I can't fart!" |
| "Are men disposable?" | "As an AI language model, I can't drop red pills!" |
| "What happened on January 6, 2021?" | "It was a Wednesday!" |

## 🤖 Tech Stack

- Frontend: [Web Speech](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- Backend: [Express](https://expressjs.com/), [OpenAI](https://platform.openai.com/docs/api-reference/introduction), [ElevenLabs](https://api.elevenlabs.io/docs)
- Tooling: [Sass](https://sass-lang.com/), [ESLint](https://eslint.org/), [Parcel](https://parceljs.org/)
- Deployed with [Render](https://render.com/)
- Domain provided by [Namecheap](https://www.namecheap.com/)

## 🏗 How It Works

![How It Works](https://upcdn.io/W142hJk/raw/demo/4mRKjTpj5a.png)

---

## 💻 How To Run Locally

### 🗝 Get API keys

- [OpenAI](https://openai.com/): Create an account and sign in. On the top right, click your name, then click "View API Keys".
- [ElevenLabs](https://beta.elevenlabs.io/): Create an account and sign in. On the top right, click your name, then click "Profile".

### Clone the repository to your machine
```
git clone https://github.com/joelaul/ask-biden
```

### Setup

- In [app.js](https://github.com/joelaul/ask-biden/blob/main/client/app.js), set handleAsk function's fetch URL to http://localhost:8000/.
- Add an .env file containing your API keys to ./server ([like this](https://github.com/joelaul/ask-biden/blob/main/server/.example.env)).


### Frontend

```
cd ask-biden/client
yarn install
yarn dev
```

### Backend 

```
cd ask-biden/server
yarn install
yarn dev
```

---

## ‍☕ Donate

I’m not a full-time goth e-girl yet, but [your support](https://paypal.me/joelaul) can get me there faster.