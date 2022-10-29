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

  let buffer = new Uint8Array();

  async function fillBuffer() {
    let { done, value } = await reader.read();
    if (done) {
      return false;
    }
    const newBuffer = new Uint8Array(buffer.length + value.length);
    console.log("FILLBUFFER", buffer.length, value.length);
    newBuffer.set(buffer);
    console.log('1')
    newBuffer.set(value);
    buffer = newBuffer;
console.log("finish fill buffer")
    return true;
  }

  while (true) {
    console.log('bla')
    if (!(await fillBuffer())) {
      console.log("finish fill")
      break;
    }
console.log('xxxx')
    while (buffer.length >= BLOCKSIZE) {
      console.log("start header", buffer.length);
      const name = toString(buffer.subarray(0, 100));
      const size = toInteger(buffer.subarray(124, 124 + 12));
      console.log("header size", buffer.length, name, size);
      if (Number.isNaN(size)) {
        break;
      }

      //console.log(name, size);

      const stream = new ReadableStream({
        start() {},
        cancel() {},

        async pull(controller) {
          let remaining = size;
          while (remaining > 0) {
            if (buffer.length - BLOCKSIZE > remaining) {
              console.log("return daten wenn buffer größer als nötig ist", remaining);
              controller.enqueue(
                buffer.subarray(BLOCKSIZE, BLOCKSIZE + remaining)
              );
              remaining = remaining - buffer.length;
              buffer = buffer.subarray(
                BLOCKSIZE + remaining + overflow(remaining)
              );
            } else {
              console.log("return daten wenn buffer kleiner als nötig ist", remaining);
              remaining = remaining - buffer.length;
              controller.enqueue(buffer.subarray(BLOCKSIZE));
              buffer = new Uint8Array();
            }
          }
        },
      });

      yield { name, size, stream };

      //buffer = buffer.subarray(BLOCKSIZE + size + overflow(size));
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
