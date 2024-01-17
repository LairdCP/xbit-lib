/* version 1.1.0 */

/* globals onMessage vsCodeWebViewBaseUrl acquireVsCodeApi */
/* global dotNetHelper */

let vscode
let dotNet = false
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

if (typeof dotNetHelper !== 'undefined') {
  dotNet = true
}


// Built in commands
const sendStartBluetoothScanningCommand = async function (params = {}) {
  const command = {
    method: 'startBluetoothScanning',
    params
  }
  return xbit.sendCommand(command)
}

const sendStopBluetoothScanningCommand = async function () {
  const command = {
    method: 'stopBluetoothScanning'
  }
  return xbit.sendCommand(command)
}

const sendBluetoothConnectCommand = async function (params = {}) {
  const command = {
    method: 'bluetoothConnect',
    params
  }
  return xbit.sendCommand(command)
}

const sendBluetoothDisconnectCommand = async function () {
  const command = {
    method: 'bluetoothDisconnect',
  }
  return xbit.sendCommand(command)
}

const sendScanFilterResetCommand = async function () {
  const command = {
    method: 'scanFilterReset'
  }
  return xbit.sendCommand(command)
}

const sendScanFilterAddCommand = async function (params = {}) {
  const command = {
    method: 'scanFilterAdd',
    params
  }
  return xbit.sendCommand(command)
}

const sendBleGetGattDictionaryCommand = async function (params = {}) {
  const command = {
    method: 'bleGetGattDictionary',
    params
  }
  return xbit.sendCommand(command)
}

const sendBleSetGattNameCommand = async function (params = {}) {
  const command = {
    method: 'bleSetGattName',
    params
  }
  return xbit.sendCommand(command)
}

const sendBleNotifyEnableCommand = async function (params = {}) {
  const command = {
    method: 'bluetoothSubscribeCharacteristic',
    params
  }
  return xbit.sendCommand(command)
}

const sendBleNotifyDisableCommand = async function (params = {}) {
  const command = {
    method: 'bleNotifyDisable',
    params
  }
  return xbit.sendCommand(command)
}

const sendBleWriteCommand = async function (params = {}) {
  const command = {
    method: 'bluetoothWriteRequest',
    params
  }
  return xbit.sendCommand(command)
}

const sendCloseAppletCommand = async function () {
  return xbit.sendCommand({
    method: 'closeApplet'
  })
}

const sendToast = async function ({ message, type = 'info', options = {} }) {
  xbit.sendCommand({
    method: 'callStoreMethod',
    params: {
      store: 'notificationStore',
      method: type === 'info' ? 'setNotif' : 'setError',
      args: [message, options]
    }
  })
}

const sendClearToast = async function () {
  xbit.sendCommand({
    method: 'callStoreMethod',
    params: {
      store: 'notificationStore',
      method: 'clear',
      args: []
    }
  })
}

const sendFilePickerCommand = async function () {
  if (dotNet) {
    return xbit.sendCommand({
      method: 'filePickerRequest'
    })
  }
}

export const convertPduTypeToJSON = (pduType) => {
  return {
    connectable: (pduType & 1) > 0,
    scannable: (pduType & 2) > 0,
    directed: (pduType & 4) > 0,
    scanResponse: (pduType & 8) > 0,
    legacy: (pduType & 16) > 0,
    extended: (pduType & 32) > 0
  }
}

export const rangingFlagsToJSON = (flags) => {
  return {
    configured: (flags & 1) > 0,
    anchor: (flags & 2) > 0,
    canScan: (flags & 4) > 0,
    isResponder: (flags & 8) > 0,
    activeRangingSession: (flags & 16) > 0,
    hasCoarsePosition: (flags & 32) > 0,
    hasFinePosition: (flags & 64) > 0,
  }
}

export function hexToBytes (hexString) {
  return Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}


