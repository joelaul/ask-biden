// IMPORTS

const { format } = require("date-fns");
const fsPromises = require("fs").promises;
const path = require("path");

// ENV

const subUrl = "https://api.elevenlabs.io/v1/user/subscription";
const apiKey = process.env.ELEVEN_API_KEY;

// FUNCTIONS

const logger = async (req, res, next) => {
  // gather request info (date, characters used)
  const dateTime = `${format(new Date(), "MM-dd-yyyy\tHH:mm:ss")}`;

  const subInfo = await fetch(subUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      "xi-api-key": apiKey,
    },
  });
  const data = await subInfo.json();

  const message = `${req.method}\t${req.headers.origin}`;
  const logItem = `${dateTime}\t${message}\tChars used: ${data["character_count"]}/${data["character_limit"]}\n`;

  // log POST info to reqLog.txt (fuck OPTIONS)
  if (req.method === "POST") {
    await fsPromises.appendFile(
      path.join(__dirname, "logs", "reqLog.txt"),
      logItem
    );
  }

  next();
};

// EXPORT

module.exports = { logger };
