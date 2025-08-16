import { NDEFMessageEncoder } from './message_encoder.js'
import {
	CONTEXT_EXTERNAL,
	CONTEXT_LOCAL,
	CONTEXT_ROOT,
	CONTEXT_SMART_POSTER,
	ENCODING_UTF8,
	MIME_APPLICATION_OCTET_STREAM,
	RECORD_TYPE_ABSOLUTE_URL,
	RECORD_TYPE_EMPTY,
	RECORD_TYPE_EXTERNAL_SEPARATOR,
	RECORD_TYPE_EXTERNAL_MAX_LENGTH,
	RECORD_TYPE_LOCAL_TYPE_PREFIX,
	RECORD_TYPE_MIME,
	RECORD_TYPE_SMART_POSTER,
	RECORD_TYPE_TEXT,
	RECORD_TYPE_TEXT_DEFAULT_ENCODING,
	RECORD_TYPE_TEXT_DEFAULT_LANG,
	RECORD_TYPE_TEXT_KNOWN_ENCODINGS,
	RECORD_TYPE_TEXT_MAX_LANG_LENGTH,
	RECORD_TYPE_URL,
	SMART_POSTER_ACTION,
	SMART_POSTER_SIZE,
	TNF_ABSOLUTE_URL,
	TNF_EMPTY,
	TNF_EXTERNAL,
	TNF_MIME,
	TNF_WELL_KNOWN,
	WELL_KNOWN_TYPE_SMART_POSTER,
	WELL_KNOWN_TYPE_TEXT,
	WELL_KNOWN_TYPE_TEXT_LANG_MASK,
	WELL_KNOWN_TYPE_URL
} from './ndef.js'
import {
	isBufferSource,
	isMessage,
	isStringLike,
	lookupPrefix,
	splitExternalType,
	validateExternalType,
	validateLocalType
} from './util.js'

/**
 * @import { RecordInit, MessageInit } from './ndef.js'
 */


export class NDEFRecordEncoder {
		/**
	 * @typedef {Object} EncodingHeader
	 * @property {boolean} start
	 * @property {boolean} end
	 * @property {number} TNF
	 */

	/**
	 * @param {EncodingHeader} headers
	 * @param {string|undefined} type
	 * @param {string|undefined} id
	 * @param {ArrayBuffer|ArrayBufferView|undefined} payloadBuffer
	 * @returns {ArrayBuffer|ArrayBufferView}
	 */
	static _encode(headers, type, id, payloadBuffer) {
		const { start, end, TNF } = headers

		const encoder = new TextEncoder()

		const typeBufferU8 = (type !== undefined) ? encoder.encode(type) : undefined
		const idBufferU8 = (id !== undefined) ? encoder.encode(id) : undefined

		const hasType = typeBufferU8 !== undefined
		const hasId = idBufferU8 !== undefined
		const hasPayload = payloadBuffer !== undefined

		const typeLength = hasType ? typeBufferU8.byteLength : 0
		const idLength = hasId ? idBufferU8.byteLength : 0
		const payloadLength = hasPayload ? payloadBuffer.byteLength : 0

		const payloadBufferU8 = hasPayload ? (ArrayBuffer.isView(payloadBuffer) ?
			new Uint8Array(payloadBuffer.buffer, payloadBuffer.byteOffset, payloadBuffer.byteLength) :
			new Uint8Array(payloadBuffer, 0 ,payloadBuffer?.byteLength)) :
			undefined

		const short =  hasPayload ? (payloadLength < 255) : true
		const chunked = false

		const payloadLengthBuffer = short ? Uint8Array.from([ payloadLength ]) : Uint32Array.from([ payloadLength ])

		const totalLength = 1 + 1 + typeLength + (short ? 1 : 4) + payloadLength + (hasId ? (1 + idLength) : 0)

		const header = 0 |
			(start ? 0b1000_0000 : 0) |
			(end ? 0b0100_0000 : 0) |
			(chunked ? 0b0010_0000 : 0) |
			(short ? 0b0001_0000 : 0) |
			(hasId ? 0b0000_1000 : 0) |
			(TNF & 0b111)

		const result = new Uint8Array(totalLength)
		result.set([ header ], 0)
		result.set([ typeLength ], 1)
		result.set(payloadLengthBuffer, 2)

		let offset = 1 + 1 + payloadLengthBuffer.byteLength
		if(hasId) {
			result.set([ idLength ], offset)
			offset += 1
		}

		if(hasType) {
			result.set(typeBufferU8, offset)
			offset += typeLength
		}

		if(hasId) {
			result.set(idBufferU8, offset)
			offset += idLength
		}

		if(payloadBufferU8 !== undefined) {
			result.set(payloadBufferU8, offset)
		}

		return result
	}

