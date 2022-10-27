/**
 * 
 * @param {ReadableStream} tar 
 * return AsyncIterator Object
 */
export async function *entries(tar) {

  const reader = tar.getReader();
  let {done,value} = await reader.read();

}