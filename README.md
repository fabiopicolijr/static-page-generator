# static-page-generator README

This extension will basicly read your index.html and generate another file (bundle.html).

## Features

- SPG: Export Development Version:

  - Import .css files
  - Import .js files
  - Import file before HTML tag (<html>)
  - Import file before HTML close tag (</html>)
  - Import file after HTML close tag (</html>)
  - Import file before first SCRIPT tag (<script>)

- SPG: Export Production Version:
  - (In development)

## Requirements

Your index.html needs to be at src/index.html.
To import files by tag, you need to create this specific files:

- projectRoot/spg/static/beforeHTMLTag.txt
- projectRoot/spg/static/beforeHTMLCloseTag.txt
- projectRoot/spg/static/afterHTMLCloseTag.txt
- projectRoot/spg/static/beforeScriptTags.txt

## Known Issues

- Create a config parameter to identify where is index.html file.
- Create a config parameter to identify where are the static pages to import.

## Release Notes

### 1.0.0

Initial release.

---
