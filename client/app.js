/* DEV:
// FIGURE OUT GIT BULLSHIT
// COLLAPSE CANVAS AREA WHEN NO CONTENT IS DISPLAYED
// IMESSAGE LOG RIGHT SIDE
// IMPROVE ANIMATIONS / SASS
// BG PARTICLES OR FALLING STARS / TV STATIC
*/

/* PROD:
// REMOVE FUNNY BUSINESS (USE A FORK FOR MEMES)
// PRETTIER
// JEST UNIT TESTS, ADD ERROR HANDLING
// DEPLOY TO GLITCH
// README: DEPLOYMENT GUIDE FOR DEVS, ARCHITECTURE FLOWCHART
// VIDEO DEMO, BLOG
// ELI5 TO RECRUITERS
*/

/* TOOLS AND TECHNOLOGIES:
// WEB SPEECH
// WEB AUDIO
// CANVAS
// OPENAI
// ELEVENLABS
// EXPRESS, DOTENV
// PARCEL
// TERMINAL
*/

/* LESSONS LEARNED:
// FORMS (BUTTONS ARE TYPE="SUBMIT" BY DEFAULT)
// RESOURCE CONTROL: THROTTLING, CACHING, TOKEN LIMIT
// LOGGING, MIDDLEWARE, MODULES
// ENVIRONMENT VARIABLES, DIRECTORY STRUCTURE
// BLOBS, BUFFERS, BIN ARRAYS, OBJECT URLS
*/

// DOWN THE ROAD:
// IS THERE A MORE EFFICIENT WAY OF POSITIONING ELEMENTS?

// DOM

const form = document.querySelector('form');
const textArea = document.querySelector('textarea');
const voice = document.querySelectorAll('form button')[0];
const submit = document.querySelectorAll('form button')[1];
const loader = document.querySelector('.loader');
const listen = document.querySelector('.listen');
const suggestions = document.querySelectorAll('.middle-body-bottom button');

// STATE

const clickedButtons = {};
let audio, analyser, userStream, throttleTimer, formText;

const canvas = document.querySelector(".waveform");
const canvasCtx = canvas.getContext("2d");
const HEIGHT = 70, WIDTH = 295;
canvas.width = WIDTH, canvas.height = HEIGHT;
canvasCtx.fillStyle = "rgb(255, 255, 255)";
canvasCtx.strokeStyle = "rgb(0, 0, 0)";
canvasCtx.lineWidth = 2;

const stt = new webkitSpeechRecognition;

// FUNCTIONS

const handleVoice = () => {
    // display listening prompt
    listen.classList.remove('hide');
    canvas.classList.add('hide');

    stt.addEventListener('speechend', stt.stop);

    stt.addEventListener('result', (e) => {
        let transcript = e.results[0][0].transcript;
        textArea.value = transcript;
        
        // display loader
        listen.classList.add('hide');
        loader.classList.remove('hide');

        handleAsk(transcript);
    });
}

const handleAsk = async (prompt) => {
    if (textArea.value.length > 0) {

        // check - has audio been initialized?
        if (audio) {
        if (!audio.ended) audio.pause();
        } else {
            audio = new Audio();
            const audioCtx = new AudioContext();
            const audioNode = audioCtx.createMediaElementSource(audio);
            analyser = new AnalyserNode(audioCtx);
            audioNode.connect(analyser);
            analyser.connect(audioCtx.destination);
        }

        // check - has it been asked? (Y = memo, N = throttle/fetch)
        if (clickedButtons[prompt]) {
            audio.src = clickedButtons[prompt]
            audio.play();
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
                    
                    // display canvas
                    loader.classList.add('hide');
                    canvas.classList.remove('hide');

                    audio.play();
                    clickedButtons[prompt] = url;
                }
            }
        }

        // # samples in each snapshot (46 ms @ 44.1)
        analyser.fftSize = 2048;

        const dataArray = new Uint8Array(analyser.fftSize); 

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
    
    (initCanvas = () => {
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, HEIGHT / 2);
        canvasCtx.lineTo(WIDTH, HEIGHT / 2);
        canvasCtx.stroke();
    })();

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
        stt.start();
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