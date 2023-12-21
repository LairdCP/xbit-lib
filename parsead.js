import { parse } from 'postcss';
import { convertPduTypeToJSON, parseLtvs, hasLtv } from './src/main.js';

const ad1 = {'r':-50,'d':'01e52926af72f2','m':'bleAd','b':'16ff77000d000a0000010063000000dc8c8f331e854aab','i':100,'t':27}
const ad2 = {'r':-51,'d':'01e52926af72f2','m':'bleAd','b':'020106070943616e766173110784aa6074528a8b86d34cb71d1ddc538d','i':100,'t':19}
const ad3 = {'r':-80,'d':'0044cf78a1412c','m':'bleAd','b':'020a0a18094c452d426f7365204d6963726f20536f756e644c696e6b','i':100,'t':27}
const ad4 = {'r':-48,'d':'01e52926af72f2','m':'bleAd','b':'0201060b095557422053696d706c6528ff77000c0000000300dc8c8f331e854aab000000000a03000f00050c00000000000000000000000016ff77000d000a0000010063000000dc8c8f331e854aab','i':74,'t':33}

export function hexToBytes (hexString) {
  return Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

export function bytesToHex (byteArray) {
  return byteArray.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

const scanConstants = {
  LAIRD_COMPANY_ID: 0x0077
}

const parseManufacturerData = (adData) => {
  // if ('ff' in parsedAd1) {
  // if (adType == 0xFF) {
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
      if(dataView.getUint16(0, true) == scanConstants.LAIRD_COMPANY_ID && dataView.getUint16(2, true) == 13) {
        t.companyId = dataView.getUint16(0, true)
        t.protocolId = dataView.getUint16(2, true)
        t.productId = dataView.getUint16(4, true)
        t.firmwareType = dataView.getUint8(6)
        t.firmwareVersion = dataView.getUint8(7) + '.' + dataView.getUint8(8) + '.' + dataView.getUint8(9)
        t.configVersion = dataView.getUint8(10)
        t.networkId = dataView.getUint16(11, true)
        t.deviceAddress = bytesToHex(data.slice(13))
      }
      retval.push(t)
    })
    return retval
  // }
}

const parsedAd1 = parseLtvs(ad1.b)
parsedAd1.pduType = convertPduTypeToJSON(ad1.t)


if (parsedAd1.ff) {
  parsedAd1.data = parseManufacturerData(parsedAd1.ff)
}

const byteArray = hexToBytes(ad1.b)
const hexString = bytesToHex(byteArray)

console.log('hasLtv', hasLtv('ff', [0x77, 0x00, 0x0c, 0x00], parsedAd1))