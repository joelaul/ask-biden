# 🗣️️ Ask Biden!

> An All-American chatbot powered by [OpenAI](https://openai.com/) and [ElevenLabs](https://beta.elevenlabs.io/).

## ✨ Kind of works like a real Biden!

| Prompt                                                 | Possible Response                                   |
| ------------------------------------------------------ | --------------------------------------------------- |
| "Do it fart?"                                          | "As an AI language model, I can't fart!"            |
| "By the swimming pool in Scranton, born and raised..." | "Fightin' Corn Pop is how I spent most of my days!" |
| "What happened on January 6, 2021?"                    | "It was a Wednesday!"                               |

## 🤖 Tech Stack

- Frontend: [Web Speech](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- Backend: [Express](https://expressjs.com/), [OpenAI](https://platform.openai.com/docs/api-reference/introduction), [ElevenLabs](https://api.elevenlabs.io/docs)
- Tooling: [Sass](https://sass-lang.com/), [ESLint](https://eslint.org/), [Parcel](https://parceljs.org/)
- Deployed with [Render](https://render.com/)
- Domain provided by [Namecheap](https://www.namecheap.com/)

## 🏗 How It Works

![How It Works](https://github.com/joelaul/ask-biden/assets/118637778/1de6c2db-9238-405f-9b13-4ab7bee4bc82)

---

## 💻 How To Build Locally

### 🗝 Get API keys

- [OpenAI](https://openai.com/): Create an account and sign in. On the top right, click your name, then click "View API Keys".
- [ElevenLabs](https://beta.elevenlabs.io/): Create an account and sign in. On the top right, click your name, then click "Profile".

### Clone the repository to your machine

```
git clone https://github.com/joelaul/ask-biden
```

### Configuration

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

## 🌎 How To Deploy With [Render](https://render.com/)

### Backend

- Configure a [Web Service](https://render.com/docs/web-services) with ./server as root directory, Node as runtime, and the following environment variables:

| Name           | Value                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY | Your OpenAI API key.                                                                                                             |
| ELEVEN_API_KEY | Your ElevenLabs API key.                                                                                                         |
| NODE_VERSION   | any version of Node supporting [fetch](https://nodejs.org/dist/latest-v18.x/docs/api/all.html#all_globals_fetch) (v18.0 and up). |

### **Frontend**

Configure a [Static Site](https://render.com/docs/static-sites) with ./client as root directory.

---

## ‍☕ Donate

I’m not a full-time goth e-girl yet, but [your support](https://paypal.me/joelaul) can get me there faster.
