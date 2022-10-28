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

  while (true) {
    let { done, value } = await reader.read();
    if (done) {
      break;
    }

    for (let pos = 0; pos < value.length; ) {
      const name = toString(value.subarray(pos + 0, pos + 100));
      const size = toInteger(value.subarray(pos + 124, pos + 124 + 12));

      if (Number.isNaN(size)) {
        break;
      }

      console.log(pos, name, size);

      const stream = new ReadableStream({
        start() {},
        cancel() {},

        async pull(controller) {
          /*
          controller.close();
        */
          controller.enqueue(
            value.subarray(pos + BLOCKSIZE, pos + BLOCKSIZE + size)
          );
        }
      });

      // console.log(size, overflow(size));

      yield { name, size, stream };

      pos += BLOCKSIZE + size + overflow(size);
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
