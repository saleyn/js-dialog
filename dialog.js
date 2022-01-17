//============================================================================
// This file defines three variables for creating alerts, prompts, confirms.
//
// E.g. Alert.show("This is a title", "This is the body")
//
// Author: Serge Aleynikov <saleyn at gmail dot com>
//============================================================================

// Default dialog options
const DialogDefaults = { persistent: false }

// Base class (internal)
class AlertBase {
  constructor(ele, v, title, body, footer, opts = {}) {
    opts = Object.assign(DialogDefaults, opts)
    const winH      = window.innerHeight
    ele             = ele || '#dlg-window'
    opts.persistent = (opts.persistent || false) ? `${ele.replace("#","")}-${v.toLowerCase()}` : undefined
    this.element = document.querySelector(ele)
    if (!this.element)
      throw `Cannot find element with id=#${ele}!`
    this.element.innerHTML =
      `<div id="dlg-overlay"></div><div id="dlg-box"><div id="dlg-head"></div><div id="dlg-body"></div><div id="dlg-foot"></div></div>`
    const overlay = document.getElementById('dlg-overlay');
    const dlgbox  = document.getElementById('dlg-box');
    if (document.body.style.backgroundColor != '')
      overlay.style.background = window.background
    this.element.style.backgroundColor = 'transparent'
    this.element.style.height          = '100%'
    this.element.style.width           = '100%'
    this.element.style.display         = 'block'
    this.oldKeyDown                    = document.onkeydown
    document.onkeydown                 = (e) => { if (e.keyCode == 27) this.close() }
    overlay.style.height               = winH+"px"
    overlay.style.display              = 'block'
    dlgbox.style.display               = "block"
    const head =
     `<div id="dlg-top"><div id="dlg-title">${title}</div>
      <div id="dlg-x"><button onclick="${v}.close()">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
      <path fill="#F44336" d="M21.5 4.5H26.501V43.5H21.5z" transform="rotate(45.001 24 24)"/>
      <path fill="#F44336" d="M21.5 4.5H26.5V43.501H21.5z" transform="rotate(135.008 24 24)"/>
      </svg></button></div>`
    const header = document.getElementById('dlg-head');
    header.innerHTML = head
    document.getElementById('dlg-body').innerHTML = body
    document.getElementById('dlg-foot').innerHTML = footer

    if (!!opts.persistent) {
      try {
        const data = JSON.parse(localStorage.getItem(opts.persistent))
        if (data && data.top)  dlgbox.style.top  = data.top
        if (data && data.left) dlgbox.style.left = data.left
      } catch (e) {}
    }

    opts = { persistent: opts.persistent }
    dragElement(dlgbox, header, opts)
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
    //document.getElementById('dlg-box').style.display = "none";
    //document.getElementById('dlg-overlay').style.display = "none";
    this.element.style.display = 'none';
    if (args.length)
      this.invoke(promptType, ...args)
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

  const elementDrag = (e) => {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    element.style.top  = (element.offsetTop  - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  const closeDragElement = () => {
    // stop moving when mouse button is released:
    document.onmouseup   = null;
    document.onmousemove = null;

    if (!!opts.persistent)
      localStorage.setItem(opts.persistent,
        JSON.stringify({ top: element.style.top, left: element.style.left }))
  }

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;
}

//-----------------------------------------------------------------------------
// Alert
//-----------------------------------------------------------------------------
function CustomAlert() {
	this.show = (title, body, opts = {}) =>
      this.base = new AlertBase(opts.element, 'Alert', title, body,
                                '<button onclick="Alert.close()">OK</button>', opts)
  this.close = () => this.base.close()
}

const Alert = new CustomAlert()

//-----------------------------------------------------------------------------
// Confirm
//-----------------------------------------------------------------------------
function CustomConfirm() {
	this.show = (title, body, action = undefined, opts = {}) => {
    const foot  = '<button onclick="Confirm.close(true)">Yes</button>\n' +
                  '<button onclick="Confirm.close(false)">No</button>\n'
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
  this.show = (title, body, action, opts = {
                inputs:  [{label: "Enter a value", id: "confirm-val"}],
                buttons: [{title: "Ok"}, {title: "Cancel"}]
              }) =>
  {
    body += opts.inputs.map(i =>
      `<label for="${i.id}" text="${i.label}"/><input id="${i.id}"` +
      Object.keys(i).filter(k => k != "label")
                    .map(k => ` ${k}="${i[k]}"`)
                    .join("") + ">")
    const foot = opts.buttons.map((i, idx) =>
      '<button ' +
      Object.keys(i)
            .filter(k => k != 'value').map(k => ` ${k}="${i[k]}"`).join("") +
      ` onclick="Prompt.close(${idx})">${i.value ? i.value : i.title}</button>\n`)
    this.action   = action
    this.opaque   = opts.opaque
    this.inputs   = opts.inputs
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

//export { Alert, Confirm, Prompt, dragElement }
