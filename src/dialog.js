//============================================================================
// This file defines three variables for creating alerts, prompts, confirms.
//
// E.g. Alert.show("This is a title", "This is the body")
//
// Author: Serge Aleynikov <saleyn at gmail dot com>
//============================================================================

//------------------------------------------------------------------------------
// Default dialog options
//------------------------------------------------------------------------------
const DialogDefaults = {
  persistent:        false,
  debug:             true,
  theme:             "dark",
  classes:  {
    window: [],
    dialog: [],
    header: [],
    body:   [],
    footer: [],
  },
  window: {
    zIndex:          10,
    top:             "0px",
    left:            "0px",
    height:          "100%",
    width:           "100%",
    position:        "fixed",
  },
  dialog: {
    borderRadius:    "5px",
    width:           "550px",
    padding:         "5px",
    position:        "absolute",
    top:             "50%",
    left:            "50%",
    webkitTransform: "translate(-50%, -50%)",
    filter:          "drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))",
  },
  header: {
    fontSize:        "19px",
    padding:         "5px",
    cursor:          "move",
    display:         "flex",
  },
  body: {
    padding:         "20px",
  },
  footer: {
    padding:         "5px 5px 0px 5px",
    textAlign:       "right",
  },
  themes: {
    dark: {
      classes:  {
        window: [],
        dialog: [],
        header: [],
        body:   [],
        footer: [],
      },
      css: `#dlg-box #dlg-foot button:hover {
              --tw-text-opacity: 1;
              box-shadow: #CCC;
              background-color: rgba(96, 165, 250, var(--tw-text-opacity));
            }`,
      window: {
        backgroundColor: "rgba(10,10,10,0.6)",
      },
      dialog: {
        background:      "#444",
      },
      header: {
        color:           "#CCC",
      },
      body: {
        background:      "#333",
        color:           "#FFF",
      },
      footer: {
      },
    },
    light: {
    }
  },
}

//------------------------------------------------------------------------------
// Deep merge of obj and override objects (returns the merged object, without
// modifying objects passed in arguments
//------------------------------------------------------------------------------
Object.prototype.deepClone = (obj, override = undefined, filterKeys = () => true) => {
  let res = {}

  function doMerge(dst, src, path) {
    for (const [key, val] of Object.entries(src)) {
      if (!filterKeys(path, key)) continue

      if (Array.isArray(val)) {
        dst[key] = val.slice()  // Clone the array
        continue
      } else if (val === null || typeof val !== "object") {
        dst[key] = val
        continue
      }

      if (dst[key] === undefined)
        dst[key] = new val.__proto__.constructor();

      const p = [...path, key]
      doMerge(dst[key], val, p);
    }
  }
  doMerge(res, obj,      [])
  if (override !== undefined)
    doMerge(res, override, [])
  return res
}

