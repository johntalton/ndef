import {
	KNOWN_RECORD_TYPES,
	LOCAL_TYPE_MAX_LENGTH,
	RECORD_TYPE_LOCAL_TYPE_PREFIX,
	URI_PREFIX, URI_PREFIX_ID_NONE
} from './ndef.js'

/**
 * @import { RecordData, MessageInit } from './ndef.js'
 */


export function isBufferSource(obj) {
	return (obj instanceof ArrayBuffer) || ArrayBuffer.isView(obj)
}

export function isStringLike(obj) {
	return (obj instanceof String) || (typeof obj === 'string')
}

/**
 * @param {RecordData} obj
 * @returns {boolean}
 * @type {(obj: any) => obj is MessageInit}
 */
export function isMessage(obj) {
	if(isStringLike(obj)) { return false }
	return Object.hasOwn(obj, 'records')
}

/**
 * @typedef {Object} MimeType
 * @property {string} type
 * @property {string} [subtype]
 * @property {{ [key: string]: string }} [parameters]
 */

/**
 *
 * @param {Object} obj
 * @returns {boolean}
 * @type {(obj: any) => obj is MimeType}
 */
export function isMimeType(obj) {
	if(isStringLike(obj)) { return false }
	// only check type as subtype and parameters can be empty
	return Object.hasOwn(obj, 'type')
}


const REGEX_LOWER_ALPHA_NUMBER = /[a-z0-9]/
export function isFirstCharAlphaNumeric(str) {
	const [ c ] = str
	return REGEX_LOWER_ALPHA_NUMBER.test(c)
}

export function lookupPrefix(url) {
	for(const [ prefixId, prefix ] of Object.entries(URI_PREFIX)) {
		if(url.startsWith(prefix)) {
			return [ prefixId, url.replace(prefix, '')]
		}
	}

	return [ URI_PREFIX_ID_NONE, url ]
}

// Web NFC 9.12.4
export function validateLocalType(type) {
	if(!type.startsWith(RECORD_TYPE_LOCAL_TYPE_PREFIX)) {
		console.warn('type does not start with colon', type)
	}

	const firstColon = type.indexOf(RECORD_TYPE_LOCAL_TYPE_PREFIX)
	const localTypeName = type.substring(firstColon + 1)
	if(localTypeName.length > LOCAL_TYPE_MAX_LENGTH) { return false }
	if(!isFirstCharAlphaNumeric(localTypeName)) { return false }
	if(KNOWN_RECORD_TYPES.includes(localTypeName)) { return false }

	return true
}

/**
 * @param {string} type
 */
// Web NFC 9.12.3
export function splitExternalType(type) {
	const colonIndex = type.indexOf(':')
	if(colonIndex < 0) { return [] }
	return [
		type.substring(0, colonIndex),
		type.substring(colonIndex + 1)
	]
}

const REGEX_EXTERNAL_TYPE = /^[a-zA-Z0-9$'()*+,-.;=@_]+$/

// Web NFC 9.12.3
export function validateExternalType(recordType) {
	const [ domain, type ] = splitExternalType(recordType)
	if(domain === undefined) { return false }
	return REGEX_EXTERNAL_TYPE.test(domain)
}


