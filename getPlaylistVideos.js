const { spawn } = require("child_process");
const readline = require("readline");

module.exports = function getPlayListVideos(playlistUrl) {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", ["--flat-playlist", "-J", playlistUrl]);
    let data = "";

    proc.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    proc.stdout.on("end", () => {
      try {
        let playlist = JSON.parse(data);
        console.log(playlist.entries[0]);
        let videoUrls = playlist.entries.map((entry) => {
          return {
            videoId: entry.id,
            videoLink: "https://www.youtube.com/watch?v=" + entry.id,
            videoTitle: entry.title,
            videoThumbnail: entry.thumbnails[entry.thumbnails.length - 1].url,
            videoDescription: entry.description,
            videoTags: entry.tags || [], // yt-dlp does not seem to include tags in flat playlist mode
          };
        });
        resolve(videoUrls);
      } catch (err) {
        reject(err);
      }
    });

    proc.stderr.on("data", (chunk) => {
      console.warn("yt-dlp warning:", chunk.toString());
    });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("exit", (code, signal) => {
      if (code !== 0) {
        reject(
          new Error(`Process exited with code: ${code}, signal: ${signal}`)
        );
      }
    });
  });
};
