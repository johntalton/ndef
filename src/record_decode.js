import { NDEFRecord } from './record.js'
import {
	CONTEXT_EXTERNAL,
	CONTEXT_ROOT,
	CONTEXT_SMART_POSTER,
	MIME_APPLICATION_OCTET_STREAM,
	RECORD_TYPE_ABSOLUTE_URL,
	RECORD_TYPE_EMPTY,
	RECORD_TYPE_LOCAL_TYPE_PREFIX,
	RECORD_TYPE_MIME,
	RECORD_TYPE_SMART_POSTER,
	RECORD_TYPE_SMART_POSTER_ACTION,
	RECORD_TYPE_SMART_POSTER_SIZE,
	RECORD_TYPE_SMART_POSTER_TYPE,
	RECORD_TYPE_TEXT,
	RECORD_TYPE_UNKNOWN,
	RECORD_TYPE_URL,
	SMART_POSTER_ACTION,
	SMART_POSTER_SIZE,
	SMART_POSTER_TYPE,
	TNF_ABSOLUTE_URL,
	TNF_EMPTY,
	TNF_EXTERNAL,
	TNF_MIME,
	TNF_UNKNOWN,
	TNF_WELL_KNOWN,
	URI_PREFIX,
	WELL_KNOWN_TYPE_SMART_POSTER,
	WELL_KNOWN_TYPE_TEXT,
	WELL_KNOWN_TYPE_TEXT_LANG_MASK,
	WELL_KNOWN_TYPE_TEXT_UTF8_MASK,
	WELL_KNOWN_TYPE_URL
} from './ndef.js'
import {
	splitExternalType,
	validateExternalType,
	validateLocalType
} from './util.js'

export class NDEFRecordDecoder {
	// Web NFC 9.15
	// Web NFC 9.15.1
	static *decode(buffer, context) {
		// 1.
		if(buffer.byteLength === 0) { return }

		const dv = ArrayBuffer.isView(buffer) ?
			new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new DataView(buffer, 0, buffer.byteLength)

		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer, 0, buffer.byteLength)

		let cursor = 0

		const decoder = new TextDecoder()

