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

/**
 *
 * @param {ReadableStream} tar
 * @return {AsyncIterator<Object>}
 */
export async function* entries(tar) {
  const reader = tar.getReader();
  let { done, value } = await reader.read();

  const name = toString(value.subarray(0, 100));
  const size = toInteger(value.subarray(124, 124 + 12));

  const stream = {
    getReader() {
      return {
        async read() {
          return { value: value.subarray(512, 512 + size), done: true };
        }
      };
    }
  };

  // let n = 512 + ((size + 511) % 512);
  // console.log(size,512 - (size % 512));

  yield { name, size, stream };
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
