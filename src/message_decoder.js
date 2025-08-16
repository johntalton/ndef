import { NDEFRecordDecoder } from './record_decode.js'

export class NDEFMessageDecoder {
	static *decode(buffer, context) {
		yield *NDEFRecordDecoder.decode(buffer, context)
	}
}