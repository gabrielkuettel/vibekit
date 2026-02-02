/**
 * Pairing Module
 *
 * Wallet pairing flow, QR code generation, and bridge URL fetching.
 */

export { generateQR, type GeneratedQR } from './qr.js'
export { fetchBridgeUrl } from './bridge.js'
export { createPairingRequest, type AddressMapper } from './flow.js'
