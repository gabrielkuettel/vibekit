import { describe, it, expect } from 'vitest'
import { encodeBase64, bytesToBase64, decodeBase64, bytesToString } from './encoding.js'

describe('encodeBase64', () => {
  it('encodes small byte arrays', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
    expect(encodeBase64(bytes)).toBe('SGVsbG8=')
  })

  it('handles empty byte arrays', () => {
    expect(encodeBase64(new Uint8Array([]))).toBe('')
  })

  it('encodes large byte arrays without stack overflow', () => {
    // Arrays >64KB cause "Maximum call stack size exceeded" with
    // String.fromCharCode(...bytes) due to JS engine argument limits
    const bytes = new Uint8Array(100_000)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = i % 256
    }
    expect(() => encodeBase64(bytes)).not.toThrow()
    // Verify round-trip
    const decoded = Buffer.from(encodeBase64(bytes), 'base64')
    expect(new Uint8Array(decoded)).toEqual(bytes)
  })
})

describe('bytesToBase64', () => {
  it('returns string input unchanged', () => {
    expect(bytesToBase64('already-base64')).toBe('already-base64')
  })

  it('encodes Uint8Array to base64', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111])
    expect(bytesToBase64(bytes)).toBe('SGVsbG8=')
  })

  it('encodes large byte arrays without stack overflow', () => {
    const bytes = new Uint8Array(100_000)
    expect(() => bytesToBase64(bytes)).not.toThrow()
  })
})

describe('decodeBase64', () => {
  it('decodes valid base64', () => {
    expect(decodeBase64('SGVsbG8=')).toBe('Hello')
  })

  it('falls back to original string on invalid base64', () => {
    expect(decodeBase64('not valid base64!!!')).toBe('not valid base64!!!')
  })
})

describe('bytesToString', () => {
  it('decodes Uint8Array as UTF-8', () => {
    const bytes = new TextEncoder().encode('Hello')
    expect(bytesToString(bytes)).toBe('Hello')
  })

  it('decodes base64 string input', () => {
    expect(bytesToString('SGVsbG8=')).toBe('Hello')
  })
})
