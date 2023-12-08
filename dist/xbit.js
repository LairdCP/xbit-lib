/* version 1.1.0 */

/* globals onMessage vsCodeWebViewBaseUrl acquireVsCodeApi */
/* global dotNetHelper */

let vscode

let baseUrl = '.'

try {
  if (typeof vsCodeWebViewBaseUrl === 'undefined') {
    baseUrl = '.'
  } else {
    vscode = acquireVsCodeApi()
    baseUrl = vsCodeWebViewBaseUrl
  }
} catch (e) {
  baseUrl = '.' // eslint-disable-line no-global-assign
}


// Built in commands
const sendStartBluetoothScanningCommand = async function (active = 0) {
  const command = {
    method: 'startBluetoothScanning',
    params: {
      active
    }
  }
  return xbit.sendCommand(command)
}

const sendStopBluetoothScanningCommand = async function () {
  const command = {
    method: 'stopBluetoothScanning'
  }
  return xbit.sendCommand(command)
}

const sendBluetoothConnectCommand = async function (deviceId) {
  const command = {
    method: 'bluetoothConnect',
    params: {
      deviceId
    }
  }
  return xbit.sendCommand(command)
}

const sendBluetoothDisconnectCommand = async function (deviceId) {
  const command = {
    method: 'bluetoothDisconnect',
    params: {
      deviceId
    }
  }
  return xbit.sendCommand(command)
}

const sendScanFilterResetCommand = async function () {
  const command = {
    method: 'scanFilterReset'
  }
  return xbit.sendCommand(command)
}

const sendScanFilterAddCommand = async function (address, name) {
  const command = {
    method: 'scanFilterAdd',
    params: {
      address,
      name
    }
  }
  return xbit.sendCommand(command)
}

const sendBleGetGattDictionaryCommand = async function () {
  const command = {
    method: 'bleGetGattDictionary'
  }
  return xbit.sendCommand(command)
}

const sendBleSetGattNameCommand = async function (name) {
  const command = {
    method: 'bleSetGattName',
    params: {
      name
    }
  }
  return xbit.sendCommand(command)
}

const sendBleNotifyEnableCommand = async function (name) {
  const command = {
    method: 'bleNotifyEnable',
    params: {
      name
    }
  }
  return xbit.sendCommand(command)
}

const sendBleNotifyDisableCommand = async function (name) {
  const command = {
    method: 'bleNotifyDisable',
    params: {
      name
    }
  }
  return xbit.sendCommand(command)
}

const sendBleWriteCommand = async function (name, value) {
  const command = {
    method: 'bleWrite',
    params: {
      name,
      value
    }
  }
  return xbit.sendCommand(command)
}

const sendCloseAppletCommand = async function () {
  return xbit.sendCommand({
    method: 'closeApplet'
  })
}

const convertPduTypeToJSON = (pduType) => {
  return {
      PI_HAPI_BLE_SCANNER_PDU_TYPE_CONNECTABLE: (pduType & 1) > 0,
      PI_HAPI_BLE_SCANNER_PDU_TYPE_SCANNABLE: (pduType & 2) > 0,
      PI_HAPI_BLE_SCANNER_PDU_TYPE_DIRECTED: (pduType & 4) > 0,
      PI_HAPI_BLE_SCANNER_PDU_TYPE_SCAN_RESPONSE: (pduType & 8) > 0,
      PI_HAPI_BLE_SCANNER_PDU_TYPE_LEGACY: (pduType & 16) > 0,
      PI_HAPI_BLE_SCANNER_PDU_TYPE_EXTENDED: (pduType & 32) > 0
  }
}

// Usage
export class xbit {
  static get baseUrl () {
    return baseUrl
  }

  static selected = {}

  static connected = {}

  static eventListeners = {}

  static commands = []

  static vscode = vscode

  static convertPduType = convertPduTypeToJSON