// Base class (internal)
class AlertBase {
  constructor(ele, v, title, body, footer, opts = {}) {
    opts            = Object.deepClone(DialogDefaults, opts, (path, key) => !(path==[] && key=='themes'))
    ele             = ele || '#dlg-window'
    this.id         = ele.replace("#","")
    const theme     = DialogDefaults.themes[opts.theme || 'dark']
    if (!theme)       throw new Error(`Invalid dialog theme '${opts.theme}'`)

    if (opts.window === undefined) opts.window = {}
    if (opts.dialog === undefined) opts.dialog = {}
    if (opts.header === undefined) opts.header = {}
    if (opts.body   === undefined) opts.body   = {}
    if (opts.footer === undefined) opts.footer = {}

    opts.persistent = (opts.persistent || false) ? `${this.id}-${v.toLowerCase()}` : undefined
    this.element = document.querySelector(ele)
    if (!this.element) {
      this.element = document.createElement('div')
      this.element.setAttribute('id', this.id)
    }
    this.element.innerHTML = `
      <div id="dlg-box">
      <div id="dlg-head">
      <div id="dlg-top"><div id="dlg-title">${title}</div>
      <div id="dlg-x"><button id="dlg-xb" onclick="${v}.close()">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
      <path fill="#F44336" d="M21.5 4.5H26.501V43.5H21.5z" transform="rotate(45.001 24 24)"/>
      <path fill="#F44336" d="M21.5 4.5H26.5V43.501H21.5z" transform="rotate(135.008 24 24)"/></svg>
      </button></div></div>
      <div id="dlg-body"></div>
      <div id="dlg-foot"></div></div>`
    this.element.style.display = opts.debug ? 'block' : 'none';
    Object.assign(this.element.style, opts.window)
    Object.assign(this.element.style, theme.window)

    this.oldKeyDown    = document.onkeydown
    document.onkeydown = (e) => { if (e.keyCode == 27) this.close() }

    if (this.element.style.styleSheet === undefined)
      this.element.style.styleSheet = {}

    //document.getElementsByTagName('head')[0].appendChild(style);

    const dlgbox      = document.getElementById('dlg-box');
    const dlghdr      = document.getElementById('dlg-head');
    const dlgtop      = document.getElementById('dlg-top');
    const dlgtit      = document.getElementById('dlg-title');
    const dlgx        = document.getElementById('dlg-x');
    const dlgxb       = document.getElementById('dlg-xb');
    const dlgbody     = document.getElementById('dlg-body')
    const dlgfoot     = document.getElementById('dlg-foot')
    dlgbody.innerHTML = body
    dlgfoot.innerHTML = footer

    const labels = dlgbody.getElementsByTagName('label')
    for (let i=0; i<labels.length; ++i) {
      let l = labels.item(i)
      l.style.paddingLeft= "0.25rem"
      l.style.marginRight= "0.25rem"
    }
    let buttons = dlgfoot.getElementsByTagName('button')
    for (let i=0; i<buttons.length; ++i) {
      let b = buttons.item(i)
        b.style.padding=     "5px 20px 5px 20px"
        b.style.margin=      "5px 0px 5px 0px"
        b.style.border=      "transparent"
        b.style.borderRadius="3px"
      }

    // Add classes from opts.classes or theme.classes
    const items = [
     {'window': this.element},
     {'dialog': dlgbox},
     {'header': dlghdr},
     {'body':   dlgbody},
     {'footer': dlgfoot}
    ]
    items.forEach(x => {
      const k       = Object.keys(x)[0]
      const classes = (Array.isArray(theme.classes[k]) && theme.classes[k].length > 0)
                    ? theme.classes[k]
                    : (Array.isArray(opts.classes[k]) && opts.classes[k].length > 0)
                    ? opts.classes[k]
                    : []
      if (classes.length)
        x[k].classList.add([...classes])
    })

    Object.assign(dlgbox.style,  opts.dialog)
    Object.assign(dlgbox.style,  theme.dialog)

    const userSelect = {
      userSelect:      "none",
      webkitUserSelect:"none",
      mizUserSelect:   "none",
      msUserSelect:    "none",
    }
    Object.assign(dlgtop.style,  userSelect)
    Object.assign(dlgtop.style,  opts.header)
    Object.assign(dlgtop.style,  theme.header)
    Object.assign(dlgbody.style, opts.body)
    Object.assign(dlgbody.style, theme.body)
    Object.assign(dlgfoot.style, userSelect)
    Object.assign(dlgfoot.style, opts.footer)
    Object.assign(dlgfoot.style, theme.footer)

    dlgtit.style.width          = "95%"
    dlgx.style.width            =  "5%"
    dlgxb.style.backgroundColor = "transparent"
    dlgxb.style.border          = "none"

    let top  = dlgbox.offsetTop
    let left = dlgbox.offsetLeft

    if (!!opts.persistent) {
      try {
        const data = JSON.parse(localStorage.getItem(opts.persistent))
        if (data && data.top)  top  = parseInt(/\d+/.exec(data.top)[0])
        if (data && data.left) left = parseInt(/\d+/.exec(data.left)[0])
      } catch (e) {}
    }

    const css = opts.css || theme.css
    if (css !== undefined) {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = css;
      document.getElementsByTagName('head')[0].appendChild(style);
    }

    opts = { persistent: opts.persistent }
    dragElement(dlgbox, dlghdr, Object.assign(opts, {top: top, left: left}))
    this.element.style.display = 'block'
    dlgbox.style.display       = 'block'
  }

  invoke = (promptType, action, ...args) => {
    if (typeof action == "function")
      action(...args);
    else if (window[action])
      window[action](...args);
    else
      throw(`${promptType} action not defined!`)
  }

  close = (promptType, ...args) => {
    if (args.length)
      this.invoke(promptType, ...args)
    this.element.style.display = 'none';
    this.element.innerHTML = '';
    document.onkeydown = this.oldKeyDown
  }
}

