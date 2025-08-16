import { SMART_POSTER_ACTIONS_MAP } from './ndef.js'

export function ConsoleLogRecords(records, depth = 1) {
	const prefix0 = new Array(depth).fill('\t').join('')
	const prefix = new Array(depth + 1).fill('\t').join('')

	for(const record of records) {
		console.log(`${prefix0}Record: `)
		if(record.id !== undefined) { console.log(`${prefix}id:`, record.id) }
		console.log(`${prefix}recordType:`, record.recordType)

		if(record.recordType === 'url' || record.recordType === 'absolute-url') {
			const decoder = new TextDecoder(record.encoding ?? 'utf-8')
			console.log(`${prefix}url:`, URL.parse(decoder.decode(record.data))?.href)
		}
		else if(record.recordType === 'text') {
			console.log(`${prefix}lang:`, record.lang)
			console.log(`${prefix}encoding:`, record.encoding)

			const decoder = new TextDecoder(record.encoding)
			console.log(`${prefix}text:`, decoder.decode(record.data))
		}
		else if(record.recordType === 'mime' || record.recordType === 'unknown') {
			console.log(`${prefix}mediaType:`, record.mediaType)

			if(record.mediaType === 'application/json') {
				const decoder = new TextDecoder()
				console.log(`${prefix}json:`, JSON.parse(decoder.decode(record.data)))
			}
			else if(record.mediaType.startsWith('image/')) {
				const blob = new Blob([record.data], { type: record.mediaType })
				console.log(`${prefix}byteLength`, record.data.byteLength)
				console.log(`${prefix}image:`, '🥳') /// no image printing
			}
			else if(record.mediaType === 'text/vcard') {
				const decoder = new TextDecoder()
				console.log(`${prefix}vcard:`)
				console.log(decoder.decode(record.data)) // no prefix
			}
			else {
				console.log(`${prefix}data:`, record.data)
			}
		}
		else if(record.recordType === 'smart-poster') {
			ConsoleLogRecords(record.toRecords(), depth + 1)
		}
		else if(record.recordType === ':t') {
			const decoder = new TextDecoder()
			console.log(`${prefix}mime:`, decoder.decode(record.data))
		}
		else if(record.recordType === ':s') {
			const dv = ArrayBuffer.isView(record.data) ?
				new DataView(record.data.buffer, record.data.byteOffset, record.byteLength) :
				new DataView(record.data, 0, record.data.byteLength)
			const size = dv.getUint32(0, true)
			console.log(`${prefix}little-endian:`, true)
			console.log(`${prefix}size:`, size)
		}
		else if(record.recordType === ':act') {
			const [ action ] = record.data
			const actionText = SMART_POSTER_ACTIONS_MAP[action] ?? 'Unknown'
			console.log(`${prefix}action:`, actionText)
		}
		else {
			console.log(`${prefix}data:`, record.data)
		}
	}
}
