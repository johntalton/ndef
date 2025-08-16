import { NDEFMessage } from './message.js'
import { NDEFMessageDecoder } from './message_decoder.js'
import { NDEFMessageEncoder } from './message_encoder.js'
import { CONTEXT_ROOT } from './ndef.js'

/** @import { MessageInit } from './ndef.js' */

export const CC_MAGIC_ONE_BYTE = 0xE1
export const CC_MAGIC_TWO_BYTE = 0xe2

export const VERSION_MAJOR = 0b01
export const VERSION_MINOR = 0b00

export const CC_ACCESS_READ_ALWAYS_ID = 0b00
export const CC_ACCESS_READ_RESERVED_01_ID = 0b01
export const CC_ACCESS_READ_PROPRIETARY_ID = 0b10
export const CC_ACCESS_READ_RESERVED_11_ID = 0b11
export const CC_ACCESS_READ_ALWAYS = 'Always'
export const CC_ACCESS_READ_RESERVED_01 = 'Reserved_01'
export const CC_ACCESS_READ_PROPRIETARY = 'Proprietary'
export const CC_ACCESS_READ_RESERVED_11 = 'Reserved_11'
export const CC_ACCESS_READ = {
	[CC_ACCESS_READ_ALWAYS_ID]: CC_ACCESS_READ_ALWAYS,
	[CC_ACCESS_READ_RESERVED_01_ID]: CC_ACCESS_READ_RESERVED_01,
	[CC_ACCESS_READ_PROPRIETARY_ID]: CC_ACCESS_READ_PROPRIETARY,
	[CC_ACCESS_READ_RESERVED_11_ID]: CC_ACCESS_READ_RESERVED_11
}
export const CC_ACCESS_READ_NAMES = {
	[CC_ACCESS_READ_ALWAYS]: CC_ACCESS_READ_ALWAYS_ID,
	[CC_ACCESS_READ_RESERVED_01]: CC_ACCESS_READ_RESERVED_01_ID,
	[CC_ACCESS_READ_PROPRIETARY]: CC_ACCESS_READ_PROPRIETARY_ID,
	[CC_ACCESS_READ_RESERVED_11]: CC_ACCESS_READ_RESERVED_11_ID
}

export const CC_ACCESS_WRITE_ALWAYS_ID = 0b00
export const CC_ACCESS_WRITE_RESERVED_01_ID = 0b01
export const CC_ACCESS_WRITE_PROPRIETARY_ID = 0b10
export const CC_ACCESS_WRITE_RESERVED_11_ID = 0b11
export const CC_ACCESS_WRITE_ALWAYS = 'Always'
export const CC_ACCESS_WRITE_RESERVED_01 = 'Reserved_01'
export const CC_ACCESS_WRITE_PROPRIETARY = 'Proprietary'
export const CC_ACCESS_WRITE_NEVER = 'Never'
export const CC_ACCESS_WRITE = {
	[CC_ACCESS_WRITE_ALWAYS_ID]: CC_ACCESS_WRITE_ALWAYS,
	[CC_ACCESS_WRITE_RESERVED_01_ID]: CC_ACCESS_WRITE_RESERVED_01,
	[CC_ACCESS_WRITE_PROPRIETARY_ID]: CC_ACCESS_WRITE_PROPRIETARY,
	[CC_ACCESS_WRITE_RESERVED_11_ID]: CC_ACCESS_WRITE_NEVER
}
export const CC_ACCESS_WRITE_NAMES = {
	[CC_ACCESS_WRITE_ALWAYS]: CC_ACCESS_WRITE_ALWAYS_ID,
	[CC_ACCESS_WRITE_RESERVED_01]: CC_ACCESS_WRITE_RESERVED_01_ID,
	[CC_ACCESS_WRITE_PROPRIETARY]: CC_ACCESS_WRITE_PROPRIETARY_ID,
	[CC_ACCESS_WRITE_NEVER]: CC_ACCESS_WRITE_RESERVED_11_ID
}





export const TLV_TYPE_NDEF = 0x03
export const TLV_TYPE_PROPRIETARY = 0xFD
export const TLV_TYPE_TERMINATOR = 0xFE
export const TYPE5_TLV = {
	[TLV_TYPE_NDEF]: 'ndef',
	[TLV_TYPE_PROPRIETARY]: 'proprietary',
	[TLV_TYPE_TERMINATOR]: 'terminator'
}

export const TLV_M_LENGTH_16_MARKER = 0xff

export const ST25DV16_M_LEN = 0x40
export const ST25DV16_FEATURE = 0x05

export class CapabilityContainer {
	#magic
	#major
	#minor
	#mLen
	#feature
	#read
	#write
	#message

	constructor(options) {
		this.#magic = options.magic
		this.#major = options.major
		this.#minor = options.minor
		this.#read = options.read
		this.#write = options.write
		this.#message = options.message
		this.#mLen = options.mLen
		this.#feature = options.feature
	}

