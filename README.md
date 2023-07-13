[![npm](https://img.shields.io/npm/v/browser-stream-tar.svg)](https://www.npmjs.com/package/browser-stream-tar)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![bundlejs](https://deno.bundlejs.com/?q=browser-stream-tar\&badge=detailed)](https://bundlejs.com/?q=browser-stream-tar)
[![downloads](http://img.shields.io/npm/dm/browser-stream-tar.svg?style=flat-square)](https://npmjs.org/package/browser-stream-tar)
[![GitHub Issues](https://img.shields.io/github/issues/k0nsti/browser-stream-tar.svg?style=flat-square)](https://github.com/k0nsti/browser-stream-tar/issues)
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fk0nsti%2Fbrowser-stream-tar%2Fbadge\&style=flat)](https://actions-badge.atrox.dev/k0nsti/browser-stream-tar/goto)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/k0nsti/browser-stream-tar/badge.svg)](https://snyk.io/test/github/k0nsti/browser-stream-tar)
[![Coverage Status](https://coveralls.io/repos/k0nsti/browser-stream-tar/badge.svg)](https://coveralls.io/github/k0nsti/browser-stream-tar)

# browser-stream-tar

extract tar entries from web streams

# example

```js
import { entries } from "browser-stream-tar";

const response = await fetch("some tar file");
for await (const entry of entries(response.body)) {
  console.log(entry.name);
  // do something with entry.stream
}
```

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

*   [BLOCKSIZE](#blocksize)
*   [TarEntry](#tarentry)
    *   [Properties](#properties)
*   [decodePaxHeader](#decodepaxheader)
    *   [Parameters](#parameters)
*   [decodeHeader](#decodeheader)
    *   [Parameters](#parameters-1)
*   [entries](#entries)
    *   [Parameters](#parameters-2)
*   [enqueue](#enqueue)
*   [buffer](#buffer)
*   [files](#files)
    *   [Parameters](#parameters-3)
*   [toString](#tostring)
    *   [Parameters](#parameters-4)
*   [toInteger](#tointeger)
    *   [Parameters](#parameters-5)
*   [fill](#fill)
    *   [Parameters](#parameters-6)
*   [skip](#skip)
    *   [Parameters](#parameters-7)
*   [streamToUint8Array](#streamtouint8array)
    *   [Parameters](#parameters-8)

## BLOCKSIZE

Field Name   Byte Offset     Length in Bytes Field Type
name         0               100             NUL-terminated if NUL fits
mode         100             8
uid          108             8
gid          116             8
size         124             12
mtime        136             12
chksum       148             8
typeflag     156             1               see below
linkname     157             100             NUL-terminated if NUL fits
magic        257             6               must be TMAGIC (NUL term.)
version      263             2               must be TVERSION
uname        265             32              NUL-terminated
gname        297             32              NUL-terminated
devmajor     329             8
devminor     337             8
prefix       345             155             NUL-terminated if NUL fits

Type: [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)

## TarEntry

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

### Properties

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `size` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;
*   `mode` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;
*   `uname` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `gname` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `uid` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;
*   `gid` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;
*   `mtime` **[Date](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date)**&#x20;
*   `stream` **ReadableStream**&#x20;

## decodePaxHeader

*   **See**: <https://www.systutorials.com/docs/linux/man/5-star/>

Decodes a PAX header

### Parameters

*   `reader` **ReadableStreamReader** where to read from
*   `buffer` **[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)**&#x20;
*   `header` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** to be filled with values form buffer

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)>** buffer positioned after the consumed bytes

## decodeHeader

Decodes the next header.

### Parameters

*   `reader` **ReadableStreamReader<[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)>** where to read from
*   `buffer` **([Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))**&#x20;
*   `header` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** to be filled with values form buffer and reader

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<([Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))>** buffer positioned after the consumed bytes

## entries

Provide tar entry iterator.

### Parameters

*   `tar` **ReadableStream**&#x20;

Returns **AsyncIterator<[TarEntry](#tarentry)>**&#x20;

## enqueue

\--512--|-----512------|
|  R |     O   |
|
DDDDDDDDDDDD---------HHHH
|    |         |
A0   A0        A1

## buffer

+--------- size --------+
|         +- remaining -+- overflow -+
|         |             |            |
HDD ... DDDDDDDDDDDDDDDDDD------------HHHHHH
\[BUFFER .... ]             \[BUFFER ... ]
+-----------  skip --------+

## files

Provide tar entries as Files.

### Parameters

*   `tar` **ReadableStream**&#x20;

Returns **AsyncIterator\<File>**&#x20;

## toString

Convert bytes into string

### Parameters

*   `bytes` **[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)**&#x20;

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

## toInteger

Convert ASCII octal number into number

### Parameters

*   `bytes` **[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)**&#x20;

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;

## fill

Read bytes from a reader and append them to a given buffer until a requested length of the buffer is reached

### Parameters

*   `reader` **ReadableStreamReader<[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)>** where to read from
*   `buffer` **([Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** initial buffer or undefined
*   `length` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** desired buffer length

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<([Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))>** filled up buffer

## skip

Skip some bytes from a buffer

### Parameters

*   `reader` **ReadableStreamReader<[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)>** where to read from
*   `buffer` **[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)**&#x20;
*   `length` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** to be skipped

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)>** buffer positionend after skipped bytes

## streamToUint8Array

Reads web stream content into a Uint8Array.

### Parameters

*   `stream` **ReadableStream**&#x20;

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)>**&#x20;

# install

With [npm](http://npmjs.org) do:

```shell
npm install browser-stream-tar
```

# license

BSD-2-Clause