  static addEventListener = (type, callback = null) => {
    if (typeof type === 'function') {
      callback = type
      type = 'any'
    }

    if (callback === null) {
      return
    }

    if (typeof this.eventListeners[type] === 'undefined') {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(callback)
  }

  static removeEventListener = (type, callback = null) => {
    if (typeof type === 'function') {
      callback = type
      type = 'any'
    }

    if (typeof this.eventListeners[type] === 'undefined') {
      return
    }

    if (callback === null) {
      return
    }
    this.eventListeners[type].splice(this.eventListeners[type].indexOf(callback), 1)
  }

  static sendCommand = function (cmd) { // eslint-disable-line no-unused-vars
    if (!cmd.id) {
      cmd.id = Math.round(Math.random() * 99) + 1
    }

    return new Promise((resolve, reject) => {
      const command = {
        data: cmd,
        reject,
        resolve,
        timeout: setTimeout(() => {
          reject(new Error('timeout'))
          this.commands.splice(this.commands.indexOf(command), 1)
        }, 5000)
      }

      this.commands.push(command)
      if (vscode) {
        vscode.postMessage(cmd)
      } else if (typeof dotNetHelper !== 'undefined') {
        dotNetHelper.invokeMethodAsync(cmd)
      } else {
        window.top.postMessage(cmd, '*')
      }
    })
  }

  static sendStartBluetoothScanningCommand = sendStartBluetoothScanningCommand
  static sendStopBluetoothScanningCommand = sendStopBluetoothScanningCommand
  static sendBluetoothConnectCommand = sendBluetoothConnectCommand
  static sendBluetoothDisconnectCommand = sendBluetoothDisconnectCommand
  static sendCloseAppletCommand = sendCloseAppletCommand
  static sendScanFilterResetCommand = sendScanFilterResetCommand
  static sendScanFilterAddCommand = sendScanFilterAddCommand
  static sendBleGetGattDictionaryCommand = sendBleGetGattDictionaryCommand
  static sendBleSetGattNameCommand = sendBleSetGattNameCommand
  static sendBleNotifyEnableCommand = sendBleNotifyEnableCommand
  static sendBleNotifyDisableCommand = sendBleNotifyDisableCommand
  static sendBleWriteCommand = sendBleWriteCommand

  static _handleMessage = (data) => {
    // check for state event
    if (data.method === 'setSelected') {
      this.selected = data.params.device
    }
    if (data.method === 'connected') {
      // if connected to the selected device
      this.connected[data.params.path] = data.params.device.connected
    }
    if (data.method === 'disconnected') {
      // if connected to the selected device
      this.connected[data.params.path] = data.params.device.connected
    }

    if (typeof onMessage === 'function') {
      onMessage(data)
    }

    if (this.eventListeners[data.method]) {
      this.eventListeners[data.method].forEach(c => c(data))
    }

    if (this.eventListeners.any) {
      this.eventListeners.any.forEach(c => c(data))
    }

    this.commands.find((cmd, i) => {
      if (cmd.data.id === data.id) {
        if (data.error) {
          cmd.reject(data.error)
        } else {
          cmd.resolve(data.result)
        }
        this.commands.splice(this.commands.indexOf(cmd), 1)
        clearTimeout(cmd.timeout)
        return true
      }
      return false
    })
  }

  static hexToInts = (hexString) => {
    const intArray = []
    for (let i = 0; i < hexString.length; i += 2) {
      intArray.push(parseInt(hexString.substr(i, 2), 16))
    }
    return new Uint8Array(intArray)
  }
  
  static toDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }
}

// Events from the backend arrive in this listener
window.addEventListener('message', ({ data }) => {
  xbit._handleMessage(data)
})

/* UI Classes */
/**************/
export class Button {
  constructor (buttonId, message, clickHandler = null) {
    this.button = document.getElementById(buttonId)
    this.button.innerText = message
    if (clickHandler) {
      this.button.addEventListener('click', clickHandler)
    }
  }

  disable () {
    this.button.disabled = true
  }

  enable () {
    this.button.disabled = false
  }
}

export class ToggleButton {
  constructor (buttonId, messageOn, messageOff, iconOn, iconOff, startingState = false) {
    this.button = document.getElementById(buttonId)
    this.state = !startingState
    this.messageOff = messageOff
    this.messageOn = messageOn
    this.iconOff = [].concat(iconOff)
    this.iconOn = [].concat(iconOn)
    this.toggle()
  }

  toggle () {
    this.state = !this.state
    const i = document.createElement('i')
    i.classList.add('mr-2', 'fa-solid')
    if (this.state) {
      this.button.classList.remove('bg-canvas-slate-600')
      this.button.classList.add('bg-canvas-sky-500')
      this.button.innerText = this.messageOn
      i.classList.add(...this.iconOn)
    } else {
      this.button.classList.remove('bg-canvas-sky-500')
      this.button.classList.add('bg-canvas-slate-600')
      this.button.innerText = this.messageOff
      i.classList.add(...this.iconOff)
    }
    this.button.prepend(i)
  }

  setOn () {
    this.state = false
    this.toggle()
  }

  setOff () {
    this.state = true
    this.toggle()
  }

  disable () {
    this.button.disabled = true
  }

  enable () {
    this.button.disabled = false
  }

  getSelectedPort () {
    // ask the parent for the selected devices
    return xbit.sendCommand({
      method: 'getSelectedPort'
    })
  }

  getDevices () {
    // ask the parent for the list of devices
  }
}

export default xbit
