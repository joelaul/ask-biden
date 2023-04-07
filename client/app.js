/* TODO

FX - LOAD STATIC, CONFETTI, FALLING STARS

SEND FULL CONVERSATION TO API

*/

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
let chatContainer;

// STATE

const usedPrompts = {};
const userBubbleIDs = [], joeBubbleDivs = [];

let audio, analyser, dataArray, formText;
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
const sendSoundUrl = require('url:./assets/send.mp3');
const sendSound = new Audio(sendSoundUrl);

// FUNCTIONS

const makeUniqueID = () => {
    const timeStamp = Date.now();
    const randomNumber = Math.random();
    const hex = randomNumber.toString(16);

    return `id-${timeStamp}-${hex}`;
}

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
};

const draw = () => {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray); 

    const delta = (WIDTH * 1.0) / analyser.fftSize;
    let x = 0;
    canvasCtx.beginPath();

    for (let i = 0; i < analyser.fftSize; i++) {
        let v = dataArray[i] / 128.0; // -128 < dataArray[i] < 128; -1 < v < 1
        let y = (v * HEIGHT) / 2; // -HEIGHT/2 < y < HEIGHT/2

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += delta;
    }

    canvasCtx.lineTo(WIDTH, HEIGHT / 2);
    canvasCtx.stroke();
};

const armJoeBubbles = () => {
    for (let i = 0; i < joeBubbleDivs.length; i++) {
        joeBubbleDivs[i].addEventListener('click', () => {
            handleJoeBubble(userBubbleIDs[i]);
        })
    }
}

const handleJoeBubble = (id) => {    
    const itsPrompt = document.getElementById(id).innerText;
    const itsAudio = usedPrompts[itsPrompt][0];
    audio.src = itsAudio;

    middleSlide.classList.add('slide-out');
    dataArray = new Uint8Array(analyser.fftSize); 

    audio.play();
    canvas.classList.remove('hide');
    draw();
}

const handleVoice = () => {
    if (!listening && !sending && audio.ended) {

        stt.start();
        listening = true;
        middleSlide.classList.add('slide-out');
        setTimeout(() => {
            listen.classList.remove('hide');
        }, 100);

        // stop listening if 3 seconds pass without audio
        if (listenTimer) {
            return;
        } else {
            listenTimer = setTimeout(() => {
                middleSlide.classList.remove('slide-out');
                stt.stop();
                setTimeout(() => {
                    listen.classList.add('hide')
                }, 100);
                listening = false; // reusable function?
                listenTimer = null;
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

        // offset middleContainer on first chatContainer injection
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.classList.add('chat-container');
            contentWrapper.append(chatContainer);
        }
        
        // check - was text sent during listening? if so, stop listening + clear listenTimer
        if (listening) {
            stt.stop();
            listen.classList.add('hide')
            clearTimeout(listenTimer);
            listening = false;
        }

        // check - has audio been initialized?
        if (audio) {
            if (!audio.ended) {
                audio.pause();
                canvas.classList.add('hide');
            }
        } else {
            initAudio();
        }

        // check - has it been asked? (Y = use cache, N = throttle/fetch)
        if (usedPrompts[prompt]) {
            audio.src = usedPrompts[prompt][0];
        } else {
            // throttle requests for 5 seconds
            if (throttleTimer) {
                return;
            } else {
                // show loader, render user chat bubble
                sendSound.play();

                setTimeout(() => {
                    loader.classList.remove('hide')
                }, 100);
                throttleTimer = setTimeout(() => {
                clearTimeout(throttleTimer);
                throttleTimer = null;
                }, 5000); 

                let userBubbleDiv = document.createElement('div');
                userBubbleDiv.classList.add('chat-bubble', 'user');
                userBubbleDiv.innerText = prompt;

                userBubbleDiv.id = makeUniqueID();
                userBubbleIDs.push(userBubbleDiv.id);

                chatContainer.append(userBubbleDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;

                // get biden response
                const response = await fetch('http://localhost:8000', 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: prompt })
                });

                // render biden response
                if (response.ok) {
                    const data = await response.json();
                    const text = data.text;
                    const audioBuffer = new Uint8Array(data.audio.data);
                    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                    const url = URL.createObjectURL(blob);
                    audio.src = url;

                    let joeBubbleDiv = document.createElement('div');
                    joeBubbleDiv.classList.add('chat-bubble', 'joe');
                    joeBubbleDiv.innerText = text;

                    joeBubbleDivs.push(joeBubbleDiv);
                    chatContainer.append(joeBubbleDiv);

                    // hide loader, refresh chat log
                    loader.classList.add('hide');
                    chatContainer.scrollTop = chatContainer.scrollHeight;

                    // cache response for re-use
                    usedPrompts[prompt] = [url, text];
                }
            }
        }

        setTimeout(() => {
            canvas.classList.remove('hide')
        }, 100);
        dataArray = new Uint8Array(analyser.fftSize); 
        
        audio.play();
        draw();

        armJoeBubbles();
        sending = false;
    }   
}

// INIT

const init = () => {
    for (let suggestion of suggestions) {
        suggestion.addEventListener('click', () => {
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

    textArea.focus();
}

init();