# js-dialog
Custom draggable Alert, Prompt, Confirm dialogs in Javascript.

The default browser's dialogs provided by functions `alert()`, `prompt()`, and `confirm()`
do not offer customization.  This project provides a reasonable alternative.

## Author

Serge Aleynikov <saleyn at gmail dot com>

## Demo

See [test.html](https://saleyn.github.io/js-dialog).

https://user-images.githubusercontent.com/272543/151256006-71a35826-6990-4011-a006-be3bb9437af9.mp4

## Installation

1. In your project add the following to your `package.json`:
```
{
  "dependencies": {
    "@saleyn/js-dialog": "^0.1"
  }
}
```
2. Execute the following command to pull the package to your project's source tree:
```
$ npm install @saleyn/js-dialog
```
3. If you are using `esbuild` or a similar bundling tool, add the following to import the
   dialog functions:

  * `app.js`:
```javascript
import Dialog from "@saleyn/js-dialog"
```
4. Run your javascript bundler (e.g. `esbuild`) to produce the `app.min.js` for your site. E.g.:
```
esbuild js/app.js --bundle --minify --outdir=/path/to/your/static/assets --sourcemap=external --source-root=js
```

## Building minified sources

The following command will produce `dist/dialog.min.*` files to be used in your projects:
```
$ make
```

## Usage

Add this markup to your HTML file. The `div` with `dlg-window` will be the placeholder of
the dialog:
```html
<head>
<script src="dialog.min.js"></script>
</head>
<body>
...
<div id="dlg-window"></div>
</body>
```

This dialog library supports dark and light themes, and will attempt to detect the current
user's theme.  The theme information is stored in the local storage and can be reset
by making one of these calls:
```
localStorage.setItem('dlg-theme-mode', 'dark')  // For dark mode
localStorage.setItem('dlg-theme-mode', 'list')  // For light mode
```

1. To invoke a confirmation dialog, use:
```javascript
Dialog.confirm(title, body, action, opts = {})
```
| Argument        | Type     | Description                                |
| --------------- | -------- | ------------------------------------------ |
| title           | string   | Title of the alert dialog box              |
| body            | string   | InnerHTML of the dialog's body             |
| action          | function | Action `(success) -> success` to be called on closing of the dialog, where `success` is true if the default button was pressed |
| opts            | object   | Configuration options                      |
| opts.persistent | boolean  | When true - store dialog's position        |
| opts.buttons    | array    | Array of buttons to be displayed. Default: `[{title: "Ok"}, {title: "Cancel"}]` |
| opts.defbtn     | integer  | Index of the default button (default: 0)   |
| opts.btnOk      | integer  | Index of the "Ok" button in `opts.buttons` |
| opts.theme      | string   | Use given color theme ('dark' | 'light')   |

Example:
```javascript
Dialog.confirm("Confirm action?", "Some custom body", (ok) => ok && alert('OK pressed!'))
```

2. To invoke the prompt dialog, use:
```javascript
Dialog.prompt(title, body, action, opts = {})
```
| Argument        | Type     | Description                                |
| --------------- | -------- | ------------------------------------------ |
| title           | string   | Title of the alert dialog box              |
| body            | string   | InnerHTML of the dialog's body             |
| action          | function | Action `(clickedButtonIndex, [{id: inputID, value: inputVal}]) -> {}` to be called on success |
| opts            | object   | Configuration options                      |
| opts.persistent | boolean  | When true - store dialog's position        |
| opts.inputs     | array    | Array of input fields to be displayed. Default: `[{label: "Enter a value", id: "value"}]` |
| opts.buttons    | array    | Array of buttons to be displayed. Default: `[{title: "Ok"}, {title: "Cancel"}]` |
| opts.defbtn     | integer  | Index of the default button (default: 0)   |
| opts.theme      | string   | Use given color theme ('dark' | 'light')   |

Example:
```javascript
Dialog.prompt("Data entry", "Type some text:", (btn_id, inputs) => btn_id==0 && alert('Entered: ' + inputs[0].value))
```

3. To display the alert dialog, do:
```javascript
Alert.show(title, body, opts = {})
```
| Argument        | Type    | Description                         |
| --------------- | ------- | ----------------------------------- |
| title           | string  | Title of the alert dialog box       |
| body            | string  | InnerHTML of the dialog's body      |
| opts            | object  | Configuration options               |
| opts.persistent | boolean | When true - store dialog's position |

Example:
```javascript
Dialog.alert('Alert', 'Hello World', {persistent: true})
```
4. Call `Dialog.dragElement(element, header, opts = {})` function to make an element draggable.

| Argument        | Type          | Description                               |
| --------------- | ------------- | ----------------------------------------- |
| element         | object/string | A DOM object (or ID) to be made draggable |
| header          | object/string | A DOM header (or ID) of the element       |
| opts            | object        | Configuration options                     |
| opts.persistent | string        | ID in the localStorage to save position   |

```javascript
// <div id='box'><div id='header'>Title</div> ...</div>
const dlgbox = document.getElementById('box');
const header = document.getElementById('header');
dragElement(dlgbox, header, {persistent: 'my-window-position')
```

## Customization of colors and theming

The library supports creation of custom color themes as well as customization of
the CSS.

To define a new color theme, add a node to `Dialog.Defaults.themes` object that
will represent the new theme.  That node should have `colors` entry, containing
the theme's color variables. The variables are used to set color for different
parts of the dialog.  See `Dialog.Defaults.themes.dark.colors` for an example of
the dark theme.

The following variables are supported:

| Variable Name               | Description |
| --------------------------- | ----------- |
| dlg-title-fg-color          | Title text color |
| dlg-title-bg-color          | Title background color |
| dlg-bg-color                | Dialog background color |
| dlg-body-fg-color           | Dialog body text color |
| dlg-body-bg-color           | Dialog body background color |
| dlg-input-fg-color          | Dialog input text color |
| dlg-input-bg-color          | Dialog input background color |
| dlg-input-outline           | Dialog input outline color |
| dlg-input-outline-focus     | Dialog input focused outline color |
| dlg-btn-border              | Dialog button border |
| dlg-btn-fg-color            | Dialog button text color |
| dlg-btn-bg-color            | Dialog button background color |
| dlg-btn-hover-fg-color      | Dialog button hover text color |
| dlg-btn-hover-bg-color      | Dialog button hover background color |
| dlg-btn-def-fg-color        | Dialog default button text color |
| dlg-btn-def-bg-color        | Dialog default button background color |
| dlg-btn-def-hover-fg-color  | Dialog default button hover text color |
| dlg-btn-def-hover-bg-color  | Dialog default button hover background color |


To customize CSS of a dialog, assign some members of the `Dialog.Defaults.css` object
with your changes.  All entries under `Dialog.Defaults.css` are concatenated and assigned
to the dialog's style.

## For Maintainers

Publishing project to npmjs.com:
```bash
$ make publish
```
