/* DEV:
// IMESSAGE LOG ON RIGHT (TRANS FADE)
// MAKE SUGGESTION WHEEL, ADD SUGGESTIONS (TRANS FADE)
// SEND REQUESTS WITH CONTEXT

// MOVE THROTTLE TO BACKEND?
// BG FALLING STARS/CONFETTI; JOE STATIC/SPIN
// "DOUBLE IT AND GIVE IT TO THE NEXT PERSON"
// REFACTOR - LESS STATE, MORE FUNCTIONS?
*/

/* PROD:
// REMOVE FUNNY BUSINESS (HAVE A PERSONAL FORK)
// PRETTIER
// JEST UNIT TESTING, ERROR HANDLING
// DEPLOY TO GLITCH
// README: DEPLOYMENT GUIDE FOR DEVS, ARCHITECTURE FLOWCHART
// VIDEO, BLOG
// ELI5 TO RECRUITERS
*/
/* TOOLS AND TECH:
// WEB SPEECH
// WEB AUDIO
// CANVAS
// OPENAI
// ELEVENLABS
// EXPRESS, DOTENV
// SASS
// PARCEL
// TERMINAL
*/
/* LESSONS LEARNED:
// FORMS (BUTTONS ARE TYPE="SUBMIT" BY DEFAULT)
// IIFES HAVE PRIVATE SCOPE
// RESOURCE CONTROL: THROTTLING, CACHING, TOKEN LIMIT
// LOGGING, MIDDLEWARE, MODULES
// ENVIRONMENT VARIABLES, DIRECTORY STRUCTURE
// BLOBS, OBJECT URLS, BUFFERS (BINARY)
*/
/* DOWN THE ROAD:
// LESS HAPHAZARD ELEMENT POSITIONING?
// TRY FIXED INSTEAD OF ABSOLUTE
*/

// DOM

const form = document.querySelector('form');
const textArea = document.querySelector('textarea');
const voice = document.querySelectorAll('form button')[0];
const submit = document.querySelectorAll('form button')[1];
const loader = document.querySelector('.loader');
const listen = document.querySelector('.listen');
const suggestions = document.querySelectorAll('.suggestion-buttons button');
const middleSlide = document.querySelector('.middle-slide');
const peekaboo = document.querySelector('.peekaboo');

// STATE

const usedPrompts = {};
let audio, analyser, userStream, formText;
let throttleTimer, listenTimer;
let listening = false;

const canvas = document.querySelector(".waveform");
const canvasCtx = canvas.getContext("2d");
const HEIGHT = 66, WIDTH = 295;
canvas.width = WIDTH, canvas.height = HEIGHT;
canvasCtx.fillStyle = "rgb(255, 255, 255)";
canvasCtx.strokeStyle = "rgb(0, 0, 0)";
canvasCtx.lineWidth = 2;

const stt = new webkitSpeechRecognition;

// FUNCTIONS

const handleVoice = () => {
    if (!listening) {

        middleSlide.classList.add('slide-out');
        setTimeout(() => {
            listen.classList.remove('hide');
        }, 100);
        stt.addEventListener('start', () => {
            listening = true;
        });
        stt.start();

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
        middleSlide.classList.add('slide-out');
        
        // check - was text sent during listening? if so, stop listening + clear listenTimer
        if (listening) {
            stt.stop();
            listen.classList.add('hide')
            clearTimeout(listenTimer);
            listening = false;
        }

        // check - has audio been initialized?
        if (audio) {
            if (!audio.ended) audio.pause();
        } else {
            (initAudio = () => {
                audio = new Audio();
                audio.addEventListener('ended', () => {
                    middleSlide.classList.remove('slide-out');
                    canvas.classList.add('hide');
                    listening = true;
                });

                const audioCtx = new AudioContext();
                const audioNode = audioCtx.createMediaElementSource(audio);
                analyser = new AnalyserNode(audioCtx);
                analyser.fftSize = 2048;

                audioNode.connect(analyser);
                analyser.connect(audioCtx.destination);
            })();
        }

        // check - has it been asked? (Y = memo, N = throttle/fetch)
        if (usedPrompts[prompt]) {
            audio.src = usedPrompts[prompt]
        } else {
            // throttle request for 7 seconds
            if (throttleTimer) {
                return;
            } else {
                // display loader 
                loader.classList.remove('hide');
                canvas.classList.add('hide');

                throttleTimer = setTimeout(() => {
                clearTimeout(throttleTimer);
                throttleTimer = null;
                }, 7000); 

                const response = await fetch('http://localhost:8000', 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: prompt })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    audio.src = url;
                    
                    loader.classList.add('hide');
                    usedPrompts[prompt] = url;
                }
            }
        }

        setTimeout(() => {
            canvas.classList.remove('hide')
        }, 100);
        const dataArray = new Uint8Array(analyser.fftSize); 
        audio.play();

        // draw visualization to canvas (60 snapshots per second)
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
        draw();
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

    voice.addEventListener('click', (e) => {
        e.preventDefault();
        handleVoice();
    });

    textArea.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            formText = new FormData(form).get('prompt');
            handleAsk(formText);
        }
    });
}

init();