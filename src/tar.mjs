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

  while ((buffer = await fill(reader, buffer))) {
    while (buffer.length >= BLOCKSIZE) {
      console.log("start header", buffer.length);
      const name = toString(buffer.subarray(0, 100));
      const size = toInteger(buffer.subarray(124, 124 + 12));
      console.log("header size", buffer.length, name, size);
      buffer = buffer.subarray(BLOCKSIZE);
      if (Number.isNaN(size)) {
        break;
      }

      const stream = new ReadableStream({
        async pull(controller) {
          let remaining = size;
          while (remaining > 0) {
            if (buffer.length > remaining) {
              console.log(
                "return daten wenn buffer größer als nötig ist",
                remaining
              );
              controller.enqueue(buffer.subarray(0, remaining));
              controller.close();

              console.log(
                "remaining",
                remaining,
                "overflow",
                overflow(remaining),
                "buffer länge",
                buffer.length,
                "buffer.subarray:",
                remaining + overflow(remaining)
              );

              buffer = await skip(
                reader,
                buffer,
                remaining + overflow(remaining)
              );

              return;
            } else {
              console.log(
                "return daten wenn buffer kleiner als nötig ist",
                remaining
              );
              remaining = remaining - buffer.length;
              controller.enqueue(buffer);
              buffer = undefined;
            }
          }
        }
      });

      console.log(`++++++yield| name: ${name} size: ${size}`);
      yield { name, size, stream };
    }
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

function overflow(size) {
  size &= BLOCKSIZE - 1;
  return size && BLOCKSIZE - size;
}

/**
 * Read some more bytes from the reader and append them to a given buffer
 * @param {ReadableStreamReader} reader where to read from
 * @param {UInt8Array} buffer initial buffer of undefined
 * @returns {UInt8Array} filled up buffer
 */
export async function fill(reader, buffer) {
  let { done, value } = await reader.read();
  if (done) {
    return undefined;
  }

  console.log("######################FILL", value.length);

  if (buffer === undefined) {
    return value;
  } else {
    const newBuffer = new Uint8Array(buffer.length + value.length);
    newBuffer.set(buffer);
    newBuffer.set(value, buffer.length);
    return newBuffer;
  }
}

/**
 * Skip some bytes from a buffer
 * @param {ReadableStreamReader} reader where to read from
 * @param {Uint8Array} buffer
 * @param {Number} length
 * @returns {UInt8Array} buffer filled after skipped bytes
 */
export async function skip(reader, buffer, length) {
  while (buffer.length <= length) {
    buffer = await fill(reader, buffer);
  }
  return buffer.subarray(length);
}
