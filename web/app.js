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

const usedPrompts = {};
const userBubbleIDs = [],
  joeBubbleDivs = [];

let formText, audio, analyser, dataArray;
let throttleTimer, listenTimer;
let listening,
  sending = false;

// FUNCTIONS

const initAudio = () => {
  audio = new Audio();
  audio.addEventListener("ended", () => {
    middleSlide.classList.remove("slide-out");
    setTimeout(() => {
      canvas.classList.add("hide");
    }, 200);
    listening = false;
  });

  const audioCtx = new AudioContext();
  const audioNode = audioCtx.createMediaElementSource(audio);
  analyser = new AnalyserNode(audioCtx);
  analyser.fftSize = 2048;

  audioNode.connect(analyser);
  analyser.connect(audioCtx.destination);
};

const startListening = () => {
  listening = true;
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
  listening = false;
  stt.stop();
  listenTimer = null;

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
  // source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData

  requestAnimationFrame(drawWaveform);
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
};

const renderUserBubble = (prompt) => {
  const userBubbleDiv = document.createElement("div");
  userBubbleDiv.classList.add("chat-bubble", "user");
  userBubbleDiv.innerText = prompt;

  userBubbleDiv.id = makeUniqueID();
  userBubbleIDs.push(userBubbleDiv.id);

  chatContainer.append(userBubbleDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

const renderJoeResponse = async (response, prompt) => {
  const data = await response.json();
  const text = data.text;
  const audioBuffer = new Uint8Array(data.audio.data);
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  audio.src = url;

  const joeBubbleDiv = document.createElement("div");
  joeBubbleDiv.classList.add("chat-bubble", "joe");
  joeBubbleDiv.innerText = text;

  joeBubbleDivs.push(joeBubbleDiv);
  chatContainer.append(joeBubbleDiv);

  loader.classList.add("hide");
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // cache response for re-use
  usedPrompts[prompt] = [url, text];
};

const playJoeResponse = () => {
  setTimeout(() => {
    canvas.classList.remove("hide");
  }, 100);
  audio.play();
  drawWaveform();
};

const repopulateJoeBubbles = () => {
  for (let i = 0; i < joeBubbleDivs.length; i++) {
    joeBubbleDivs[joeBubbleDivs.length - 1].addEventListener("click", () => {
      handleJoeBubble(userBubbleIDs[i]);
    });
  }
};

// HANDLERS

const handleJoeBubble = (id) => {
  if (!listening && !sending) {
    const itsPrompt = document.getElementById(id).innerText;
    const itsAudio = usedPrompts[itsPrompt][0];
    audio.src = itsAudio;
    middleSlide.classList.add("slide-out");
    playJoeResponse();
  }
};

const handleVoice = () => {
  if (!listening && !sending && (!audio || audio.ended)) {
    // stop listening if 3 seconds pass without audio
    if (listenTimer) {
      return;
    } else {
      startListening();

      listenTimer = setTimeout(() => {
        middleSlide.classList.remove("slide-out");
        sounds.listenStopSound.play();
        stopListening();
      }, 3000);
    }

    stt.addEventListener("speechstart", () => {
      clearTimeout(listenTimer);
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
  if (textArea.value.length > 0 && !throttleTimer) {
    sending = true;
    middleSlide.classList.add("slide-out");
    textArea.value = "";

    if (!chatContainer) {
      chatContainer = document.createElement("div");
      chatContainer.classList.add("chat-container");
      contentWrapper.append(chatContainer);
    }

    if (listening) {
      stopListening();
    }

    if (audio) {
      if (!audio.ended) {
        audio.pause();
        canvas.classList.add("hide");
      }
    } else {
      initAudio();
    }

    // has it been asked? (Y = use cache, N = throttle/fetch)
    if (usedPrompts[prompt]) {
      audio.src = usedPrompts[prompt][0];
    } else {
      // throttle requests for 5 seconds
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 5000);

      renderUserBubble(prompt);
      sounds.sentSound.play();

      // show loader
      setTimeout(() => {
        loader.classList.remove("hide");
      }, 200);

      // get joe response
      const response = await fetch("https://ask-biden-backend.onrender.com/", {
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
    sending = false;
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
    formText = new FormData(form).get("prompt");
    handleAsk(formText);
  });

  document.body.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      formText = new FormData(form).get("prompt");
      handleAsk(formText);
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
