# NDEF

![CI](https://github.com/johntalton/st25dv/workflows/CI/badge.svg)

NDEF encode and decode library.

Follows [Web NFC](https://w3c.github.io/web-nfc) Spec conventions.

With support for Capability Container and Type 5 wrapper objects.

## Encoder / Decoder

The Web NFC spec describes two basic format/class structures when working with NDEF - `NDEFMessage` and `NDEFRecord`.

A Message is a wrapper type for a list of records.

Each record represents an object having `recordType` and `data` properties (as well as other depending on type).

There are a wide range of "Well Known" record types supported.

## Common recordTypes

In most case the `data` field of the record is an `ArrayBuffer` or `ArrayBufferView` (aka `Uint8Array`). However, some well know types are parsed for the user.

- `'empty'`
- `'url'` - data is URL string
- `'text'`
- `'smart-poster'` - data is `NDEFMessage` call `toRecords` to iterate or access data directly to parse in application space.
- `'mime'` - `mediaType` contains further information about data
- `'absolute-url'` - data is a URL string
- `'unknown'`


## Example Decoding with CC wrapper

```javascript
import { CapabilityContainer } from '@johntalton/ndef'

// see st25dv https://github.com/johntalton/st25dv for init
const st25dv = new ST25DVUser(/* ... */)

 // read 64 bytes starting at offset 0
const buffer = await st25dv.readMemory(0, 64)

const cc = CapabilityContainer.decode(buffer)
for(const record of cc.message.records) {
  const { recordType, id, data } = record

  console.log('id:', id)
  console.log('recordType:', recordType)
  if(recordType === 'mime' && record.mediaType === 'application/json') {
    const decoder = new TextDecoder()
    const json = JSON.parse(decoder.decode(data))
  }
  else {
    // do other stuff
  }
}

```

## Example Encoding without CC

```javascript
import { NDEFMessageEncoder, CONTEXT_ROOT } from '@johntalton/ndef'

const buffer = NDEFMessageEncoder.encode({
  records: [
    {
      recordType: 'url',
      data: 'https://github.com/johntalton/ndef'
    },
    {
      recordType: 'text',
      data: 'NDEF library in JS'
    },
  ]
}, CONTEXT_ROOT, 0)

// do something with buffer ...

```

## Capability Container & Type 5 Tag

Included in this library is an implementation of the CC/T5T wrapper format needed to write NDEF Message onto a device (such as the [st25dv](https://github.com/johntalton/st25dv))

The `CapabilityContainer` provides a `encode`/`decode` that will account for the TLV (Type Length Value) container as well as the devices CCFile.

`CapabilityContainer` provides access to permissions for `read` and `write` as well as the root `NDEFMessage` via `message`.

(This has limited testing beyond above mentioned st25dv device and basic memory layout - feedback welcome :P)