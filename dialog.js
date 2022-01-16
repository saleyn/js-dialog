//============================================================================
// This file defines three variables for creating alerts, prompts, confirms.
//
// E.g. Alert.show("This is a title", "This is the body")
//============================================================================

// Base class (internal)
class AlertBase {
  constructor(element, v, title, body, footer) {
    const winW   = window.innerWidth
    const winH   = window.innerHeight
    element      = element || '#dlg-window'
    this.element = document.querySelector(element)
    if (!this.element)
      throw `Cannot find element with id=${element}!`
    this.element.innerHTML =
      `<div id="dlg-overlay"></div><div id="dlg-box"><div id="dlg-head"></div><div id="dlg-body"></div><div id="dlg-foot"></div></div>`
    const overlay = document.getElementById('dlg-overlay');
    const dlgbox  = document.getElementById('dlg-box');
    if (document.body.style.backgroundColor != '')
      overlay.style.background = window.background
    this.element.style.backgroundColor = 'transparent'
    this.element.style.height  = '100%'
    this.element.style.width   = '100%'
    this.element.style.display = 'block'
    this.element.style.transition = 'all 5s ease-in-out'
    this.oldKeyDown            = document.onkeydown
    document.onkeydown         = (e) => { if (e.keyCode == 27) this.close() }
    overlay.style.height       = winH+"px"
    overlay.style.display      = 'block'
    dlgbox.style.display       = "block"
    const head = `<div id="dlg-top"><div id="dlg-title">${title}</div>
      <div id="dlg-x"><button onclick="${v}.close()">
      <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="18px" height="18px"><path fill="#F44336" d="M21.5 4.5H26.501V43.5H21.5z" transform="rotate(45.001 24 24)"/><path fill="#F44336" d="M21.5 4.5H26.5V43.501H21.5z" transform="rotate(135.008 24 24)"/></svg>
      </button></div>`
    document.getElementById('dlg-head').innerHTML = head
    document.getElementById('dlg-body').innerHTML = body
    document.getElementById('dlg-foot').innerHTML = footer
  }

  invoke = (promptType, action, ...args) => {
    if (typeof action == "function")
      action(...args);
    else if (window[action])
      window[action](...args);
    else
      alert(`${promptType} action not defined!`)
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
// Alert
//-----------------------------------------------------------------------------
function CustomAlert(){
	this.show = (title, body, opts = {}) => {
    this.base = new AlertBase(opts.element, 'Alert',
                              title, body, '<button onclick="Alert.close()">OK</button>')
  }
  this.close = () => this.base.close();
}
const Alert = new CustomAlert();

//-----------------------------------------------------------------------------
// Confirm
//-----------------------------------------------------------------------------
function CustomConfirm(){
	this.show = (title, body, action = undefined, opts = {}) => {
    const foot  = '<button onclick="Confirm.close(true)">Yes</button>\n' +
                  '<button onclick="Confirm.close(false)">No</button>\n'
    this.action = action
    this.opaque = opts.opaque
    this.base   = new AlertBase(opts.element, 'Confirm', title, body, foot)
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
      Object.entries(i).filter((k,_) => k != "label")
                       .map((k,v) => ` ${k}="${v}"`)
                       .join("") + "/>")
    const foot = opts.buttons.map((i, idx) =>
        '<button ' + Object.entries(i).map((k,v) => ` ${k}="${v}"`).join("")
                  + ` onclick="Prompt.close(${idx})">${i.title}</button>\n`)
    this.action   = action
    this.opaque   = opts.opaque
    this.inputs   = opts.inputs
    this.base     = new AlertBase(opts.element, 'Prompt', title, body, foot)
	}
	this.close = (id) => {
		//var prompt_value1 = document.getElementById('prompt_value1').value;
		//window[func](prompt_value1);
    const args    = this.inputs.map(i => {
      const input = document.getElementById(i.id)
      const hasv  = input && input != null && input['value']
      const value = hasv ? input.value : undefined;
      return {id: i.id, value: value}
    })
    this.base.close("Prompt", this.action, id, args, this.opaque)
	}
}
var Prompt = new CustomPrompt();
