import {jest} from '@jest/globals';
import { bytesToHex, parseLtvs, hasLtv, parseManufacturerData, hexToBytes, convertPduTypeToJSON } from '../src/main'


const tagAd = hexToBytes('0201060b095557422053696d706c653aff77000c0000000300c4c07a26fe44fc63000000000a030f000f050c0000000000000000000000000004562affff0004b015ffff00046f95ffff16ff77000d000a0000620000000000c4c07a26fe44fc63')
const anchorAd = hexToBytes('020106090955574220426c75653aff77000c00000003007c065cb092e2b015000000000a0300000f050c0000000000000000000000000004fc63019f0004562a01bc00046f950123')

describe('bytesToHex', () => {
  test('should return the hex string', () => {
    const hexAd = bytesToHex(tagAd)
    expect(hexAd).toBe('0201060b095557422053696d706c653aff77000c0000000300c4c07a26fe44fc63000000000a030f000f050c0000000000000000000000000004562affff0004b015ffff00046f95ffff16ff77000d000a0000620000000000c4c07a26fe44fc63')
  })
  test('should return the hex string', () => {
    const hexAd = bytesToHex(anchorAd)
    expect(hexAd).toBe('020106090955574220426c75653aff77000c00000003007c065cb092e2b015000000000a0300000f050c0000000000000000000000000004fc63019f0004562a01bc00046f950123')
  })
})

describe('ltvMap', () => {
  test('should return the ltv map', () => {
    const hexAd = bytesToHex(tagAd)
    const ltvMap = parseLtvs(hexAd)
    expect(ltvMap).toHaveProperty('ff')
    expect(ltvMap.ff.length).toBe(2)
    expect(ltvMap).toHaveProperty('01')
    expect(ltvMap).toHaveProperty('09')
  })
  test('should return the ltv map', () => {
    const hexAd = bytesToHex(anchorAd)
    const ltvMap = parseLtvs(hexAd)
    expect(ltvMap).toHaveProperty('ff')
    expect(ltvMap.ff.length).toBe(1)
    expect(ltvMap).toHaveProperty('01')
    expect(ltvMap).toHaveProperty('09')
  })
})

describe('hasLtv', () => {
  test('should return the ltv array if the ad has a ltv', () => {
    const hexAd = bytesToHex(anchorAd)
    const ltvMap = parseLtvs(hexAd)
    const ffLtv = hasLtv('ff', [0x77, 0x00, 0x0c, 0x00], ltvMap)

    // check the first few bytes
    expect(ffLtv[0]).toBe(119)
    expect(ffLtv[1]).toBe(0)
    expect(ffLtv[2]).toBe(12)
    expect(ffLtv[3]).toBe(0)
  })

  test('should return the ltv array if the ad has a ltv', () => {
    const hexAd = bytesToHex(tagAd)
    const ltvMap = parseLtvs(hexAd)
    const ffLtv = hasLtv('ff', [0x77, 0x00, 0x0c, 0x00], ltvMap)

    // check the first few bytes
    expect(ffLtv[0]).toBe(119)
    expect(ffLtv[1]).toBe(0)
    expect(ffLtv[2]).toBe(12)
    expect(ffLtv[3]).toBe(0)
  })
})

describe('parseManufacturerData', () => {
  test('should return the manufacturer data', () => {
    const hexAd = bytesToHex(anchorAd)
    const ltvMap = parseLtvs(hexAd)
    const manufacturerData = parseManufacturerData(ltvMap.ff)
    console.log(manufacturerData)
  })

  test('should return the manufacturer data', () => {
    const hexAd = bytesToHex(tagAd)
    const ltvMap = parseLtvs(hexAd)

    const manufacturerData = parseManufacturerData(ltvMap.ff)
    // TODO this part of the mdata is not parsed yet as it's 0c, not 0d
    expect(manufacturerData[0]).toEqual({
      companyId: 119,
      protocolId: 12,
      networkId: 0,
      longAddr: 'c4c07a26fe44fc63',
      shortAddr: 'fc63',
      flags: {
        activeRangingSession: false,
        anchor: true,
        canScan: false,
        configured: true,
        hasCoarsePosition: false,
        hasFinePosition: false,
        isResponder: false,
      },
      timestamp: 0,
      rangingData: expect.any(Array),
    })
    expect(manufacturerData[1]).toEqual({
      companyId: 119,
      protocolId: 13,
      productId: 10,
      firmwareType: 0,
      firmwareVersion: '98.0.0',
      configVersion: 0,
      networkId: 0,
      deviceAddress: 'c4c07a26fe44fc63'
    })
  })
})

// describe('convertPduTypeToJSON', () => {
//   test('should return the pdu type', () => {
//     const pdu = convertPduTypeToJSON(21)
//     expect(pdu).toEqual({
//       PI_HAPI_BLE_SCANNER_PDU_TYPE_CONNECTABLE: false
//     })
//   })
// })