// IMPORTS

// const { logger } = require('./logger');
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

// CONFIG

// Env
const port = 8000 || process.env.PORT;

// OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const MAX_TOKENS = 50;

// ElevenLabs
const voice_id = "LckP2Hd96Vzr02lAF5IN";
const voiceUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
const apiKey = process.env.ELEVEN_API_KEY;

// MIDDLEWARE

app.use(cors());
app.use(express.json());
// app.use(logger());

// ROUTES

app.get("/vibecheck", (req, res) => {
  res.status(200).send({ message: "Vibe checked!" });
});

app.post("/", async (req, res) => {
  const prompt = req.body.prompt;

  // call OpenAI
  const gpt = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: `Respond in less than ${MAX_TOKENS}: ${prompt}`,
      },
    ],
  });
  const gptContent = gpt.data.choices[0].message.content;

  // call ElevenLabs
  const response = await fetch(voiceUrl, {
    method: "POST",
    headers: {
      accept: "audio/mpeg",
      "xi-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: gptContent,
      voice_settings: {
        stability: 0,
        similarity_boost: 0,
      },
    }),
  });

  // buffer audio and serve client
  if (response.ok) {
    const audio = Buffer.from(await response.arrayBuffer());
    res.type("application/json");
    res.status(200).send({ audio: audio, text: gptContent });
  }
});

// INIT

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
