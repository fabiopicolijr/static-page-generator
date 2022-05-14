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
    async function () {
      const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const indexFile = `${workspaceRootPath}/src/index.html`;
      const staticBeforeFile = `${workspaceRootPath}/src/staticBefore.txt`;
      const distPath = `${workspaceRootPath}/dist`;
      const bundleFile = `${distPath}/bundle.htm`;
      const tmpPath = `${distPath}/tmp`;
      const indexTmpFile = `${tmpPath}/index.html`;
      const newLine = '\n';

      console.log('LOG: before try');

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
          const staticBeforeData = fs.readFileSync(staticBeforeFile, {
            encoding: 'utf8',
            flag: 'r',
          });

          console.log('LOG: try 4');

          //prettier-ignore
          fs.appendFile(bundleFile, staticBeforeData, (err) => {
            if (err) throw err;
          });
        }

        console.log('LOG: try END');
        // GET HTML CONTENT

        // GENERATE BUNDLE FILE.HTM
        //prettier-ignore
      } catch (err) {
        vscode.window.showErrorMessage('ERROR: ' + err.message);
        return null;
      }

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
