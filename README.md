# js-dialog
Custom draggable Alert, Prompt, Confirm dialogs in Javascript

## Author

Serge Aleynikov <saleyn at gmail dot com>

## Building

The following command will produce `dist/dialog.min.*` files to be used in your projects:
```
$ make
```

## Usage

Add this markup to your HTML file. The `div` with `dlg-window` will be the placeholder of
the dialog:
```html
<head>
<link rel="stylesheet" href="dialog.min.css">
<script src="dialog.min.js"></script>
</head>
<body>
...
<div id="dlg-window"></div>
</body>
```

1. To invoke the confirmation dialog, use:
```javascript
Confirm.show(title, body, action, opts = {})
```
| Argument        | Type     | Description                            |
| --------------- | -------- | -----------------------------------    |
| title           | string   | Title of the alert dialog box          |
| body            | string   | InnerHTML of the dialog's body         |
| action          | function | Action `(clickedButtonIndex, [{id: inputID, value: inputVal}]) -> {}` to be called on success |
| opts            | object   | Configuration options                  |
| opts.persistent | boolean  | When true - store dialog's position    |
| opts.buttons    | array    | Array of buttons to be displayed. Default: `[{title: "Ok"}, {title: "Cancel"}]` |
| opts.btnOk      | integer  | Index of the "Ok" button in `opts.buttons` |

Example:
```javascript
Confirm.show("Confirm action?", "Some custom body", (ok) => ok && alert('OK pressed!'))
```

2. To invoke the prompt dialog, use:
```javascript
Prompt.show(title, body, action, opts = {})
```
| Argument        | Type     | Description                            |
| --------------- | -------- | -----------------------------------    |
| title           | string   | Title of the alert dialog box          |
| body            | string   | InnerHTML of the dialog's body         |
| action          | function | Action `(clickedButtonIndex, [{id: inputID, value: inputVal}]) -> {}` to be called on success |
| opts            | object   | Configuration options                  |
| opts.persistent | boolean  | When true - store dialog's position    |
| opts.inputs     | array    | Array of input fields to be displayed. Default: `[{label: "Enter a value", id: "confirm-val"}]` |
| opts.buttons    | array    | Array of buttons to be displayed. Default: `[{title: "Ok"}, {title: "Cancel"}]` |

Example:
```javascript
Prompt.show("Data entry", "Type some text:", (btn_id, input_vals) => btn_id==0 && alert('Entered: ' + inputvals[0].value))
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
Alert.show('Alert', 'Hello World', {persistent: true})
```
4. Call `dragElement(element, header, opts = {})` function to make an element draggable.

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
## Sample illustration of the dialog component in [test.html](https://github.com/saleyn/js-dialog/blob/main/test.html)

https://user-images.githubusercontent.com/272543/149674901-2cec7796-8cdf-4e72-9b04-f8ffdc3ea05f.mp4