		// 3.
		while(cursor < u8.byteLength) {
			// 3. 1.
			if(buffer.byteLength < 3) { break }

			// 4.
			const header = dv.getUint8(cursor)
			cursor += 1

			const MB = (header & 0b1000_0000) >> 7
			const ME = (header & 0b0100_0000) >> 6
			const CF = (header & 0b0010_0000) >> 5
			const SR = (header & 0b0001_0000) >> 4
			const IL = (header & 0b0000_1000) >> 3
			const TNF = (header & 0b0000_0111)

			const short = SR === 1
			const idLengthPresent = IL === 1
			const messageBegin = MB === 1
			const messageEnd = ME === 1
			const chunked = CF === 1

			// 5.
			const typeLength = dv.getUint8(cursor)
			cursor += 1

			// 6. and 7.
			const payloadLength = short ? dv.getUint8(cursor) : dv.getUint32(cursor)
			cursor += (short ? 1 : 4)

			// 8.
			const idLength = idLengthPresent ? dv.getUint8(cursor) : 0
			cursor += idLengthPresent ? 1 : 0

			// 9.
			const typeBuffer = u8.subarray(cursor, cursor + typeLength)
			const type = decoder.decode(typeBuffer)
			cursor += typeLength

			// 10.
			const idBuffer = idLengthPresent ? u8.subarray(cursor, cursor + idLength) : undefined
			const id = idLengthPresent ? decoder.decode(idBuffer) : undefined
			cursor += idLengthPresent ? idLength : 0

			// 11.
			const payload = u8.subarray(cursor, cursor + payloadLength)
			cursor += payloadLength

			// Web NFC 9.15.3
			// 4.
			if(TNF === TNF_EMPTY) {
				if(typeLength !== 0) { throw new Error('empty with non-zero type length') }
				if(payloadLength !== 0) { throw new Error('empty with non-zero payload length')}

				yield new NDEFRecord({
					recordType: RECORD_TYPE_EMPTY,
					id
				})
			}
			// 5.
			else if(TNF === TNF_WELL_KNOWN) {
				// 5. 1.
				if(type === WELL_KNOWN_TYPE_TEXT) {
					// Web NFC 9.15.4
					// 3.
					if(payload.byteLength === 0) {
						yield new NDEFRecord({
							recordType: RECORD_TYPE_TEXT
						})
					}
					else {
						// 4.
						const header = payload[0]
						// 5.
						const langLength = (header & WELL_KNOWN_TYPE_TEXT_LANG_MASK)
						// 6.
						const lang = decoder.decode(payload.subarray(1, 1 + langLength))
						// 9.
						const isUTF8 = ((header & WELL_KNOWN_TYPE_TEXT_UTF8_MASK) >> 7) === 0
						const encoding = isUTF8 ? 'utf-8' : 'utf-16be'

						const textOffset = 1 + langLength
						const encodedText = payload.subarray(textOffset, payload.byteLength)

						yield new NDEFRecord({
							recordType: RECORD_TYPE_TEXT,
							lang,
							encoding,
							data: encodedText
						})
					}
				}
				// 5. 2.
				else if(type === WELL_KNOWN_TYPE_URL) {
					// Web NFC 9.15.5
					// 3.
					if(payload.byteLength === 0) {
						yield new NDEFRecord({
							recordType: RECORD_TYPE_URL
						})
					}
					else {
						// 5.
						const prefixByte = payload[0]
						// 6.
						const prefix = URI_PREFIX[prefixByte]
						const hasPrefix = prefix !== undefined
						const _data = payload.subarray(1, payloadLength)
						if(hasPrefix) {
							const encoder = new TextEncoder()
							const prefixBuffer = encoder.encode(prefix)
							const length = prefixBuffer.byteLength + _data.byteLength
							const data = new Uint8Array(length)
							data.set(prefixBuffer, 0)
							data.set(_data, prefixBuffer.byteLength)
							yield new NDEFRecord({
								recordType: RECORD_TYPE_URL,
								data
							})
						}
						else {
							yield new NDEFRecord({
								recordType: RECORD_TYPE_URL,
								data: _data
							})
						}
					}
				}
				// 5. 3.
				else if(type === WELL_KNOWN_TYPE_SMART_POSTER) {
					// Web NFC 9.15.6
					// 3.
					if(payload.byteLength === 0) {
						yield new NDEFRecord({
							recordType: RECORD_TYPE_SMART_POSTER
						})
					}
					else {
						yield new NDEFRecord({
							recordType: RECORD_TYPE_SMART_POSTER,
							data: payload
						})
					}
				}
				// 5. 4.
				else if((context === CONTEXT_SMART_POSTER) && (type === SMART_POSTER_SIZE)) {
					// Web NFC 9.15.6
					// 3.
					if(payload.byteLength !== 4) { throw new TypeError('smart-poster size must be 4 bytes') }

					yield new NDEFRecord({
						recordType: RECORD_TYPE_SMART_POSTER_SIZE,
						data: payload
					})
				}
				// 5. 5.
				else if((context === CONTEXT_SMART_POSTER) && (type === SMART_POSTER_TYPE)) {
					// Web NFC 9.15.6
					yield new NDEFRecord({
						recordType: RECORD_TYPE_SMART_POSTER_TYPE,
						data: payload
					})
				}
				// 5. 6.
				else if((context === CONTEXT_SMART_POSTER) && (type === SMART_POSTER_ACTION)) {
					// Web NFC 9.15.6
					// 3.
					if(payload.byteLength !== 1) { throw new TypeError('smart-poster action must be 1 byte') }

					yield new NDEFRecord({
						recordType: RECORD_TYPE_SMART_POSTER_ACTION,
						data: payload
					})
				}
				// 5. 7.
				else if(validateLocalType(type)) {
					// 5. 7. 1.
					if(context !== CONTEXT_SMART_POSTER && context !== CONTEXT_EXTERNAL) { throw new TypeError('local-type invalid context') }

					// Web NFC 9.15.7
					// step 1. prepends colon to the type, this could be a double colon result
					// todo valid output
					yield new NDEFRecord({
						recordType: RECORD_TYPE_LOCAL_TYPE_PREFIX + type,
						data: payload
					})
				}
				// 5. 8.
				else {
					console.warn('unknown well-known type', type)
					throw new TypeError('unknown Well-Known type')
				}
			}
			// 6.
			else if(TNF === TNF_MIME) {
				// Web NFC 9.15.8
				// todo step 2. suggest to ?serialize? the mimeType

				yield new NDEFRecord({
					recordType: RECORD_TYPE_MIME,
					mediaType: type,
					data: payload
				})
			}
			// 7.
			else if(TNF === TNF_ABSOLUTE_URL) {
				// Web NFC 9.15.9
				// todo step 4. suggest setting data/url to the bytes of the type field
				const url = type

				yield new NDEFRecord({
					recordType: RECORD_TYPE_ABSOLUTE_URL,
					data: url
				})
			}
			// 8.
			else if(TNF === TNF_EXTERNAL) {
				// Web NFC 9.15.10
				// 1.
				if(validateExternalType(type)) {
					//
				}
				else {
					// 2.
					const [ _domain, _type ] = splitExternalType(type)
					// 3.
					// todo Sanitize Domain ToUnicode

					yield new NDEFRecord({
						recordType: _domain + ':' + _type,
						data: payload
					})
				}

			}
			// 9.
			else if(TNF === TNF_UNKNOWN) {
				// Web NFC 9.15.11
				yield new NDEFRecord({
					recordType: RECORD_TYPE_UNKNOWN,
					id,
					mediaType: MIME_APPLICATION_OCTET_STREAM
				})
			}
			// else if(TNF === TNF_UNCHANGED) {
			// 	throw new Error('chunked payload not supported')
			// }
			// 10.
			else {
				throw new TypeError('unknown TNF type')
			}

			// 14.
			if(messageEnd) {
				// todo checkParsedRecords ?
			}
		}
	}
}