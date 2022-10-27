/**
 *
 * @param {ReadableStream} tar
 * return AsyncIterator Object
 */
export async function* entries(tar) {
  const reader = tar.getReader();
  let { done, value } = await reader.read();

  const name = toString(value.subrray(0, 100));

  yield { name };
}

function toString(bytes) {
  const chars = [];
  for (const i = 0; i < bytes.length; ) {
    chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
  }
  return String.fromCharCode.apply(null, chars);
}
