const path = require('path');
const fs = require('fs');

const workspaceRootPath = __dirname;
const indexTmpFile = path.join(__dirname, 'data/html');

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

/* ///(?:"[^"]*"|^[^"]*$)/)[0] */

// IMPORT CSS AND JS FILES INTO HTML DATA
//prettier-ignore
const indexTmpDataImported = indexTmpDataFiltered.map(function (line) {

  if(line.includes('stylesheet') && line.includes('.css')) {
    const cssFile = `${workspaceRootPath}/${matchHref(line)}`;

    if (!fs.existsSync(cssFile)){
      return `${cssFile} não encontrado`;  
    } else {
      return fs.readFileSync(cssFile, {encoding: 'utf8', flag: 'r'});      
    }    
  }           

  if(line.includes('script') && line.includes('.js')) {
    const jsFile = matchSrc(line);

    if (!fs.existsSync(jsFile)){
      return `${jsFile} não encontrado`;  
    } else {
      return fs.readFileSync(jsFile, {encoding: 'utf8', flag: 'r'});
    }   
  }

  return line;  
});

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

console.log({ indexTmpDataImported });
