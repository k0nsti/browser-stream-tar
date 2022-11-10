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

/**
 *
 * @param {ReadableStream} tar
 * @return {AsyncIterator<Object>}
 */
export async function* entries(tar) {
  const reader = tar.getReader();

  let buffer;

  while ((buffer = await fill(reader, buffer, BLOCKSIZE)) && buffer[0] !== 0) {
    const name = toString(buffer.subarray(0, 100));
    const size = toInteger(buffer.subarray(124, 124 + 12));
    //console.log(name, "header", size);

    buffer = buffer.subarray(BLOCKSIZE);
    const stream = new ReadableStream({
      async pull(controller) {
        let remaining = size;
        while (remaining >= buffer.length) {
          remaining = remaining - buffer.length;
          //console.log(name, "enqueue", buffer.length, "remaining", remaining);
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
        //console.log(name, "enqueue", remaining, "bufferLength", );

        controller.enqueue(buffer.subarray(0, remaining));

        /**
         * 
         *  +--------- size --------+
         *  |         +- remaining -+- overflow -+
         *  |         |             |            |
         * HDD ... DDDDDDDDDDDDDDDDDD------------HHHHHH
         *            [BUFFER .... ]
         *             --- skip --->             [BUFFER ... ]
         */                                 
        buffer = await skip(reader, buffer, remaining + overflow(size));

        //console.log("buffer text",toString(buffer))
       /* console.log(
          name,
          "present",
          buffer.length,
          String.fromCharCode(
            buffer[0],
            buffer[1],
            buffer[2],
            buffer[3],
            buffer[4]
          )
        );*/

        controller.close();
      }
    });

    yield { name, size, stream };
  }
}

export function toString(bytes) {
  const chars = [];
  for (let i = 0; i < bytes.length && bytes[i] !== 0; ) {
    chars.push(bytes[i++]);
  }
  return String.fromCharCode(...chars);
}

export function toInteger(bytes) {
  return parseInt(toString(bytes), 8);
}

export function overflow(size) {
  size &= BLOCKSIZE - 1;
  return size && BLOCKSIZE - size;
}

/**
 * Read more bytes from the reader and append them to a given buffer until a request length of the buffer is reached
 * @param {ReadableStreamReader} reader where to read from
 * @param {UInt8Array} buffer initial buffer of undefined
 * @param {Number} length desired buffer length
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
 * @param {Number} length
 * @returns {UInt8Array} buffer filled after skipped bytes
 */
export async function skip(reader, buffer, length) {
  buffer = await fill(reader, buffer, length);
  return buffer.subarray(length);
}
