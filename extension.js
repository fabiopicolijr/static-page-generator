const vscode = require('vscode');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log(
    'Congratsss, your extension "static-page-generator" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    'static-page-generator.generateStaticPage',
    function () {
      const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const indexFile = `${workspaceRootPath}/src/index.html`;
      const staticBeforeFile = `${workspaceRootPath}/src/staticBefore.txt`;
      const distPath = `${workspaceRootPath}/dist`;
      const bundleFile = `${distPath}/bundle.htm`;
      const tmpPath = `${distPath}/tmp`;
      const indexTmpFile = `${tmpPath}/index.html`;
      //const newLine = '\n';

      try {
        console.log('LOG: try');
        // CHECK INDEX FILE
        if (!fs.existsSync(indexFile))
          throw new Error('src/index.html does not exists.');

        // CREATE DIST FOLDER
        if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);

        // CREATE TMP FOLDER
        if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);

        // EMPTY TMP/INDEX FILE
        if (fs.existsSync(indexTmpFile)) {
          fs.truncate(indexTmpFile, 0, function () {
            // COPY INDEX FILE TO DIST/TMP
            fs.copyFileSync(indexFile, indexTmpFile);
          });
        } else {
          // COPY INDEX FILE TO DIST/TMP
          fs.copyFileSync(indexFile, indexTmpFile);
        }

        // EMPTY BUNDLE FILE
        if (fs.existsSync(bundleFile))
          fs.truncate(bundleFile, 0, function () {});

        // [OPCIONAL] GET STATIC CONTENT: before HTML TAG
        if (fs.existsSync(staticBeforeFile)) {
          //prettier-ignore
          const staticBeforeData = fs.readFileSync(staticBeforeFile, {encoding: 'utf8', flag: 'r'});

          //prettier-ignore
          fs.appendFileSync(bundleFile, staticBeforeData + '\r\n');
          // fs.appendFile(bundleFile, staticBeforeData, (err) => {
          //   if (err) throw err;
          // });
        }

        console.log('LOG: try END');
        // GET HTML CONTENT

        // GENERATE BUNDLE FILE.HTM
        //prettier-ignore
      } catch (err) {
        vscode.window.showErrorMessage('ERROR: ' + err.message);
        return null;
      }

      // FILTER HTML DATA
      const indexTmpData = fs.readFileSync(indexTmpFile, 'utf-8').split('\r\n');

      const ignoredLines = [
        '.min.js',
        '.min.css',
        '.mask.js',
        '<!DOCTYPE html>',
        'crossorigin="anonymous"',
        'prettier-ignore',
      ];

      const indexTmpDataFiltered = indexTmpData.filter(function (line) {
        return !ignoredLines.some((el) => line.includes(el));
      });

      // IMPORT CSS AND JS FILES INTO HTML DATA
      //prettier-ignore
      let firstJsFile = true;

      console.log('indexTmpDataFiltered.length', indexTmpDataFiltered.length);

      // prettier-ignore
      const indexTmpDataImported = indexTmpDataFiltered.map(function (line) {                

        if (line.includes('stylesheet') && line.includes('.css')) {
          const cssFile = `${workspaceRootPath}/src/${matchHref(line)}`;

          if (!fs.existsSync(cssFile)) {
            return `${cssFile} não encontrado`;
          }

          const cssData = fs.readFileSync(cssFile, {
            encoding: 'utf8',
            flag: 'r',
          });

          return `<style type="text/css">\r\n${cssData}</style>`;
        }

        if (line.includes('script') && line.includes('.js')) {
          const jsFile = `${workspaceRootPath}/src/${matchSrc(line)}`;

          if (!fs.existsSync(jsFile)) {
            return `${jsFile} não encontrado`;
          }

          const jsData = fs.readFileSync(jsFile, {
            encoding: 'utf8',
            flag: 'r',
          });

          if (firstJsFile) {
            firstJsFile = false;
            return `<script type="text/javascript">\r\n${jsData}`;
          }

          return jsData;
        }

        return line.trim() === '</body>'
          ? `</script>\r\n</body>`
          : line;
      });

      // APPEND DATA
      const indexTmpDataImportedString = indexTmpDataImported.join('\r\n');

      fs.appendFileSync(bundleFile, indexTmpDataImportedString);

      console.log('LOG: File generated at dist/bundle.htm');
      vscode.window.showInformationMessage('File generated at dist/bundle.htm');
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

function matchHref(string) {
  return JSON.stringify(string.match(/href="([^\'\"]+)/g))
    .replace(/[\]\="\)}[{(]/g, '')
    .replace('href', '')
    .replace('\\', '');
}

function matchSrc(string) {
  return JSON.stringify(string.match(/src="([^\'\"]+)/g))
    .replace(/[\]\="\)}[{(]/g, '')
    .replace('src', '')
    .replace('\\', '');
}
