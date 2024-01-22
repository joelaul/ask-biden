/* eslint-disable no-undef */

// IMPORTS

const confetti = require("./node_modules/canvas-confetti/src/confetti");
const sounds = require("./sounds");

// DOM

const form = document.querySelector("form");
const textArea = document.querySelector("textarea");
const voice = document.querySelectorAll("form button")[0];
const submit = document.querySelectorAll("form button")[1];
const loader = document.querySelector(".loader");
const listen = document.querySelector(".listen");
const suggestions = document.querySelectorAll(".suggestion-buttons button");
const contentWrapper = document.querySelector(".content-wrapper");
const middleSlide = document.querySelector(".middle-slide");
const biden = document.querySelector(".middle-top img");
const dim = document.querySelector(".dim-overlay");
let chatContainer;

const canvas = document.querySelector(".waveform");
const canvasCtx = canvas.getContext("2d");
const HEIGHT = 66,
  WIDTH = 295;
(canvas.width = WIDTH), (canvas.height = HEIGHT);
canvasCtx.fillStyle = "rgb(255, 255, 255)";
canvasCtx.strokeStyle = "rgb(0, 0, 0)";
canvasCtx.lineWidth = 2;

const stt = new webkitSpeechRecognition();

// STATE

const state = {
  usedPrompts: {},
  userBubbleIDs: [],
  joeBubbleDivs: [],
  listening: false,
  sending: false,
  formText: null,
  audio: null,
  analyser: null,
  dataArray: null,
  throttleTimer: null,
  listenTimer: null
}

// FUNCTIONS

const initAudio = () => {
  state.audio = new Audio();
  state.audio.addEventListener("ended", () => {
    middleSlide.classList.remove("slide-out");
    setTimeout(() => {
      canvas.classList.add("hide");
    }, 200);
    state.listening = false;
  });

  const audioCtx = new AudioContext();
  const audioNode = audioCtx.createMediaElementSource(state.audio);
  state.analyser = new AnalyserNode(audioCtx);
  state.analyser.fftSize = 2048;

  audioNode.connect(state.analyser);
  state.analyser.connect(audioCtx.destination);
};

const startListening = () => {
  state.listening = true;
  stt.start();
  sounds.listenStartSound.play();

  // display
  dim.classList.remove("hide");
  middleSlide.classList.add("slide-out");
  setTimeout(() => {
    listen.classList.remove("hide");
  }, 100);
};

const stopListening = () => {
  state.listening = false;
  stt.stop();
  state.listenTimer = null;

  // display
  dim.classList.add("hide");
  setTimeout(() => {
    listen.classList.add("hide");
  }, 200);
};

const makeUniqueID = () => {
  const timeStamp = Date.now();
  const randomNumber = Math.random();
  const hex = randomNumber.toString(16);

  return `id-${timeStamp}-${hex}`;
};

