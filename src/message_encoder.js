import { NDEFRecordEncoder } from './record_encode.js'
import {
	MIME_APPLICATION_OCTET_STREAM,
	RECORD_TYPE_MIME,
	RECORD_TYPE_TEXT
} from './ndef.js'
import {
	isBufferSource,
	isMessage,
	isStringLike
} from './util.js'

/**
 * @import { MessageInit } from './ndef.js'
 */

export class NDEFMessageEncoder {
		/**
	 * @param {MessageInit} message
	 * @param {string} context
	 * @param {number} recordDepth
	 * @returns {ArrayBuffer|ArrayBufferView}
	 */
	// Web NFC 9.12
	static encode(message, context, recordDepth) {
		// 1.
		if(isStringLike(message)) {
			return NDEFRecordEncoder.encode({
				recordType: RECORD_TYPE_TEXT,
				data: message.toString()
			}, { start: true, end: true, context, recordDepth })
		}
		else if(isBufferSource(message)) {
			return NDEFRecordEncoder.encode({
				recordType: RECORD_TYPE_MIME,
				mediaType: MIME_APPLICATION_OCTET_STREAM,
				data: message
			}, { start: true, end: true, context, recordDepth })
		}
		else if(isMessage(message)) {
			if(message.records === undefined) { throw new TypeError('empty records list') }

			const encodedRecords = message.records.map((record, index) => {
				const start = index === 0
				const end = index === message.records.length
				if((recordDepth + 1) > 32) { throw new TypeError('recordsDepth exceeded') }
				return NDEFRecordEncoder.encode(record, { start, end, context, recordDepth: recordDepth + 1 })
			})

			const totalBytes = encodedRecords.reduce((acc, item) => acc += item.byteLength, 0)
			const buffer = new Uint8Array(totalBytes)

			let offset = 0
			encodedRecords.forEach(item => {
				if(item.byteLength === 0) { return }
				const itemU8 = ArrayBuffer.isView(item) ?
					new Uint8Array(item.buffer, item.byteOffset, item.byteLength) :
					new Uint8Array(item, 0, item.byteLength)

				buffer.set(itemU8, offset)
				offset += item.byteLength
			})

			return buffer
		}
		else {
			throw new TypeError('unknown message format')
		}
	}
}
