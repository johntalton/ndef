

/**
 * @typedef {string|ArrayBuffer|ArrayBufferView|MessageInit} RecordData
 */

/**
 * @typedef {Object} RecordInit
 * @property {string} [id]
 * @property {string} recordType
 * @property {string} [mediaType]
 * @property {string} [lang]
 * @property {string} [encoding]
 * @property {RecordData} data
 */

/**
 * @typedef {Object} MessageInit
 * @property {Array<RecordInit>} records
 */


export const MIME_APPLICATION_OCTET_STREAM = 'application/octet-stream'


// Message
export const CONTEXT_ROOT = ''
export const CONTEXT_SMART_POSTER = 'smart-poster'
export const CONTEXT_LOCAL = 'local'
export const CONTEXT_EXTERNAL = 'external'

// Record Buffer
export const TNF_EMPTY = 0x00
export const TNF_WELL_KNOWN = 0x01
export const TNF_MIME = 0x02
export const TNF_ABSOLUTE_URL = 0x03
export const TNF_EXTERNAL = 0x04
export const TNF_UNKNOWN = 0x05
export const TNF_UNCHANGED = 0x06
export const TYPE_NAME_FORMAT = {
	[TNF_EMPTY]: 'empty',
	[TNF_WELL_KNOWN]: 'well-known',
	[TNF_MIME]: 'media-type', // RFC 2046
	[TNF_ABSOLUTE_URL]: 'absolute-uri', // RFC 3986
	[TNF_EXTERNAL]: 'external',
	[TNF_UNKNOWN]: 'unknown',
	[TNF_UNCHANGED]: 'unchanged',
	7: 'reserved'
}


// Record Object
export const RECORD_TYPE_EMPTY = 'empty'
export const RECORD_TYPE_URL = 'url'
export const RECORD_TYPE_TEXT = 'text'
export const RECORD_TYPE_SMART_POSTER = 'smart-poster'
export const RECORD_TYPE_MIME = 'mime'
export const RECORD_TYPE_ABSOLUTE_URL = 'absolute-url'
export const RECORD_TYPE_UNKNOWN = 'unknown'

export const KNOWN_RECORD_TYPES = [
	RECORD_TYPE_EMPTY,
	RECORD_TYPE_URL,
	RECORD_TYPE_TEXT,
	RECORD_TYPE_SMART_POSTER,
	RECORD_TYPE_MIME,
	RECORD_TYPE_ABSOLUTE_URL,
	RECORD_TYPE_UNKNOWN
]

export const WELL_KNOWN_TYPE_TEXT = 'T'
export const WELL_KNOWN_TYPE_URL = 'U'
export const WELL_KNOWN_TYPE_SMART_POSTER = 'Sp'
export const WELL_KNOWN = {
	[WELL_KNOWN_TYPE_TEXT]: RECORD_TYPE_TEXT,
	[WELL_KNOWN_TYPE_URL]: RECORD_TYPE_URL,
	[WELL_KNOWN_TYPE_SMART_POSTER]: RECORD_TYPE_SMART_POSTER
	// Sig
	// Hc (handover carrier)
	// Hr (handover request)
	// Hs (handover selected)
}
export const SMART_POSTER_ACTION = 'act'
export const SMART_POSTER_SIZE = 's'
export const SMART_POSTER_TYPE = 't'

export const RECORD_TYPE_SMART_POSTER_SIZE = ':' + SMART_POSTER_SIZE
export const RECORD_TYPE_SMART_POSTER_TYPE = ':' + SMART_POSTER_TYPE
export const RECORD_TYPE_SMART_POSTER_ACTION = ':' + SMART_POSTER_ACTION

export const SMART_POSTER_ACTIONS = {
  DO_ACTION: 0,
  SAVE_FOR_LATER: 1,
  OPEN_FOR_EDIT: 2
}
export const SMART_POSTER_ACTIONS_MAP = {
	[SMART_POSTER_ACTIONS.DO_ACTION]: 'Do Action',
	[SMART_POSTER_ACTIONS.SAVE_FOR_LATER]: 'Save For Later',
	[SMART_POSTER_ACTIONS.OPEN_FOR_EDIT]: 'Open For Editing',
}

export const RECORD_TYPE_LOCAL_TYPE_PREFIX = ':'
export const LOCAL_TYPE_MAX_LENGTH = 255

export const RECORD_TYPE_EXTERNAL_PREFIX = 'urn:nfc:ext:'
export const RECORD_TYPE_EXTERNAL_SEPARATOR = ':'
export const RECORD_TYPE_EXTERNAL_MAX_LENGTH = 255

export const WELL_KNOWN_TYPE_TEXT_LANG_MASK = 0b0011_1111
export const WELL_KNOWN_TYPE_TEXT_UTF8_MASK = 0b1000_0000
export const RECORD_TYPE_TEXT_MAX_LANG_LENGTH = 63
export const RECORD_TYPE_TEXT_DEFAULT_LANG = 'en'
export const ENCODING_UTF8 = 'utf-8'
export const RECORD_TYPE_TEXT_DEFAULT_ENCODING = ENCODING_UTF8
export const RECORD_TYPE_TEXT_KNOWN_ENCODINGS = [
	ENCODING_UTF8, 'utf-16', 'utf-16le', 'utf-16be'
]

export const URI_PREFIX_ID_NONE = 0x00
export const URI_PREFIX = {
	// 0x00: '',
	0x01: 'http://www.',
	0x02: 'https://www.',
	0x03: 'http://',
	0x04: 'https://',
	0x05: 'tel:',
	0x06: 'mailto:',
	0x07: 'ftp://anonymous:anonymous@',
	0x08: 'ftp://ftp.',
	0x09: 'ftps://',
	0x0A: 'sftp://',
	0x0B: 'smb://',
	0x0C: 'nfs://',
	0x0D: 'ftp://',
	0x0E: 'dav://',
	0x0F: 'news:',
	0x10: 'telnet://',
	0x11: 'imap:',
	0x12: 'rtsp://',
	0x13: 'urn:',
	0x14: 'pop:',
	0x15: 'sip:',
	0x16: 'sips:',
	0x17: 'tftp:',
	0x18: 'btspp://',
	0x19: 'btl2cap://',
	0x1A: 'btgoep://',
	0x1B: 'tcpobex://',
	0x1C: 'irdaobex://',
	0x1D: 'file://',
	0x1E: 'urn:epc:id:',
	0x1F: 'urn:epc:tag:',
	0x20: 'urn:epc:pat:',
	0x21: 'urn:epc:raw:',
	0x22: 'urn:epc:',
	0x23: 'urn:nfc:',
}