const drawWaveform = () => {
  // source: https://developer.mozilla.org/en-US/docs/Web/API/state.analyserNode/getByteTimeDomainData

  requestAnimationFrame(drawWaveform);
  state.dataArray = new Uint8Array(state.analyser.fftSize);
  state.analyser.getByteTimeDomainData(state.dataArray);

  const delta = (WIDTH * 1.0) / state.analyser.fftSize;
  let x = 0;

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.beginPath();

  for (let i = 0; i < state.analyser.fftSize; i++) {
    let v = state.dataArray[i] / 128.0;
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
};

const renderUserBubble = (prompt) => {
  const userBubbleDiv = document.createElement("div");
  userBubbleDiv.classList.add("chat-bubble", "user");
  userBubbleDiv.innerText = prompt;

  userBubbleDiv.id = makeUniqueID();
  state.userBubbleIDs.push(userBubbleDiv.id);

  chatContainer.append(userBubbleDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

const renderJoeResponse = async (response, prompt) => {
  const data = await response.json();
  const text = data.text;
  
  const audioBuffer = new Uint8Array(data.audio.data);
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  state.audio.src = url;

  const joeBubbleDiv = document.createElement("div");
  joeBubbleDiv.classList.add("chat-bubble", "joe");
  joeBubbleDiv.innerText = text;

  state.joeBubbleDivs.push(joeBubbleDiv);
  chatContainer.append(joeBubbleDiv);

  loader.classList.add("hide");
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // cache response for re-use
  state.usedPrompts[prompt] = [url, text];
};

const playJoeResponse = () => {
  setTimeout(() => {
    canvas.classList.remove("hide");
  }, 100);
  state.audio.play();
  drawWaveform();
};

const repopulateJoeBubbles = () => {
  for (let i = 0; i < state.joeBubbleDivs.length; i++) {
    state.joeBubbleDivs[state.joeBubbleDivs.length - 1].addEventListener("click", () => {
      handleJoeBubble(state.userBubbleIDs[i]);
    });
  }
};

// HANDLERS

const handleJoeBubble = (id) => {
  if (!state.listening && !state.sending) {
    const itsPrompt = document.getElementById(id).innerText;
    const itsAudio = state.usedPrompts[itsPrompt][0];
    state.audio.src = itsAudio;
    middleSlide.classList.add("slide-out");
    playJoeResponse();
  }
};

const handleVoice = () => {
  if (!state.listening && !state.sending && (!state.audio || state.audio.ended)) {
    // stop listening if 3 seconds pass without audio
    if (state.listenTimer) {
      return;
    } else {
      startListening();

      state.listenTimer = setTimeout(() => {
        middleSlide.classList.remove("slide-out");
        sounds.listenStopSound.play();
        stopListening();
      }, 3000);
    }

    stt.addEventListener("speechstart", () => {
      clearTimeout(state.listenTimer);
    });

    stt.addEventListener("speechend", stopListening);

    stt.addEventListener("result", (e) => {
      let transcript = e.results[0][0].transcript;
      textArea.value = transcript;
      handleAsk(transcript);
    });
  }
};

const handleAsk = async (prompt) => {
  if (textArea.value.length > 0 && !state.throttleTimer) {
    state.sending = true;
    middleSlide.classList.add("slide-out");
    textArea.value = "";

    if (!chatContainer) {
      chatContainer = document.createElement("div");
      chatContainer.classList.add("chat-container");
      contentWrapper.append(chatContainer);
    }

    if (state.listening) {
      stopListening();
    }

    if (state.audio) {
      if (!state.audio.ended) {
        state.audio.pause();
        canvas.classList.add("hide");
      }
    } else {
      initAudio();
    }

    // has it been asked? (Y = use cache, N = throttle/fetch)
    if (state.usedPrompts[prompt]) {
      state.audio.src = state.usedPrompts[prompt][0];
    } else {
      // throttle requests for 5 seconds
      state.throttleTimer = setTimeout(() => {
        state.throttleTimer = null;
      }, 5000);

      renderUserBubble(prompt);
      sounds.sentSound.play();

      // show loader
      setTimeout(() => {
        loader.classList.remove("hide");
      }, 200);

      // get joe response
      const url = process.env.NODE_ENV == "production" ? "https://ask-biden-backend.onrender.com" : "http://localhost:8000";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });
      if (response.ok) await renderJoeResponse(response, prompt);
    }

    playJoeResponse();
    repopulateJoeBubbles();
    state.sending = false;
  }
};

// INIT

const init = () => {
  for (let suggestion of suggestions) {
    suggestion.addEventListener("click", () => {
      sounds.suggestionSound.play();
      textArea.value = suggestion.innerText;
    });
  }

  submit.addEventListener("click", (e) => {
    e.preventDefault();
    state.formText = new FormData(form).get("prompt");
    handleAsk(state.formText);
  });

  document.body.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      state.formText = new FormData(form).get("prompt");
      handleAsk(state.formText);
    }
  });

  voice.addEventListener("click", (e) => {
    e.preventDefault();
    handleVoice();
  });

  biden.addEventListener("click", () => {
    confetti({
      particleCount: 25,
    });
    sounds.confettiSound.play();
  });

  window.addEventListener("load", () => {
    document.body.classList.remove("hide");
  });

  textArea.focus();
};

init();
