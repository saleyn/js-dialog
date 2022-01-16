# js-dialog
Custom Alert, Prompt, Confirm dialogs in Javascript

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
```
Confirm.show("Confirm action?", "Some custom body", (ok) => ok && alert('OK pressed!'))
```
2. To invoke the prompt dialog, use:
```
Prompt.show("Data entry", "Type some text:", (btn_id, input_vals) => btn_id==0 && alert('Entered: ' + inputvals[0].value))
```
3. To display the alert dialog, do:
```
Alert.show('Alert', 'Hello World')
```