	get read() { return this.#read }
	get write() { return this.#write }
	get message() { return this.#message }

	/**
	 * @param {MessageInit} message
	 * @param {Object} [options = {}]
	 * @param {string} [options.read = CC_ACCESS_READ_ALWAYS]
	 * @param {string} [options.write = CC_ACCESS_WRITE_ALWAYS]
	 * @param {number} [options.mLen = ST25DV16_M_LEN]
	 * @param {number} [options.features = ST25DV16_FEATURE]
	 * @param {AbortSignal} [options.signal = undefined]
	 * @returns {ArrayBuffer|ArrayBufferView}
	 */
	static encode(message, {
		read = CC_ACCESS_READ_ALWAYS,
		write = CC_ACCESS_WRITE_ALWAYS,
		mLen = ST25DV16_M_LEN,
		features = ST25DV16_FEATURE,
		signal = undefined
	} = {}) {

		const encodedMessage = NDEFMessageEncoder.encode(message, CONTEXT_ROOT, 0)

		const MASK_2_BITS = 0b11

		const magic = CC_MAGIC_ONE_BYTE
		const version = ((VERSION_MAJOR & MASK_2_BITS) << 2) | (VERSION_MINOR & MASK_2_BITS)
		const readAccess = CC_ACCESS_READ_NAMES[read] ?? CC_ACCESS_READ_ALWAYS_ID
		const writeAccess = CC_ACCESS_WRITE_NAMES[write] ?? CC_ACCESS_WRITE_ALWAYS_ID
		const access = ((readAccess & MASK_2_BITS) << 2)| (writeAccess & MASK_2_BITS)
		const versionAccess = (version << 4)  | access


		if(mLen === undefined) { throw new Error('missing mLen') }
		if(features === undefined) { throw new Error('missing features') }

		const header = [
			magic, versionAccess, mLen, features,
			TLV_TYPE_NDEF,
		]

		const terminator = TLV_TYPE_TERMINATOR

		const _length = encodedMessage.byteLength
		const useLength16 = _length > 254
		const length = useLength16 ? TLV_M_LENGTH_16_MARKER : _length
		const length16 = useLength16 ? [ ...new Uint8Array(Uint16Array.of(_length).buffer) ].reverse() : []

		const encodedMessageBuffer = ArrayBuffer.isView(encodedMessage) ?
			new Uint8Array(encodedMessage.buffer, encodedMessage.byteOffset, encodedMessage.byteLength) :
			new Uint8Array(encodedMessage, 0, encodedMessage.byteLength)

		return Uint8Array.from([
			...header,
			length,
			...length16,
			...encodedMessageBuffer,
			terminator
		])
	}

	/**
	 * @param {Uint8Array} u8
	 * @param {string} context
	 */
	static *_decodeTLV(u8, context) {
		let cursor = 0
		while(cursor <  u8.byteLength) {

			// TLV Header
			const tlvType = u8[cursor]
			cursor += 1

			// immediately check if this is the Terminator as the remain bytes are not valid
			if(tlvType === TLV_TYPE_TERMINATOR) {
				//
				console.log('TLV Terminator reached', cursor, u8.byteLength)
				break
			}

			const _tlvLength = u8[cursor]
			cursor += 1

			const tlv16 = _tlvLength === TLV_M_LENGTH_16_MARKER
			const tlvLength16 = (u8[cursor] << 8) | u8[cursor + 1]
			const tlvLength = tlv16 ? tlvLength16 : _tlvLength
			cursor += (tlv16 ? 2 : 0)

			const value = u8.subarray(cursor, cursor + tlvLength)
			cursor += tlvLength

			if(tlvType === TLV_TYPE_NDEF) {
				// process ndef

				yield* NDEFMessageDecoder.decode(value, context)
			}
			else if(tlvType === TLV_TYPE_PROPRIETARY) {
				// ...
				console.warn('TLV proprietary')
			}
			else {
				console.warn('unknown TLV type', tlvType)
				//throw new Error('unknown TLV type')
				break
			}
		}
	}

	/**
	 * @param {ArrayBuffer|ArrayBufferView} buffer
	 * @param {string} [context = CONTEXT_ROOT]
	 */
	static decode(buffer, context = CONTEXT_ROOT) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer, 0, buffer.byteLength)

		const [ magic, versionAccess, _mLen, feature ] = u8

		if((magic !== CC_MAGIC_ONE_BYTE) && (magic !== CC_MAGIC_TWO_BYTE)) { throw new Error('unknown magic') }

		const major = (versionAccess & 0b1100_0000) >> 6
		const minor = (versionAccess & 0b0011_0000) >> 4
		const read = (versionAccess & 0b0000_1100) >> 2
		const write = (versionAccess & 0b0000_0011)

		const extendedHeader = _mLen === 0
		const mLen = extendedHeader ? ((u8[6] << 8) | u8[7]) : _mLen

		const lastIndex = extendedHeader ? 8 : 4
		const tlvBuffer = u8.subarray(lastIndex, u8.byteLength)

		const records = [ ...CapabilityContainer._decodeTLV(tlvBuffer, context) ]

		return new CapabilityContainer({
			magic,
			major,
			minor,
			mLen,
			read: CC_ACCESS_READ[read],
			write: CC_ACCESS_WRITE[write],
			feature,
			message: new NDEFMessage({ records: [ ...records ] })
		})
	}
}
