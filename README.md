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

![Project Architecture](https://upcdn.io/W142hJk/raw/demo/4mRKjTpj5a.png)

## 💻 How To Run

### Clone the repository
```
git clone https://github.com/joelaul/ask-biden
```

### Install the dependencies
```
cd ask-biden
yarn install
```

### 🗝 Store API keys in .env file

- OpenAI: Create an account and sign in. On the top right, click your name, then click "View API Keys".
- ElevenLabs: Create an account and sign in. On the top right, click your name, then click "Profile".

### Deploy with [Render](https://render.com/)

1. Client: configure a [Static Site](https://render.com/docs/static-sites) with ./client as root directory.

1. Server: configure a [Web Service](https://render.com/docs/web-services) with ./server as root directory, Node as runtime, and the following environment variables:

    - OPENAI_API_KEY - your OpenAI API key.

    - ELEVEN_API_KEY - your ElevenLabs API key.

    - NODE_VERSION (xx.x.x) - any version of Node supporting [fetch](https://nodejs.org/dist/latest-v18.x/docs/api/all.html#all_globals_fetch).
    
1. Set client fetch URL parameter accordingly.

## ‍☕ Donate

I’m not a full-time goth e-girl yet, but [your support](https://paypal.me/joelaul) can get me there faster.