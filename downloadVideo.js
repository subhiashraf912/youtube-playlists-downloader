const { spawn } = require("child_process");
const readline = require("readline");
const path = require("path");
const fs = require("fs");
module.exports = async function downloadVideo(
  videoUrl,
  videoIndex,
  outputDir = ".",
  fileName = "output"
) {
  fileName = `${fileName}_${videoIndex}`;
  return new Promise((resolve, reject) => {
    // If the video file already exists, don't download again
    const videoFilePath = path.join(outputDir, `${fileName}.mp4`);
    if (fs.existsSync(videoFilePath)) {
      console.log(`Video ${fileName} already downloaded.`);
      return Promise.resolve();
    }
    // Execute yt-dlp --list-formats command
    const proc = spawn("yt-dlp", ["--list-formats", videoUrl]);

    // Create readline interface to read output line by line
    const rl = readline.createInterface({
      input: proc.stdout,
      output: process.stdout,
      terminal: false,
    });

    // Variables to store the format ids of the best video and audio
    let bestVideoId = null;
    let bestAudioId = null;
    let maxVideoRes = 0;
    let maxAudioBr = 0;

    // Modified regex patterns
    let videoPattern =
      /(\d+)[^\d]+\s*([^\s]+)\s+(\d+x\d+|\d+p|\d+i)\s+(\d+k)?\s+\w+\s+\|\s+([^\|]+)\s+\|\s+([^\|]+)/;
    let audioPattern =
      /(\d+)[^\d]+\s*([^\s]+)\s+(audio only)\s+\d*\s*.*\|([^\|]+)\|([^\|]+)?/;

    rl.on("line", (line) => {
      let videoMatch = videoPattern.exec(line);
      let audioMatch = audioPattern.exec(line);

      if (videoMatch) {
        let formatId = Number(videoMatch[1]);
        let type = videoMatch[2];
        let resolution = videoMatch[3];
        let data = videoMatch[6];

        if (type !== "audio" && resolution && resolution !== "audio") {
          const [width, height] = resolution.split("x").map(Number);
          if (width * height > maxVideoRes) {
            maxVideoRes = width * height;
            bestVideoId = formatId;
          }
        }
      } else if (audioMatch) {
        let formatId = Number(audioMatch[1]);
        let type = audioMatch[2];
        let data = audioMatch[4];

        if (data && data !== "unknown") {
          const audioBitrateValue = parseInt(data.replace("k", ""), 10);
          if (audioBitrateValue > maxAudioBr) {
            maxAudioBr = audioBitrateValue;
            bestAudioId = formatId;
          }
        } else if (data === "unknown" && bestAudioId === null) {
          bestAudioId = formatId;
        }
      }
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(`yt-dlp --list-formats exited with error code ${code}`);
        reject(`yt-dlp --list-formats exited with error code ${code}`);
      } else {
        console.log(`Best video format id: ${bestVideoId}`);
        console.log(`Best audio format id: ${bestAudioId}`);

        // Download video and audio
        const videoCommand = `yt-dlp -f ${bestVideoId} -o "${path.join(
          outputDir,
          fileName + "_video.mp4"
        )}" ${videoUrl}`;
        console.log("video command: ", videoCommand);
        const audioCommand = `yt-dlp -f ${bestAudioId} -o "${path.join(
          outputDir,
          fileName + "_audio.m4a"
        )}" ${videoUrl}`;

        // Merge video and audio
        const mergeCommand = `ffmpeg -i "${path.join(
          outputDir,
          fileName + "_video.mp4"
        )}" -i "${path.join(
          outputDir,
          fileName + "_audio.m4a"
        )}" -c:v copy -c:a aac "${path.join(outputDir, fileName + ".mp4")}"`;

        runCommand(videoCommand, () => {
          runCommand(audioCommand, () => {
            runCommand(mergeCommand, () => {
              console.log("Video downloaded successfully");
              const videoFilePath = path.join(
                outputDir,
                fileName + "_video.mp4"
              );
              const audioFilePath = path.join(
                outputDir,
                fileName + "_audio.m4a"
              );
              // Remove the audio and video files
              fs.unlink(videoFilePath, (err) => {
                if (err) throw err;
                console.log(videoFilePath + " was deleted");
              });

              fs.unlink(audioFilePath, (err) => {
                if (err) throw err;
                console.log(audioFilePath + " was deleted");
              });
              resolve();
            });
          });
        });
      }
    });
  });
};

function runCommand(cmd, callback) {
  const parts = cmd.split(" ");
  const proc = spawn(parts[0], parts.slice(1), { shell: true });

  proc.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  proc.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`Command exited with error code ${code}`);
    } else if (callback) {
      callback();
    }
  });
}
