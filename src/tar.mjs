/**
 *    Field Name   Byte Offset     Length in Bytes Field Type
 *  name         0               100             NUL-terminated if NUL fits
 *  mode         100             8
 *  uid          108             8
 *  gid          116             8
 *  size         124             12
 *  mtime        136             12
 *  chksum       148             8
 *  typeflag     156             1               see below
 *  linkname     157             100             NUL-terminated if NUL fits
 *  magic        257             6               must be TMAGIC (NUL term.)
 *  version      263             2               must be TVERSION
 *  uname        265             32              NUL-terminated
 *  gname        297             32              NUL-terminated
 *  devmajor     329             8
 *  devminor     337             8
 *  prefix       345             155             NUL-terminated if NUL fits
 */

const BLOCKSIZE = 512;

const DECODER = new TextDecoder();

/**
 * Decodes a PAX header
 * @see https://www.systutorials.com/docs/linux/man/5-star/
 * @param {ReadableStreamReader<Uint8Array>} reader where to read from
 * @param {Uint8Array} buffer
 * @param {Object} header to be filled with values form buffer
 * @returns {Promise<Uint8Array>} buffer positioned after the consumed bytes
 */
export async function decodePaxHeader(reader, buffer, header) {
  buffer = await fill(reader, buffer, BLOCKSIZE);

  for (const line of DECODER.decode(buffer).split(/\n/)) {
    const m = line.match(/^\d+ ([^=]+)=(.*)/);
    if (m) {
      let key = m[1];
      if (key === "path") {
        key = "name";
      }
      header[key] = m[2];
    }
  }

  return buffer.subarray(BLOCKSIZE);
}

function decodeBase(buffer, file) {
  file.mode = decodeInteger(buffer.subarray(100, 108));
  file.uid = decodeInteger(buffer.subarray(108, 116));
  file.gid = decodeInteger(buffer.subarray(116, 124));
  file.size = decodeInteger(buffer.subarray(124, 136));
  file.lastModified = new Date(1000 * decodeInteger(buffer.subarray(136, 148)));
  //file.magic = decodeString(buffer.subarray(257, 265));
  file.uname = decodeString(buffer.subarray(265, 297));
  file.gname = decodeString(buffer.subarray(297, 329));

  const name = decodeString(buffer.subarray(0, 100));
  const prefix = decodeString(buffer.subarray(345, 500));
  file.name = prefix.length ? prefix + "/" + name : name;
}

/**
 * Decodes the next header.
 * @param {ReadableStreamReader<Uint8Array>} reader where to read from
 * @param {Uint8Array|undefined} buffer
 * @param {Object} header to be filled with values form buffer and reader
 * @returns {Promise<Uint8Array|undefined>} buffer positioned after the consumed bytes
 */
export async function decodeHeader(reader, buffer, header) {
  while ((buffer = await fill(reader, buffer, BLOCKSIZE))) {
    if (buffer[0] === 0) break;

    const type = buffer[156];

    switch (type) {
      case 49: // '1' link
      case 50: // '2' reserved
      case 51: // '3' character special
      case 52: // '4' block special
      case 53: // '5' directory
      case 54: // '6' FIFO special
      case 55: // '7' reserved
      case 86: // 'V' tape/volume header Ignore on extraction
        buffer = buffer.subarray(BLOCKSIZE);
        break;

      case 76: // 'L' NEXT file has a long name
        decodeBase(buffer, header);
        buffer = await fill(reader, buffer, BLOCKSIZE);
        header.name = toString(buffer.subarray(0, BLOCKSIZE));
        //console.log("NAME", header.name);
        return buffer.subarray(BLOCKSIZE);
        break;

      case 103: // 'g' Global extended header
      case 120: // 'x' Extended header referring to the next file in the archive
        buffer = buffer.subarray(BLOCKSIZE);
        return decodeHeader(
          reader,
          await decodePaxHeader(reader, buffer, header),
          header
        );

      case 0: //     regular file
      case 48: // '0' regular file
        decodeBase(buffer, header);
        return buffer.subarray(BLOCKSIZE);

      default:
        throw new Error(`Unsupported header type ${type}`);
    }
  }
}

/**
 * Provide tar entry iterator.
 * @param {ReadableStream} tar
 * @return {AsyncIterable<File>}
 */
