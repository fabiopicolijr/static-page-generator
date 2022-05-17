const vscode = require('vscode');
const fs = require('fs');

const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

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
      const files = {
        indexFile: `${workspaceRootPath}\\src\\index.html`,
        gspPath: `${workspaceRootPath}\\gsp`,
        staticBegin: `${workspaceRootPath}\\gsp\\static\\indexBegin.html`,
        staticEnd: `${workspaceRootPath}\\gsp\\static\\indexEnd.html`,
        distPath: `${workspaceRootPath}\\gsp\\dist`,
        bundle: `${workspaceRootPath}\\gsp\\dist\\bundle.htm`,
        tmpPath: `${workspaceRootPath}\\gsp\\dist\\tmp`,
        indexTmpFile: `${workspaceRootPath}\\gsp\\dist\\tmp\\index.html`,
      };

      try {
        createFiles(files);
        appendDataFile(files.staticBegin, files.bundle);
        importCssJs(filterBundle(files), files);
        appendDataFile(files.staticEnd, files.bundle);

        //prettier-ignore
        vscode.window.showInformationMessage(`File generated at ${files.bundle}`);
      } catch (err) {
        vscode.window.showErrorMessage('ERROR: ' + err);
      }
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

function createFiles(files) {
  console.log('createFiles Begin');

  if (!fs.existsSync(files.indexFile))
    throw new Error('src/index.html does not exists.');

  if (!fs.existsSync(files.gspPath)) fs.mkdirSync(files.gspPath);
  if (!fs.existsSync(files.distPath)) fs.mkdirSync(files.distPath);
  if (!fs.existsSync(files.tmpPath)) fs.mkdirSync(files.tmpPath);

  fs.copyFileSync(files.indexFile, files.indexTmpFile);
  if (fs.existsSync(files.bundle)) fs.truncateSync(files.bundle, 0);

  console.log('createFiles End');
}

function appendDataFile(file, destinationFile) {
  const line = '\r\n';
  const lineBefore = !file.includes('indexBegin.html') ? line : '';

  if (fs.existsSync(file)) {
    const staticData = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });

    fs.appendFileSync(destinationFile, lineBefore + staticData + line);
  }

  console.log('appendData End');
}

function filterBundle(files) {
  console.log('filterIndexData Begin');
  // FILTER HTML DATA
  const indexTmpData = fs
    .readFileSync(files.indexTmpFile, 'utf-8')
    .split('\r\n');

  const ignoredLines = [
    '.min.js',
    '.min.css',
    '.mask.js',
    '<!DOCTYPE html>',
    'crossorigin="anonymous"',
    'prettier-ignore',
    'spg-ignore',
  ];

  const indexTmpDataFiltered = indexTmpData.filter(function (line) {
    return !ignoredLines.some((el) => line.includes(el));
  });

  console.log('filterIndexData End');

  return indexTmpDataFiltered;
}

function importCssJs(indexTmpDataFiltered, files) {
  console.log('importCssJs Begin');
  // IMPORT CSS AND JS FILES INTO HTML DATA
  //prettier-ignore
  let firstJsFile = true;

  console.log(indexTmpDataFiltered);

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

  const indexTmpDataImportedString = indexTmpDataImported.join('\r\n');

  fs.appendFileSync(files.bundle, indexTmpDataImportedString);

  console.log('importCssJs End');
}

// Utils.js
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