export function bytesToHex (bytes) {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

export function parseLtvs (fullAd) {
  const map = {}
  let i = 0

  fullAd = fullAd.toLowerCase()

  while (i < fullAd.length) {
    const tlen = parseInt(fullAd.substr(i, 2), 16)
    if (tlen <= 0) {
      return map
    }
    const t = fullAd.substr(i + 2, 2)
    const v = hexToBytes(fullAd.substr(i + 4, (tlen-1) * 2))
    if (map[t]) {
      map[t].push(v)
    } else {
      map[t] = [v]
    }
    i += 2 + tlen * 2
  }
  return map
}

export function hasLtv (ltvTypeStr, dataPrefix, ltvMap) {
  if (ltvMap[ltvTypeStr]) {
    return ltvMap[ltvTypeStr].find((v) => {
      if (v) {
        for (let i = 0; i < dataPrefix.length; i++) {
          if (v[i] !== dataPrefix[i]) {
            return false
          }
        }
        return true
      }
    })
  } else {
    return false
  }
}

const scanConstants = {
  LAIRD_COMPANY_ID: 0x0077
}

export function parseManufacturerData (adData) {
  //                                               L  T  Value
  // ----------------------------------------------------------------------------------------------
  //                                        Flags: 02 01 06
  //                          Complete Local Name: 07 09 43616E766173
  // Complete List of 128-bit Service Class UUIDS: 11 07 84AA6074528A8B86D34CB71D1DDC538D
  //
  // Canvas BLE Ad Format, can appear in scan response or advertising data:
  //                                                     Company ID
  //                                                     |    Protocol ID
  //                                                     |    |    Product ID
  //                                                     |    |    |    Firmware Type
  //                                                     |    |    |    |  Version (Major.Minor.Patch)
  //                                                     |    |    |    |  |      Configuration version
  //                                                     |    |    |    |  |      |  Network ID
  //                                                     |    |    |    |  |      |  |    Device ID
  //                                                     |    |    |    |  |      |  |    |
  //                   Manufacturer Specific Data: 16 FF 7700 0D00 0000 00 000161 00 0000 FA4DCF83CEC85BC5
  const retval = []
  adData.forEach((data, index) => {
    let t = {}
    const dataView = new DataView(data.buffer)
    if (dataView.getUint16(0, true) == scanConstants.LAIRD_COMPANY_ID && dataView.getUint16(2, true) == 13) {
      t.companyId = dataView.getUint16(0, true)
      t.protocolId = dataView.getUint16(2, true)
      t.productId = dataView.getUint16(4, true)
      t.firmwareType = dataView.getUint8(6)
      t.firmwareVersion = dataView.getUint8(7) + '.' + dataView.getUint8(8) + '.' + dataView.getUint8(9)
      t.configVersion = dataView.getUint8(10)
      t.networkId = dataView.getUint16(11, true)
      t.deviceAddress = bytesToHex(data.slice(13))
    }
    if (dataView.getUint16(0, true) == scanConstants.LAIRD_COMPANY_ID && dataView.getUint16(2, true) == 12) {
      t.companyId = dataView.getUint16(0, true)
      t.protocolId = dataView.getUint16(2, true)
      t.networkId = dataView.getUint16(4, true)
      t.flags = rangingFlagsToJSON(dataView.getUint16(6, true))
      t.longAddr = bytesToHex(data.slice(8, 16))
      t.shortAddr = t.longAddr.substring(12, 16)
      t.timestamp = dataView.getUint32(16, true)

      t.rangingData = []
      for (let i = 20; i < dataView.byteLength;) {
        const record = {
          type: dataView.getUint8(i),
          len: dataView.getUint8(i + 1)
        }
        record.bytes = data.slice(i + 2, i + 2 + record.len)
        if (record.type === 0) {
          record.dist = (record.bytes[2] << 8) | record.bytes[3]
          record.range = bytesToHex(record.bytes.slice(0, 2))
        } else if (record.type === 10) {
          record.color = [(record.bytes[0] * 10) % 255, (record.bytes[1] * 10) % 255, (record.bytes[2] * 10) % 255]
        }
        i += record.len
        if (record.len <= 0) {
          break
        }    
        t.rangingData.push(record)
      }
    }
    retval.push(t)
  })
  return retval
}

// device.ad is an uint8 array
export class DiscoveredDevice {
  constructor (device) {
    this.address = device.deviceAddress
    this.ltvMap = {}
    this.update(device)
  }

  get isCanvas () {
    return this.parsedAd && 
      this.parsedAd.companyId === scanConstants.LAIRD_COMPANY_ID &&
      this.parsedAd.protocolId === 13
  }

  update (device) {
    try {
      this.ad = device.ad
      this.name = device.name || null
      this.rssi = device.rssi
      const hexAd = bytesToHex(this.ad)

      this.ltvMap = Object.assign(this.ltvMap, parseLtvs(hexAd))
      if (this.ltvMap.ff) {
        parseManufacturerData(this.ltvMap.ff).forEach((data) => {
          this.parsedAd = Object.assign(this.parsedAd || {}, data)
        })
      }
      this.pduType = convertPduTypeToJSON(device.pduType)
    } catch (e) {
      console.error(e)
    }
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

  static formatAddress = (address) => {
    if (!address) {
      return '?'
    }
    let formatted = address
    // if address looks like a whatever this is in Android
    if (/^[0-9a-f]{7}-[0-9a-f]{2}-[0-9a-f]{6}-[0-9a-f]{2}-[0-9a-f]{13}$/.test(address)) {
      // use the last 12 bytes
      formatted = formatted.substr(-12)
    }

    // split the address by 2 characters
    const split = formatted.match(/.{1,2}/g)
    split.reverse()
    split.pop()
    // join the split address
    return split.join('')
  }

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
          reject(new Error(`xbit-lib: sendCommand timeout ${cmd.method}:${cmd.id}`))
          this.commands.splice(this.commands.indexOf(command), 1)
        }, 5000)
      }

      this.commands.push(command)
      if (vscode) {
        vscode.postMessage(cmd)
      } else if (dotNet) {
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
  static sendToast = sendToast
  static sendClearToast = sendClearToast
  static sendFilePickerCommand = sendFilePickerCommand

  static getSelectedPort = () => {
    // ask the parent for the selected devices
    return this.sendCommand({
      method: 'getSelectedPort'
    })
  }

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
          if (!data.error) {
            data.error = 'Unknown error'
          }
          if (typeof data.error !== 'string') {
            try {
              data.error = JSON.stringify(data.error)
            } catch (e) {
              data.error = 'Unknown error'
            }
          }
          if (data.error.length > 100) {
            data.error = data.error.substr(0, 100) + '...'
          }
          cmd.reject(data.error)
        } else {
          cmd.resolve(data.result || {})
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
if (typeof window !== 'undefined') {
  window.addEventListener('message', ({ data }) => {
    xbit._handleMessage(data)
  })
}

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
}

export default xbit
