const fs = require("fs");
const path = require("path");

// Define the base directory of your project
const baseDirectory = "./src";
const distDir = "./appscript";
const servDir = "./server";

const htmlFile = "index.html";
const authFile = "401.html";

/*** HTML FILES */
// copies the index.html file from the Parcel /dist and copies it to /appscript
fs.copyFileSync(
  path.resolve(__dirname, baseDirectory, htmlFile),
  path.resolve(__dirname, distDir, htmlFile)
);
fs.copyFileSync(
  path.resolve(__dirname, baseDirectory, authFile),
  path.resolve(__dirname, distDir, authFile)
);

/*** GS Files */
// reads the content in the /server folder
const dir = fs.readdirSync(path.resolve(__dirname, servDir));

// loop through each file in the /server folder
dir.forEach((file) => {
  fs.copyFileSync(
    path.resolve(__dirname, servDir, file),
    path.resolve(__dirname, distDir, file)
  );
});

/** Convert JS and CSS Files into usable files in GAS */

// Recursively read all the files in the directory
const readDirectory = (dir) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) {
          console.error(err);
          return;
        }

        if (stat.isDirectory()) {
          readDirectory(filePath);
        } else if (
          path.extname(filePath) === ".js" ||
          path.extname(filePath) === ".css"
        ) {
          const fileExt = path.extname(filePath);
          fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
            let html;
            if (fileExt === ".js") {
              html = `
                <script>
              ${data}
                </script>
              `;
            } else if (fileExt === ".css") {
              html = `
              <style>
              ${data}
              </style>
              `;
            }
            //const outputFile = path.join(path.dirname(filePath), path.basename(filePath, '.js') + '.html');
            //const outputFile = path.join(path.dirname(filePath), distDir, path.basename(filePath, '.js') + 'js.html');
            // const outputFile = path.join(
            //   baseDirectory,
            //   distDir,
            //   path.basename(filePath, fileExt) + `${fileExt}.html`
            // );
            const outputFile = path.resolve(
              __dirname,
              distDir,
              path.basename(filePath, fileExt) + `${fileExt}.html`
            );

            fs.writeFile(outputFile, html, (err) => {
              if (err) {
                console.error(err);
                return;
              }
              //console.log(`HTML file created for ${filePath}`);
            });
          });
        }
      });
    });
  });
};

readDirectory(baseDirectory);
