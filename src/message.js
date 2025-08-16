export class NDEFMessage {
	#records

	constructor(options) { this.#records = options.records }

	get records() {
		return this.#records
	}
}