export async function* files(tar) {
  const reader = tar.getReader();

  let buffer, header;

  while ((buffer = await decodeHeader(reader, buffer, (header = {})))) {
    let consumed = false;

    if (header.prefix) {
      if (header.prefix.length) {
        header.name = header.prefix + "/" + header.name;
      }
      delete header.prefix;
    }

    const stream = new ReadableStream({
      async pull(controller) {
        let remaining = header.size;
        while (remaining >= buffer.length) {
          remaining = remaining - buffer.length;
          controller.enqueue(buffer);
          buffer = await fill(reader);
        }

        /**
         * --512--|-----512------|
         *        |  R |     O   |
         *        |
         *  DDDDDDDDDDDD---------HHHH
         *        |    |         |
         *        A0   A0        A1
         *
         */
        controller.enqueue(buffer.subarray(0, remaining));

        /**
         *  +--------- size --------+
         *  |         +- remaining -+- overflow -+
         *  |         |             |            |
         * HDD ... DDDDDDDDDDDDDDDDDD------------HHHHHH
         *            [BUFFER .... ]             [BUFFER ... ]
         *            +-----------  skip --------+
         */
        buffer = await skip(reader, buffer, remaining + overflow(header.size));

        controller.close();
        consumed = true;
      }
    });

    yield new StreamFile(stream, header.name, header);

    if (!consumed) {
      const reader = stream.getReader();
      while (!(await reader.read()).done);
    }
  }
}

/**
 * Convert bytes into string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function decodeString(bytes) {
  const i = bytes.findIndex(b => b === 0);
  return DECODER.decode(i < 0 ? bytes : bytes.subarray(0, i));
}

/**
 * Convert ASCII octal number into number.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function decodeInteger(bytes) {
  return parseInt(decodeString(bytes), 8);
}

export function encodeInteger(buffer, offset, number, length) {
  for (const s of number.toString(8).padStart(length, "0")) {
    buffer[offset++] = s.charCodeAt(0);
  }
}
export function encodeString(buffer, offset, string, length) {
  for (let i = 0; i < length; i++) {
    buffer[offset + i] = string.charCodeAt(i);
  }
}

export function checksum(buffer) {
  let sum = 0;

  for (let i = 0; i < BLOCKSIZE; i++) {
    sum += i >= 148 && i < 156 ? 32 : buffer[i];
  }

  return sum;
}

export function overflow(size) {
  size &= BLOCKSIZE - 1;
  return size && BLOCKSIZE - size;
}

/**
 * Read bytes from a reader and append them to a given buffer until a requested length of the buffer is reached.
 * @param {ReadableStreamReader<Uint8Array>} reader where to read from
 * @param {Uint8Array} [buffer] initial buffer or undefined
 * @param {number} [length] desired buffer length
 * @returns {Promise<Uint8Array|undefined>} filled up buffer
 */
export async function fill(reader, buffer, length) {
  if (buffer?.length >= length) {
    return buffer;
  }

  do {
    const { done, value } = await reader.read();
    if (done) {
      return undefined;
    }

    if (buffer === undefined) {
      buffer = value;
    } else {
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
    }
  } while (buffer.length < length);

  return buffer;
}

/**
 * Skip some bytes from a buffer.
 * @param {ReadableStreamReader<Uint8Array>} reader where to read from
 * @param {Uint8Array} buffer
 * @param {number} length to be skipped
 * @returns {Promise<Uint8Array|undefined>} buffer positionend after skipped bytes
 */
export async function skip(reader, buffer, length) {
  return (await fill(reader, buffer, length))?.subarray(length);
}

/**
 * Reads web stream content into a Uint8Array.
 * @param {ReadableStream} stream
 * @returns {Promise<Uint8Array>}
 */
async function streamToUint8Array(stream) {
  const reader = stream.getReader();

  let buffer = new Uint8Array();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const newBuffer = new Uint8Array(buffer.length + value.length);
    newBuffer.set(buffer);
    newBuffer.set(value, buffer.length);
    buffer = newBuffer;
  }

  return buffer;
}

export const extension2Mime = {
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".xml": "application/xml",
  ".tar": "application/x-tar"
};

export function typeFromName(name) {
  if (name.match(/\._/)) {
    return "application/octet-stream";
  }
  const m = name.match(/(\.\w+)$/);
  return extension2Mime[m?.[1]] || "application/octet-stream";
}

export class StreamFile extends File {
  #stream;
  #lastModified;
  #size;
  constructor(stream, name, options) {
    super([], name, options);
    this.#stream = stream;
    this.#lastModified = options.lastModified;
    this.#size = options.size;
    this.mode = options.mode;
    this.uid = options.uid;
    this.gid = options.gid;
    this.uname = options.uname;
    this.gname = options.gname;
  }

  stream() {
    return this.#stream;
  }

  async text() {
    return new TextDecoder().decode(await streamToUint8Array(this.#stream));
  }

  get type() {
    return typeFromName(this.name);
  }

  get lastModified() {
    return this.#lastModified;
  }

  get size() {
    return this.#size;
  }
}
