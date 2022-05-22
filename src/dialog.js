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
function dialogInit() {
  const _this = this
  const dlgClassName = 'dlg-window'

  // Base class (internal)
  class AlertBase {
    constructor(ele, v, title, body, footer, oncloseArgs, opts = {}) {
      // (1) Figure out if using dark or light theme mode
      let defMode     = localStorage.getItem(Dialog.Defaults.persistKey)
      if (defMode===null || defMode==="null") defMode = undefined
      const theme     = opts.theme ||
                       (defMode !== undefined                                     ? defMode
                      : document.body.classList.contains("dark-mode")             ? 'dark'
                      : document.body.classList.contains("light-mode")            ? 'light'
                      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark'
                      : 'light')
      const isDark    = theme === 'dark'

      //document.body.classList.toggle('dlg-dark-theme',   isDark)
      //document.body.classList.toggle('dlg-light-theme', !isDark)

      // (2) Save the theme mode
      if (defMode === undefined || (opts.theme != undefined && defMode != opts.theme))
        localStorage.setItem(Dialog.Defaults.persistKey, theme)

      const themeCfg   = Dialog.Defaults.themes[theme]
      if (!themeCfg)     throw new Error(`Invalid dialog theme found for '${opts.theme}': ${theme}`)

      opts.theme       = theme
      opts             = Dialog.deepClone(Dialog.Defaults, opts)

      const dlgWinName = Dialog.Defaults.className
      ele              = (ele || dlgWinName).replace('#', '')
      let i            = Dialog.openDialogs.ids.length
                       ? Dialog.openDialogs.ids[Dialog.openDialogs.ids.length-1].index + 1
                       : 0
      this.id          = i ? `${ele}-${i}` : ele
      this.index       = i

      opts.persistent  = (opts.persistent || false) ? `${this.id}-${v.toLowerCase()}` : undefined
      this.element     = document.getElementById(this.id)
      const rootele    = document.getElementById(ele)

      if (!this.element) {
        this.element   = document.createElement('div');
        (this.index    ? document.getElementById(ele) : document.body).appendChild(this.element);
        this.element.setAttribute('id', this.id);
        this.addedToParent = true
      }
      // In case of nested dialogs don't darken the nested backgrounds
      this.element.style.display   = 'none';
      this.element.innerHTML       = `
        <div id="${this.id}-box"  class="dlg-box">
        <div id="${this.id}-head" class="dlg-head">
        <div id="${this.id}-top"  class="dlg-top"><div class="dlg-title">${title}</div>
        <div id="${this.id}-x"    class="dlg-x">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px" onclick="Dialog.close('${this.id}')" title="Close">
        <path fill="#F44336" d="M21.5 4.5H26.501V43.5H21.5z" transform="rotate(45.001 24 24)"/>
        <path fill="#F44336" d="M21.5 4.5H26.5V43.501H21.5z" transform="rotate(135.008 24 24)"/></svg>
        </div></div></div>
        <div id="${this.id}-body" class="dlg-body"></div>
        <div id="${this.id}-foot" class="dlg-foot"></div></div>`

      if (this.index==0) {
        this.element.style.visibility = 'visible'
        this.element.style.opacity    = '1'
        this.element.classList.add(dlgWinName)
        if (Dialog.Defaults.transition) {
          this.element.classList.add('dlg-fadein')
          this.element.classList.remove('dlg-fadeout')
        }
      }

      this.oldKeyDown    = document.onkeydown
      document.onkeydown = (e) => { if (e.key == 'Escape') this.close() }

      const dlgbox       = document.getElementById(`${this.id}-box`)
      const dlghdr       = document.getElementById(`${this.id}-head`)
      const dlgtop       = document.getElementById(`${this.id}-top`)
      const dlgtit       = document.getElementById(`${this.id}-title`)
      const dlgx         = document.getElementById(`${this.id}-x`)
      const dlgbody      = document.getElementById(`${this.id}-body`)
      const dlgfoot      = document.getElementById(`${this.id}-foot`)
      dlgbody.innerHTML  = body
      dlgfoot.innerHTML  = footer

      const topbox       = document.getElementById(`${dlgWinName}-box`)
      let   top          = topbox ? topbox.offsetTop+this.index*20  : dlgbox.offsetTop
      let   left         = topbox ? topbox.offsetLeft+this.index*20 : dlgbox.offsetLeft

      // Define CSS variables per theme's overrides
      if (this.index == 0) {
        if (!!opts.persistent) {
          try {
            const data = JSON.parse(localStorage.getItem(opts.persistent))
            if (data && data.top)  top  = parseInt(/\d+/.exec(data.top)[0])
            if (data && data.left) left = parseInt(/\d+/.exec(data.left)[0])
          } catch (e) {}
        }

        const colors = Dialog.deepClone(opts.default.colors, themeCfg.colors);
        const css    = `#${dlgWinName} {\n`
                     + Object.entries(colors).map(o => `--${o[0]}: ${o[1]};\n`).join('')
                     + '}\n'
                     // Copy the dark/light CSS theme colors
                     + Object.entries(opts.css)
                             .map(kv => kv[0] == 'window'
                                      ? kv[1].replace("{{ClassName}}", dlgWinName)
                                      : kv[1])
                             .join('\n')
        const styleId = `${this.id}-style`
        let   style   = document.getElementById(styleId)
        if   (style) {
          const styleTheme = style.getAttribute('theme');
          if (styleTheme !== theme) {
            style.remove()
            style = null
          }
        }

        if (!style) {
          style = document.createElement('style');
          style.setAttribute('id',    styleId);
          style.setAttribute('theme', theme);
          style.type      = 'text/css';
          style.innerHTML = css;
          document.getElementsByTagName('head')[0].appendChild(style);
        }
      }

      opts = { persistent: opts.persistent }
      Dialog.dragElement(dlgbox, dlghdr, Object.assign(opts, {top: top, left: left}))
      this.element.style.display = 'block'
      dlgbox.style.display       = 'block'

      Dialog.openDialogs.ids.push({id: this.id, ele: ele, index: this.index, instance: this})

      this.promptType   = v
      this.oncloseArgs  = oncloseArgs
    }

    close = (...cargs) => {
      if (!this.closePending) {
        if (typeof this.oncloseArgs === 'function') {
          this.oncloseArgs(...cargs)
        } else if (window[this.oncloseArgs]) {
          window[this.oncloseArgs](...cargs)
          this.waitForClose = true
        }
      }

      this.closePending = true

      // We have two cases there:
      // 1. The top-most dialog is open, and the oncloseArgs() call returned. Close all stacked
      //    dialogs.
      // 2. A stack of nested dialogs is open (due to the user passing "action" argument
      //    to prompt/confirm, and the top-most is still waiting for user input. Don't close
      //    any dialogs yet. They'll be closed when the top-most dialog is closed.

      if (Dialog.openDialogs.ids.length &&
          Dialog.openDialogs.ids[Dialog.openDialogs.ids.length-1].id === this.id) {
        document.onkeydown = this.oldKeyDown
        // Remove the dialog id from the list of open dialogs
        Dialog.openDialogs.ids.pop()
        this.element.innerHTML = ''

        if (this.id == Dialog.Defaults.className) {
          const remove = this.addedToParent
          const ele    = this.element
          if (Dialog.Defaults.transition) {
            ele.classList.remove('dlg-fadein')
            ele.classList.add('dlg-fadeout')
          }
          setTimeout(() => {
            if (remove)
              ele.parentElement.removeChild(ele)
            else
              ele.style.display  = 'none'
          }, Dialog.Defaults.transition ? 400 : 0)
        } else {
          this.element.style.display = 'none'
          if (this.addedToParent)
            this.element.parentElement.removeChild(this.element)
        }

        delete this

        // Close the next dialog in the stack
        const item = Dialog.openDialogs.ids.length ? Dialog.openDialogs.ids[Dialog.openDialogs.ids.length-1].instance : undefined
        if (item)
          item.close()
      }
    }

    toggleTheme = () => {
      const theme = localStorage.getItem(Dialog.Defaults.persistKey)
      const newTheme = theme == 'dark' ? 'light' : 'dark'
      if (confirm(`Are you sure you want to toggle dialog theme from '${theme}' to '${newTheme}'?`))
        localStorage.setItem(Dialog.Defaults.persistKey, newTheme)
    }
  }

  return {
    Defaults: {
      persistent: false,
      persistKey: 'dlg-theme-mode',
      theme:      'dark',
      className:  dlgClassName,
      transition: true,
      css: {
        window:
         `.{{ClassName}} {
            z-index:    10;
            position:   fixed; top: 0px; left: 0px; height: 100%; width: 100%;
            background-color: var(--dlg-win-bg-color);
          }
          .{{ClassName}}.dlg-fadein  { animation: dlg-fadein  0.5s; }
          .{{ClassName}}.dlg-fadeout { animation: dlg-fadeout 0.5s; }
          @keyframes     dlg-fadein  { 0% { opacity:0; } 100% { opacity:1; } }
          @keyframes     dlg-fadeout { 0% { opacity:1; } 100% { opacity:0; } }

          .dlg-box .dlg-head,
          .dlg-box .dlg-foot {
            -webkit-user-select:none;
            -moz-user-select:-moz-none;
            -ms-user-select:none;
            user-select:none;
          }`,
        //alimation:
        // `@keyframes dlg-fadein  { 0% { opacity: 0; } 100% { opacity: 1; } }
        //  @keyframes dlg-fadeout { 0% { opacity: 1; visibility: 'visible'; } 100% { opacity: 0; visibility: hidden; } }`,
        header:
         `.dlg-box .dlg-top { width: 100%; display: flex; }
          .dlg-box .dlg-top > .dlg-title{ width: 90%; }
          .dlg-box .dlg-top > .dlg-x    { width: 10%; display: flex; justify-content: end; cursor: auto; }
          .dlg-box .dlg-top > .dlg-x > button { background-color: transparent; border: none; padding-left: 3px; }
          .dlg-box .dlg-head{
            font-size:        19px;
            padding:          5px;
            color:            var(--dlg-title-fg-color);
            background-color: var(--dlg-title-bg-color);
            cursor:           move;
          }`,
        body:
         `.dlg-box {
            position:     absolute;
            background:   var(--dlg-bg-color);
            border-radius:3px;
            border:       var(--dlg-border-color);
            top:          50%;
            left:         50%;
            -webkit-transform: translate(-50%, -50%);
            transform:    translate(-50%, -50%);
            width:        550px;
            padding:      5px;
            filter: drop-shadow(0 2px 8px rgb(9 9 9 / 0.5)) drop-shadow(0 4px 10px rgb(9 9 9 / 0.5));
            font-size:    initial;
            font-family:  sans-serif;
          }`,
        dialogBody:
         `.dlg-box .dlg-body{ background: var(--dlg-body-bg-color); padding:20px; color: var(--dlg-body-fg-color); }
          .dlg-box .dlg-body label { padding-left: 0.35rem; }
          .dlg-box .dlg-body input {
           border: none; padding: 0.25rem;
           color: var(--dlg-input-fg-color); background-color: var(--dlg-input-bg-color); outline: var(--dlg-input-outline);
           filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
          }
          .dlg-box .dlg-body input:focus { outline: var(--dlg-input-outline-focus); }`,
        footer:
         `.dlg-box .dlg-foot{ padding: 5px 5px 0px 5px; text-align: right; }
          .dlg-box .dlg-foot button.default {
            color: var(--dlg-btn-def-fg-color);
            background-color: var(--dlg-btn-def-bg-color);
          }
          .dlg-box .dlg-foot button {
            padding:       5px 20px 5px 20px;
            margin:        5px 0px 5px 0px;
            border:        var(--dlg-btn-border);
            border-radius: 3px;
            color:         var(--dlg-btn-fg-color);
            background-color: var(--dlg-btn-bg-color);
          }
          .dlg-box .dlg-foot button:active {
            filter: drop-shadow(1px 2px 2px rgb(0 0 0 / 0.5));
          }
          .dlg-box .dlg-foot button:hover {
            color:            var(--dlg-btn-hover-fg-color);
            background-color: var(--dlg-btn-hover-bg-color);
          }`,
      },

      default: {
        colors: {
          'dlg-win-bg-color':    'rgba(10,10,10,0.6)',
          'dlg-border-color':    'none',
          'dlg-footer-fg-color': '#CCC',
          'dlg-footer-bg-color': '#444',
          'dlg-btn-fg-color':    'black',
        }
      },
      themes: {
        dark: {
          colors: {
            'dlg-title-fg-color':         '#c6c6cf',
            'dlg-title-bg-color':         '#2e2f3a',
            'dlg-bg-color':               '#2e2f3a',
            'dlg-body-fg-color':          '#9797a2',
            'dlg-body-bg-color':          '#2e2f3a',
            'dlg-input-fg-color':         '#e4e6ea',
            'dlg-input-bg-color':         '#444452',
            'dlg-input-outline':          'none',
            'dlg-input-outline-focus':    '1px solid #649ad5',
            'dlg-btn-border':             '1px solid #649ad5',
            'dlg-btn-fg-color':           '#649ad5',
            'dlg-btn-bg-color':           '#444452',
            'dlg-btn-hover-fg-color':     'white',
            'dlg-btn-hover-bg-color':     '#88c1ff',
            'dlg-btn-def-fg-color':       '#2e2f3a',
            'dlg-btn-def-bg-color':       '#649ad5',
            'dlg-btn-def-hover-fg-color': 'white',
            'dlg-btn-def-hover-bg-color': '#88c1ff',
          },
        },
        light: {
          colors: {
            'dlg-title-fg-color':     '#636363',
            'dlg-title-bg-color':     '#f2f3f7',
            'dlg-bg-color':           '#f2f3f7',
            'dlg-body-fg-color':      '#636363',
            'dlg-body-bg-color':      '#f2f3f7',
            'dlg-input-fg-color':     '#636363',
            'dlg-input-bg-color':     'white',
            'dlg-input-outline':      '1px solid #d7d7d7',
            'dlg-input-outline-focus':'1px solid #649ad5',
            'dlg-btn-border':             '1px solid #649ad5',
            'dlg-btn-fg-color':           '#649ad5',
            'dlg-btn-bg-color':           'white',
            'dlg-btn-active-bg-color':    'blue',
            'dlg-btn-hover-fg-color':     'white',
            'dlg-btn-hover-bg-color':     '#88c1ff',
            'dlg-btn-def-fg-color':       '#EEE',
            'dlg-btn-def-bg-color':       '#649ad5',
            'dlg-btn-hover-border':       '1px solid blue',
            'dlg-btn-def-hover-fg-color': 'white',
            'dlg-btn-def-hover-bg-color': '#88c1ff',
          },
        }
      },
    },

    openDialogs: {ids: []},

    close: (id, ...args) => {
      if (Dialog.openDialogs.ids.length == 0) return
      const item = id != undefined
                 ? Dialog.openDialogs.ids.find(x => x.id === id)
                 : Dialog.openDialogs.ids[Dialog.openDialogs.ids.length-1]
      if (item !== undefined)
        item.instance.close(...args)
      else
        throw new Error(`Cannot find Dialog with id=${id}`)
    },

    //------------------------------------------------------------------------------
    // Deep merge of obj and override objects (returns the merged object, without
    // modifying objects passed in arguments
    //------------------------------------------------------------------------------
    deepClone: (obj, override = undefined, filterKeys = () => true) => {
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
    },

    //-----------------------------------------------------------------------------
    // Make an element with the header item draggable around the browser window
    //-----------------------------------------------------------------------------
    // element - element to be dragged
    // header  - header element that activates dragging action
    //-----------------------------------------------------------------------------
    dragElement: (element, header, opts = {}) => {
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
    },

    //-----------------------------------------------------------------------------
    // Alert
    //-----------------------------------------------------------------------------
    alert: (title, body, action, opts = {}) =>
      new AlertBase(opts.element, 'Alert', title, body,
                    `<button class="default" onclick="Dialog.close(${opts.element})">OK</button>`,
                    typeof action == 'object' ? action.action : action, // On close action
                    typeof action == 'object' ? action        : opts),

    //-----------------------------------------------------------------------------
    // Confirm
    //-----------------------------------------------------------------------------
    confirm: (title, body, action, opts = {}) => {
      if (typeof action == 'object') {
        opts   = action
        action = opts.action
      }
      const btns    = opts.buttons || [{title: "Ok"}, {title: "Cancel"}]
      const okbtn   = opts.btnOk   || 0
      const defbtn  = opts.defbtn  || 0
      const foot    = btns.map((b,idx) => {
        const keys  = Object.keys(b).filter(k => k != 'value')
        return `<button${defbtn==idx ? ' class="default"':''} onclick="Dialog.close(${opts.element}, ${idx == okbtn})"` +
          keys.map(k => ` ${k}=${b[k]}`).join('') +
          `>${b.value ? b.value: b.title}</button>\n`
      }).join('')
      return new AlertBase(opts.element, 'Confirm', title, body, foot, action, opts)
    },

    //-----------------------------------------------------------------------------
    // Prompt
    //-----------------------------------------------------------------------------
    prompt: (title, body, action, opts = {}) => {
      if (typeof action == 'object') {
        opts   = action
        action = opts.action
      }
      const inputs  = opts.inputs  || [{label: "Enter a value", id: "value"}]
      const buttons = opts.buttons || [{title: "Ok"}, {title: "Cancel"}]
      const defBtn  = opts.defbtn  || 0
      const dlgId   = opts.element
      body += inputs.map((i,idx) =>
        `<label for="${i.id}" text="${i.label}"/><input id="${i.id}"` +
        Object.keys(i).filter(k => k != "label")
                      .map(k => ` ${k}="${i[k]}"`)
                      .join('') + ">").join('')
      const foot = buttons.map((i, idx) =>
        `<button ${idx==defBtn ? " class='default'":""}` +
        Object.keys(i)
              .filter(k => k != 'value')
              .map(k => ` ${k}="${i[k]}"`)
              .join("") +
          ` onclick="Dialog.close(${dlgId}, ${idx})">${i.value ? i.value : i.title}</button>\n`).join('')
      const   onclose = (btnIdx) => {
        const    args = inputs.map(i => {
          const input = document.getElementById(i.id)
          const  hasv = input && input != null && input['value']
          const value = hasv ? input.value : undefined;
          return {id: i.id, value: value}
        })
        const     res = {ok: btnIdx == defBtn, button: btnIdx, values: args}
        return (typeof action === 'function')           ? action(res)
             : (action !== undefined && window[action]) ? window[action](res)
             : res
      }

      return new AlertBase(dlgId, 'Prompt', title, body, foot, onclose, opts)
    }
  }
}

const Dialog = dialogInit()
export default Dialog
window.Dialog = Dialog
