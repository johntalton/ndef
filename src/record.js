
import { CONTEXT_EXTERNAL, CONTEXT_SMART_POSTER, RECORD_TYPE_SMART_POSTER } from './ndef.js'
import { NDEFRecordDecoder } from './record_decode.js'
import { validateExternalType } from './util.js'

export class NDEFRecord {
	#record

	constructor(options) {
		this.#record = options
	}

	get recordType() { return this.#record.recordType }
	get data() { return this.#record.data }
	get encoding() { return this.#record.encoding }
	get id() { return this.#record.id }
	get lang() { return this.#record.lang }
	get mediaType() { return this.#record.mediaType }

	toRecords() {
		if(this.recordType === RECORD_TYPE_SMART_POSTER) {
			return [ ...NDEFRecordDecoder.decode(this.data, CONTEXT_SMART_POSTER) ]
		}
		else if(validateExternalType(this.recordType)) {
			return [ ...NDEFRecordDecoder.decode(this.data, CONTEXT_EXTERNAL) ]
		}

		// throw new NotSupportedError()
		throw new Error('Not Supported')
	}

}