//-----------------------------------------------------------------------------
// Make an element with the header item draggable around the browser window
//-----------------------------------------------------------------------------
// element - element to be dragged
// header  - header element that activates dragging action
//-----------------------------------------------------------------------------
function dragElement(element, header, opts = {}) {
  const element0 = element
  const header0  = header
  if (typeof element == "string") element = document.getElementById(element)
  if (typeof header  == "string") header  = document.getElementById(header)

  if (element == undefined || typeof element != "object") throw(`Cannot find element: ${element}`)
  if (header  == undefined || typeof element != "object") throw(`Cannot find header:  ${header}`)

  const dragMouseDown = (e) => {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup   = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  const setPosition = (t, l) => {
    const h = element.offsetHeight / 2;
    const w = element.offsetWidth  / 2;
    element.style.top  = Math.max(h, Math.min(t, window.innerHeight-h)) + "px";
    element.style.left = Math.max(w, Math.min(l, window.innerWidth -w)) + "px";
  }

  const elementDrag = (e) => {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    setPosition(element.offsetTop - pos2, element.offsetLeft - pos1);
  }

  const closeDragElement = () => {
    // stop moving when mouse button is released:
    document.onmouseup   = null;
    document.onmousemove = null;

    if (!!opts.persistent)
      localStorage.setItem(opts.persistent,
        JSON.stringify({ top: element.offsetTop, left: element.offsetLeft }))
  }

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;

  if (opts.top || opts.left)
    setPosition(opts.top, opts.left)
}

//-----------------------------------------------------------------------------
// Alert
//-----------------------------------------------------------------------------
function CustomAlert() {
	this.show = (title, body, opts = {}) =>
      this.base = new AlertBase(opts.element, 'Alert', title, body,
                                '<button onclick="Alert.close()">OK</button>',
                                opts)
  this.close = () => this.base.close()
}

const Alert = new CustomAlert()

//-----------------------------------------------------------------------------
// Confirm
//-----------------------------------------------------------------------------
function CustomConfirm() {
	this.show = (title, body, action = undefined, opts = {}) => {
    const btns  = opts.buttons || [{title: "Ok"}, {title: "Cancel"}]
    const okbtn = opts.btnOk   || 0
    const foot  = btns.map((b,idx) => {
      const keys = Object.keys(b).filter(k => k != 'value')
      return `<button onclick="Confirm.close(${idx == okbtn})"` +
             keys.map(k => ` ${k}=${b[k]}`).join('') +
             `>${b.value ? b.value: b.title}</button>\n`
    }).join('')
    this.action = action
    this.opaque = opts.opaque
    this.base   = new AlertBase(opts.element, 'Confirm', title, body, foot, opts)
    return this.base
  }
	this.close = (success) =>
    this.base.close("Confirm", this.action, success, this.opaque)
}
const Confirm = new CustomConfirm();

//-----------------------------------------------------------------------------
// Prompt
//-----------------------------------------------------------------------------
function CustomPrompt() {
  this.show = (title, body, action, opts = {}) => {
    this.inputs  = opts.inputs  || [{label: "Enter a value", id: "confirm-val"}]
    this.buttons = opts.buttons || [{title: "Ok"}, {title: "Cancel"}]
    body += this.inputs.map(i =>
      `<label for="${i.id}" text="${i.label}"/><input id="${i.id}"` +
      Object.keys(i).filter(k => k != "label")
                    .map(k => ` ${k}="${i[k]}"`)
                    .join('') + ">").join('')
    const foot = this.buttons.map((i, idx) =>
      '<button ' +
      Object.keys(i)
            .filter(k => k != 'value').map(k => ` ${k}="${i[k]}"`).join("") +
      ` onclick="Prompt.close(${idx})">${i.value ? i.value : i.title}</button>\n`).join('')
    this.action   = action
    this.opaque   = opts.opaque
    this.base     = new AlertBase(opts.element, 'Prompt', title, body, foot, opts)
    return this.base
	}
	this.close = (id) => {
    const args    = this.inputs.map(i => {
      const input = document.getElementById(i.id)
      const hasv  = input && input != null && input['value']
      const value = hasv ? input.value : undefined;
      return {id: i.id, value: value}
    })
    this.base.close("Prompt", this.action, id, args, this.opaque)
	}
}
const Prompt = new CustomPrompt();

// Add exports
if (exports === undefined)
  var exports = {}

exports.DialogDefaults  = DialogDefaults
exports.Alert           = Alert
exports.Confirm         = Confirm
exports.Prompt          = Prompt
exports.dragElement     = dragElement