	/**
	 * @param {RecordInit} record
	 * @returns {ArrayBuffer|ArrayBufferView}
	 */
	// Web NFC 9.12.2
	static encode(record, options) {
		const { start, end, context, recordDepth } = options
		const { id, recordType, data } = record

		// 3.
		if(recordType === RECORD_TYPE_EMPTY) {
			// Web NFC 9.12.5
			// 1.
			if(record.mediaType !== undefined) { throw new TypeError('empty type must not have mediaType') }
			// 2.
			if(id !== undefined) { throw new TypeError('empty type must not have id') }

			return NDEFRecordEncoder._encode({
				TNF: TNF_EMPTY,
				start, end
			}, undefined, undefined, undefined)
		}
		else if(recordType === RECORD_TYPE_URL) {
			const encoder = new TextEncoder()

			// Web NFC 9.12.7
			// 1.
			if(record.mediaType !== undefined) { throw new TypeError('url must not have mediaType') }
			// 2.
			if(!isStringLike(data)) { throw new TypeError('url data must be string') }
			// 4.
			try { new URL(data.toString()) } catch(e) { throw new SyntaxError('url data not parsable as url', { cause: e })}

			// todo step 6. suggest matching data/url against serialized version of string, using string here instead
			// 7. and 8.
			const [ prefixId, url ] = lookupPrefix(data)
			// 5.
			const dataBuffer = encoder.encode(url)

			// 10.
			const payloadBuffer = Uint8Array.from([ prefixId, ...dataBuffer ])

			return NDEFRecordEncoder._encode({
				TNF: TNF_WELL_KNOWN,
				start, end
			}, WELL_KNOWN_TYPE_URL, id, payloadBuffer)
		}
		else if(recordType === RECORD_TYPE_ABSOLUTE_URL) {
			// Web NFC 9.12.12
			// 1.
			if(context === CONTEXT_SMART_POSTER) { throw new TypeError('absolute url not allowed in smart-poster context') }
			// 2.
			if(record.mediaType !== undefined) { throw new TypeError('absolute url must not have mediaType') }
			// 3.
			if(!isStringLike(data)) { throw new TypeError('absolute url data must be string') }

			// 4.
			// prefer try/catch over canParse as it results in a cause: e
			// if(!URL.canParse(data.toString())) { throw new SyntaxError() }
			try { new URL(data.toString()) } catch(e) { throw new SyntaxError('absolute url data not parsable as url', { cause: e })}

			// 8.
			const type = data.toString()

			return NDEFRecordEncoder._encode({
				TNF: TNF_ABSOLUTE_URL,
				start, end
			}, type, id, undefined)
		}
		else if(recordType === RECORD_TYPE_TEXT) {
			const encoder = new TextEncoder()

			// Web NFC 9.12.6
			// 1.
			if(record.mediaType !== undefined) { throw new TypeError('text must not have mediaType') }
			// 2.
			if(!isStringLike(data) && !isBufferSource(data)) { throw new TypeError('text data must be String of BufferSource') }

			// 4. and 5.
			const langBuffer = encoder.encode(record.lang ?? RECORD_TYPE_TEXT_DEFAULT_LANG)
			const langLength = langBuffer.byteLength
			if(langLength > RECORD_TYPE_TEXT_MAX_LANG_LENGTH) { throw new SyntaxError('text lang length greater than max allowed') }

			// 6.
			const encoding = record.encoding ?? RECORD_TYPE_TEXT_DEFAULT_ENCODING
			if(isStringLike(data) && (encoding !== ENCODING_UTF8)) { throw new TypeError('text raw string encoding must be utf-8') }
			if(!RECORD_TYPE_TEXT_KNOWN_ENCODINGS.includes(encoding)) { throw new TypeError('unknown encoding for text') }

			// 8.
			const isUTF8 = encoding === ENCODING_UTF8
			const header = 0 | (langLength & WELL_KNOWN_TYPE_TEXT_LANG_MASK) | (isUTF8 ? 0 : 0b1000_0000)

			// 9.
			const textBuffer = isBufferSource(data) ? (ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data)) : encoder.encode(data.toString())
			const payloadBuffer = Uint8Array.from([ header, ...langBuffer, ...textBuffer ])

			return NDEFRecordEncoder._encode({
				TNF: TNF_WELL_KNOWN,
				start, end
			}, WELL_KNOWN_TYPE_TEXT, id, payloadBuffer)
		}
		else if(recordType === RECORD_TYPE_MIME) {
			// Web NFC 9.12.8
			// 1.
			if(!isBufferSource(data)) { throw new TypeError('mime data must be BufferSource') }
			// 2.
			// todo valid parsable mediaType, else set to octet stream
			// 3.
			const mimeType = record.mediaType ?? MIME_APPLICATION_OCTET_STREAM
			// 8.
			// todo step 8 suggest ?serializing? the mime type from object
			// const mimeType = isMimeType(_mimeType) ? serializeMimeType(_mimeType) : _mimeType
			const type = mimeType

			return NDEFRecordEncoder._encode({
				TNF: TNF_MIME,
				start, end
			}, type, id, data)
		}
		else if(recordType === RECORD_TYPE_SMART_POSTER) {
			// Web NFC 9.12.11
			// 1.
			if(record.mediaType !== undefined) { throw new TypeError('smart-poster must not have mediaType') }
			// 2.
			if(!isMessage(data)) { throw new TypeError('smart-poster must contain record data') }

			// 4.
			const payload = NDEFMessageEncoder.encode(data, CONTEXT_SMART_POSTER, recordDepth)

			return NDEFRecordEncoder._encode({
				TNF: TNF_WELL_KNOWN,
				start, end
			}, WELL_KNOWN_TYPE_SMART_POSTER, id, payload)
		}
		// 4.
		else if(recordType.startsWith(RECORD_TYPE_LOCAL_TYPE_PREFIX)) {
			if(context === CONTEXT_ROOT) { throw new TypeError('local-type not allowed in root context') }
			if(!validateLocalType(recordType)) { throw new TypeError('record type does not have valid local-type name')}

			// Web NFC 9.12.10
			// 1.
			if(record.mediaType !== undefined) { throw new TypeError('local-type must not have mediaType') }
			// 2.
			if(!isBufferSource(data) && !isMessage(data)) { throw new TypeError('local-type data must be BufferSource or Message') }

			// 4.
			const localTypeName = recordType.slice(1)

			if(context === CONTEXT_SMART_POSTER) {
				// 6.
				if(localTypeName === SMART_POSTER_SIZE) {
					if(!isBufferSource(data)) { throw new TypeError('smart-poster for size must have BufferSource data') }
					if(data.byteLength !== 4) { throw new TypeError('smart-poster size data byte length not equal to 1')}
				}
				// 7.
				else if(localTypeName === SMART_POSTER_ACTION) {
					if(!isBufferSource(data)) { throw new TypeError('smart-poster for action must have BufferSource data') }
					if(data.byteLength !== 1) { throw new TypeError('smart-poster action data byte length not equal to 1')}
				}
			}

			// 8. and 9.
			const type = localTypeName
			const payload = isBufferSource(data) ? data : NDEFMessageEncoder.encode(data, CONTEXT_LOCAL, recordDepth)

			return NDEFRecordEncoder._encode({
				TNF: TNF_WELL_KNOWN,
				start, end
			}, type, id, payload)
		}
		// 5.
		else if(validateExternalType(recordType)) {
			// Web NFC 9.12.9
			// 1.
			if(record.mediaType !== undefined) { throw new TypeError('external-type must not have mediaType') }
			// 2.
			const [ domain, externalType ] = splitExternalType(recordType)
			// todo step 3 suggest sanitizing the Domain to ASCII

			// 4.
			const customTypeName = domain + RECORD_TYPE_EXTERNAL_SEPARATOR + externalType
			// 5.
			if(customTypeName.length > RECORD_TYPE_EXTERNAL_MAX_LENGTH) { throw new TypeError('external-type type name exceeds max length') }
			// 6.
			const type = customTypeName
			// 7.
			if(!isBufferSource(data) && !isMessage(data)) { throw new TypeError('external-type data must be BufferSource or Message') }

			const payload = isBufferSource(data) ? data : NDEFMessageEncoder.encode(data, CONTEXT_EXTERNAL, recordDepth)

			return NDEFRecordEncoder._encode({
				TNF: TNF_EXTERNAL,
				start, end
			}, type, id, payload)
		}

		// 6.
		console.warn('unknown recordType', recordType)
		throw new TypeError('unknown recordType')

	}
}
