const downloadThumbnail = require("./downloadThumbnail");
const downloadVideo = require("./downloadVideo");
const getPlaylistVideos = require("./getPlaylistVideos");
const fs = require("fs");
const saveMetaData = require("./saveMetadata");
// function removeDuplicates(arr) {
//   return arr.filter(
//     (video, index, self) =>
//       index === self.findIndex((t) => t.videoId === video.videoId)
//   );
// }

(async () => {
  try {
    const videos = await getPlaylistVideos(
      "https://www.youtube.com/playlist?list=PLCPG4i3KTFWlfDOb2aWFenuigzGgCVtaM"
    );

    console.log(videos.length, "videos found in playlist");
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log("Downloading video:", video);
      const sanitizedTitle = sanitizeFilename(video.videoTitle);
      const directory = `videos/${video.videoId}`;
      fs.mkdirSync(directory, { recursive: true });

      await downloadThumbnail(
        `${video.videoThumbnail}`,
        `${directory}/thumbnail.png`
      );

      saveMetaData(
        {
          title: video.videoTitle,
          description: video.videoDescription,
          tags: video.videoTags,
        },
        `${directory}/metadata.json`
      );

      await downloadVideo(
        video.videoLink,
        i,
        directory,
        `${sanitizedTitle}.mp4`
      );
    }

    videos.forEach((video) => {
      console.log("Downloading video:", video);
    });
  } catch (error) {
    console.error("Error fetching playlist videos:", error);
  }
})();
function sanitizeFilename(filename) {
  return filename.replace(/[<>:"\/\\|?*]+/g, "").slice(0, 100);
}
