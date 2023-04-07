// IMPORTS

const confetti = require('./node_modules/canvas-confetti/src/confetti');
const sounds = require('./sounds');

// DOM

const form = document.querySelector('form');
const textArea = document.querySelector('textarea');
const voice = document.querySelectorAll('form button')[0];
const submit = document.querySelectorAll('form button')[1];
const loader = document.querySelector('.loader');
const listen = document.querySelector('.listen');
const suggestions = document.querySelectorAll('.suggestion-buttons button');
const contentWrapper = document.querySelector('.content-wrapper');
const middleSlide = document.querySelector('.middle-slide');
const biden = document.querySelector('.middle-top img');
let chatContainer;

// STATE

const usedPrompts = {};
const userBubbleIDs = [], joeBubbleDivs = [];

let formText, audio, analyser, dataArray;
let throttleTimer, listenTimer;
let listening, sending = false;

const canvas = document.querySelector(".waveform");
const canvasCtx = canvas.getContext("2d");
const HEIGHT = 66, WIDTH = 295;
canvas.width = WIDTH, canvas.height = HEIGHT;
canvasCtx.fillStyle = "rgb(255, 255, 255)";
canvasCtx.strokeStyle = "rgb(0, 0, 0)";
canvasCtx.lineWidth = 2;
const stt = new webkitSpeechRecognition;

// FUNCTIONS

const initAudio = () => {
    audio = new Audio();
    audio.addEventListener('ended', () => {
        middleSlide.classList.remove('slide-out');
        canvas.classList.add('hide');
        listening = false;
    });

    const audioCtx = new AudioContext();
    const audioNode = audioCtx.createMediaElementSource(audio);
    analyser = new AnalyserNode(audioCtx);
    analyser.fftSize = 2048;

    audioNode.connect(analyser);
    analyser.connect(audioCtx.destination);
}

const startListening = () => {
    sounds.listenStartSound.play();

    stt.start();
    listening = true;
    middleSlide.classList.add('slide-out');
    setTimeout(() => {
        listen.classList.remove('hide');
    }, 100);
}

const stopListening = () => {
    sounds.listenStopSound.play();

    stt.stop();
    listen.classList.add('hide')
    clearTimeout(listenTimer);
    listening = false;
}

const makeUniqueID = () => {
    const timeStamp = Date.now();
    const randomNumber = Math.random();
    const hex = randomNumber.toString(16);

    return `id-${timeStamp}-${hex}`;
}

const draw = () => {
    requestAnimationFrame(draw);
    dataArray = new Uint8Array(analyser.fftSize); 
    analyser.getByteTimeDomainData(dataArray); 

    const delta = (WIDTH * 1.0) / analyser.fftSize;
    let x = 0;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.beginPath();

    for (let i = 0; i < analyser.fftSize; i++) {
        let v = dataArray[i] / 128.0;
        let y = (v * HEIGHT) / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += delta;
    }

    canvasCtx.lineTo(WIDTH, HEIGHT / 2);
    canvasCtx.stroke();
}

const renderUserBubble = (prompt) => {
    const userBubbleDiv = document.createElement('div');
    userBubbleDiv.classList.add('chat-bubble', 'user');
    userBubbleDiv.innerText = prompt;

    userBubbleDiv.id = makeUniqueID();
    userBubbleIDs.push(userBubbleDiv.id);

    chatContainer.append(userBubbleDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

const renderJoeResponse = async (response, prompt) => {
    const data = await response.json();
    const text = data.text;
    const audioBuffer = new Uint8Array(data.audio.data);
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    audio.src = url;

    const joeBubbleDiv = document.createElement('div');
    joeBubbleDiv.classList.add('chat-bubble', 'joe');
    joeBubbleDiv.innerText = text;

    joeBubbleDivs.push(joeBubbleDiv);
    chatContainer.append(joeBubbleDiv);

    loader.classList.add('hide');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // cache response for re-use
    usedPrompts[prompt] = [url, text];
}

const playJoeResponse = () => {
    setTimeout(() => {
        canvas.classList.remove('hide')
    }, 100);
    audio.play();
    draw();
}

const repopulateJoeBubbles = () => {
    for (let i = 0; i < joeBubbleDivs.length; i++) {
        joeBubbleDivs[i].addEventListener('click', () => {
            handleJoeBubble(userBubbleIDs[i]);
        })
    }
}

// HANDLERS

const handleJoeBubble = (id) => {
    const itsPrompt = document.getElementById(id).innerText;
    const itsAudio = usedPrompts[itsPrompt][0];
    audio.src = itsAudio;

    middleSlide.classList.add('slide-out');
    dataArray = new Uint8Array(analyser.fftSize); 

    playJoeResponse();
}

const handleVoice = () => {
    if (!listening && !sending && (!audio || audio.ended)) {
        startListening();

        // stop listening if 3 seconds pass without audio
        if (listenTimer) {
            return;
        } else {
            listenTimer = setTimeout(() => {
                middleSlide.classList.remove('slide-out');
                stopListening();
            }, 3000);
        }

        stt.addEventListener('speechend', stt.stop);
        stt.addEventListener('result', (e) => {
            let transcript = e.results[0][0].transcript;
            textArea.value = transcript;
            listen.classList.add('hide');
            handleAsk(transcript);
        });
    }
}

const handleAsk = async (prompt) => {
    if (textArea.value.length > 0) {
        sending = true;
        middleSlide.classList.add('slide-out');
        textArea.value = '';

        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.classList.add('chat-container');
            contentWrapper.append(chatContainer);
        }
        
        if (listening) {
            stopListening();
        }

        if (audio) {
            if (!audio.ended) {
                audio.pause();
                canvas.classList.add('hide');
            }
        } else {
            initAudio();
        }

        // has it been asked? (Y = use cache, N = throttle/fetch)
        if (usedPrompts[prompt]) {
            audio.src = usedPrompts[prompt][0];
        } else {
            // throttle requests for 5 seconds 
            if (throttleTimer) {
                return;
            } else {
                throttleTimer = setTimeout(() => {
                    clearTimeout(throttleTimer);
                    throttleTimer = null;
                    }, 5000);

                renderUserBubble(prompt);
                sounds.sentSound.play();

                // show loader
                setTimeout(() => {
                    loader.classList.remove('hide')
                }, 100);
                
                // get joe response
                const response = await fetch('http://localhost:8000', 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: prompt })
                });
                if (response.ok) await renderJoeResponse(response, prompt);
            }
        }

        playJoeResponse();
        repopulateJoeBubbles();
        sending = false;
    }
}

// INIT

const init = () => {
    for (let suggestion of suggestions) {
        suggestion.addEventListener('click', () => {
            sounds.suggestionSound.play();
            textArea.value = suggestion.innerText;
        });
    }

    submit.addEventListener('click', (e) => {
        e.preventDefault();
        formText = new FormData(form).get('prompt');
        handleAsk(formText);
    });

    document.body.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            formText = new FormData(form).get('prompt');
            handleAsk(formText);
        }
    });

    voice.addEventListener('click', (e) => {
        e.preventDefault();
        handleVoice();
    });

    biden.addEventListener('click', () => {
        confetti({ 
            particleCount: 25,
        });
        sounds.confettiSound.play();
    });

    textArea.focus();
}

init();