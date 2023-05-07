// IMPORTS

require('dotenv').config();
const { logger } = require('./logger');
const express = require('express');
const app = express();
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");

const port = 8000 || process.env.PORT;

// CREDS - OPENAI

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);
const MAX_TOKENS = 50;

// CREDS - ELEVENLABS

const voice_id = 'LckP2Hd96Vzr02lAF5IN'; // BIDEN
// const voice_id = 'iWvT3d6Mr8Zret8L4BO7' // TOSIN
const voiceUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
const apiKey = process.env.ELEVEN_API_KEY;

// MIDDLEWARE

app.use(logger);
app.use(cors());
app.use(express.json());

// ROUTES

app.get('/', (req, res) => {
    res.status(200).send({ message: "Ask Biden!" });  
}); 

app.post('/', async (req, res) => {    
    const prompt = req.body.prompt;

    console.clear();
    console.log(prompt);

    // CALL OPENAI
    const gpt = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    max_tokens: MAX_TOKENS,
    messages: [
        { "role": "user", "content": `Respond in less than ${MAX_TOKENS}: ${prompt}` }
    ],
    });
    const gptContent = gpt.data.choices[0].message.content;
    console.log(gptContent);

    // CALL ELEVENLABS
    const response = await fetch(voiceUrl, 
    {
        method: 'POST',
        headers: 
        {
            'accept': 'audio/mpeg',
            'xi-api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(
        {
            text: gptContent,
            voice_settings: {
                stability: 0,
                similarity_boost: 0
            }
        })
    });

    // BUFFER AUDIO AND SERVE CLIENT
    if (response.ok) {
        const blob = await response.blob();
        const buf = await blob.arrayBuffer();
        const audio = Buffer.from(buf);
        res.type('application/json');
        
        res.status(200).send(
            { 'audio': audio, 'text': gptContent });
    }
});

// INIT

app.listen(port, () => {
    // console.clear();
    console.log(`Server running on port ${port}`);
});