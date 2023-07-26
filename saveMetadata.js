const fs = require("fs");
module.exports = function saveMetadata(entry, filename) {
  fs.writeFileSync(filename, JSON.stringify(entry, null, 2));
};
