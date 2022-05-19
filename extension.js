const vscode = require('vscode');
const fs = require('fs');

const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
const files = {
  indexFile: `${workspaceRootPath}\\src\\index.html`,
  projectPath: `${workspaceRootPath}\\spg`,
  distPath: `${workspaceRootPath}\\dist`,
  bundle: `${workspaceRootPath}\\dist\\bundle.htm`,
  tmpPath: `${workspaceRootPath}\\spg\\tmp`,
  indexTmpFile: `${workspaceRootPath}\\spg\\tmp\\index.html`,

  imports: {
    beforeHTMLTag: `${workspaceRootPath}\\spg\\static\\beforeHTMLTag.txt`,
    beforeScriptTags: `${workspaceRootPath}\\spg\\static\\beforeScriptTags.txt`,
    beforeHTMLCloseTag: `${workspaceRootPath}\\spg\\static\\beforeHTMLCloseTag.txt`,
    afterHTMLCloseTag: `${workspaceRootPath}\\spg\\static\\afterHTMLCloseTag.txt`,

    replace: {
      metaCharset: `${workspaceRootPath}\\spg\\static\\replace\\metaCharset.txt`,
    },
  },
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log(
    'Congratsss, your extension "static-page-generator" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    'static-page-generator.exportDevelopmentVersion',
    function () {
      try {
        createProjectFiles();

        appendFileToBundle(files.imports.beforeHTMLTag);
        processIndexToBundle(filterIndex());
        appendFileToBundle(files.imports.afterHTMLCloseTag);

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

function createProjectFiles() {
  console.log('createProjectFiles Begin');

  if (!fs.existsSync(files.indexFile))
    throw new Error('src/index.html does not exists.');

  if (!fs.existsSync(files.projectPath)) fs.mkdirSync(files.projectPath);
  if (!fs.existsSync(files.distPath)) fs.mkdirSync(files.distPath);
  if (!fs.existsSync(files.tmpPath)) fs.mkdirSync(files.tmpPath);

  fs.copyFileSync(files.indexFile, files.indexTmpFile);
  if (fs.existsSync(files.bundle)) fs.truncateSync(files.bundle, 0);

  console.log('createProjectFiles End');
}

function appendFileToBundle(file) {
  const line = '\r\n';
  const lineBefore = !file.includes('indexBegin.html') ? line : '';

  if (fs.existsSync(file)) {
    const staticData = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });

    fs.appendFileSync(files.bundle, lineBefore + staticData + line);
  }

  console.log('appendData End');
}

function filterIndex() {
  console.log('filterIndexData Begin');
  // FILTER HTML DATA
  const indexTmpData = fs
    .readFileSync(files.indexTmpFile, 'utf-8')
    .split('\r\n');

  const ignoredLines = [
    '<!DOCTYPE html>',
    'prettier-ignore',
    'data-spg="remove"',
  ];

  const indexTmpDataFiltered = indexTmpData.filter(function (line) {
    return !ignoredLines.some((el) => line.includes(el));
  });

  console.log('filterIndexData End');

  return indexTmpDataFiltered;
}

function processIndexToBundle(indexTmpDataFiltered) {
  console.log('processIndexToBundle Begin');
  // IMPORT CSS AND JS FILES INTO HTML DATA
  //prettier-ignore
  let firstJsFile = true;

  // prettier-ignore
  const indexTmpDataImported = indexTmpDataFiltered.map(function (line) {   
    const bodyCloseTag = '</body>';
    const htmlCloseTag = '</html>';  
    
    // Função de exemplo para replcace, por enquanto não vamos utilizar.
    if(line.includes('data-spg="replace"')){      
      // if(line.includes('charset=utf-8')){
      //   const dataReplaceMetaCharset = fs.readFileSync(files.imports.replace.metaCharset, { encoding: 'utf8', flag: 'r' });
      //   return dataReplaceMetaCharset;
      // }
    }    

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
        let dataBeforeScripts;     
        firstJsFile = false;

        // IMPORT BEFORE SCRIPTS FILE
        if (fs.existsSync(files.imports.beforeScriptTags)) {
          dataBeforeScripts = fs.readFileSync(files.imports.beforeScriptTags, { encoding: 'utf8', flag: 'r' });
        }        
        
        return `\r\n${dataBeforeScripts}<script type="text/javascript">\r\n${jsData}`;
      }

      return jsData;
    }

    if(line.trim().includes(bodyCloseTag)) return `</script>\r\n${bodyCloseTag}`;

    if(line.trim().includes(htmlCloseTag)) {
      const dataBeforeHTMLCloseTag = fs.readFileSync(files.imports.beforeHTMLCloseTag, { encoding: 'utf8', flag: 'r' });

      return `\r\n${dataBeforeHTMLCloseTag}\r\n${htmlCloseTag}`;
    };

    return line;
  });

  const indexTmpDataImportedString = indexTmpDataImported.join('\r\n');

  fs.appendFileSync(files.bundle, indexTmpDataImportedString);

  console.log('processIndexToBundle End');
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
