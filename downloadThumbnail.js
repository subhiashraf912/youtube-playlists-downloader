const fs = require("fs");
const https = require("https");

module.exports = async function downloadThumbnail(url, filename) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const fileStream = fs.createWriteStream(filename);
        res.pipe(fileStream);
        fileStream.on("error", (err) => {
          console.log(`Error writing file: ${err}`);
          reject(err);
        });
        fileStream.on("finish", () => {
          fileStream.close();
          resolve(filename);
        });
      })
      .on("error", (err) => {
        console.log(`Error downloading file: ${err}`);
        reject(err);
      });
  });
};
