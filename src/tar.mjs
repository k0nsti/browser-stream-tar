/**
 *
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
 * @typedef {Object} TarStreamEntry
 * @property {string} name
 * @property {number} size
 * @property {number} mode
 * @property {ReadableStream} stream
 */

/**
 * Decodes a PAX header
 * @see https://www.systutorials.com/docs/linux/man/5-star/
 * @param {ReadableStreamReader} reader where to read from
 * @param {UInt8Array} buffer
 * @param {Object} header to be filled with values form buffer
 * @returns {UInt8Array} buffer positioned after the consumed bytes
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

/**
 * Decodes header
 * @param {ReadableStreamReader} reader where to read from
 * @param {UInt8Array} buffer
 * @param {Object} header to be filled with values form buffer and reader
 * @returns {UInt8Array} buffer positioned after the consumed bytes
 */
export async function decodeHeader(reader, buffer, header) {
  buffer = await fill(reader, buffer, BLOCKSIZE);

  if (buffer[0] !== 0) {
    const type = buffer[156];

    switch (type) {
      case 0:
      case 48:
      case 120:
        if (header.name === undefined) {
          header.name = toString(buffer.subarray(0, 100));
        }
        header.size = toInteger(buffer.subarray(124, 136));
        header.mode = toInteger(buffer.subarray(100, 108));
        header.mtime = new Date(1000 * toInteger(buffer.subarray(136, 148)));

        buffer = buffer.subarray(BLOCKSIZE);

        if (type === 120) {
          return decodeHeader(
            reader,
            await decodePaxHeader(reader, buffer, header),
            header
          );
        }

        return buffer;

      default:
        throw new Error(`Unsupported header type ${type}`);
    }
  }
}

/**
 * Provide tar entry iterator.
 * @param {ReadableStream} tar
 * @return {AsyncIterator<TarStreamEntry>}
 */
export async function* entries(tar) {
  const reader = tar.getReader();

  let buffer, header;

  while ((buffer = await decodeHeader(reader, buffer, (header = {})))) {
    let consumed = false;
    header.stream = new ReadableStream({
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

    yield header;

    if (!consumed) {
      const reader = header.stream.getReader();

      let result;
      do {
        result = await reader.read();
      } while (!result.done);
    }
  }
}


/**
 * Convert bytes into string
 * @param {UInt8Array} bytes
 * @returns {string}
 */
export function toString(bytes) {
  const i = bytes.findIndex(b => b === 0);
  return DECODER.decode(i < 0 ? bytes : bytes.subarray(0, i));
}

/**
 * Convert ASCII octal number into number
 * @param {UInt8Array} bytes
 * @returns {number}
 */
export function toInteger(bytes) {
  return parseInt(toString(bytes), 8);
}

export function overflow(size) {
  size &= BLOCKSIZE - 1;
  return size && BLOCKSIZE - size;
}

/**
 * Read bytes from a reader and append them to a given buffer until a requested length of the buffer is reached
 * @param {ReadableStreamReader} reader where to read from
 * @param {UInt8Array} buffer initial buffer of undefined
 * @param {number} length desired buffer length
 * @returns {UInt8Array} filled up buffer
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
 * Skip some bytes from a buffer
 * @param {ReadableStreamReader} reader where to read from
 * @param {Uint8Array} buffer
 * @param {number} length to be skipped
 * @returns {UInt8Array} buffer positionend after skipped bytes
 */
export async function skip(reader, buffer, length) {
  buffer = await fill(reader, buffer, length);
  return buffer.subarray(length);
}
