
export async function readControlChunkSize(stream,chunkSize = 1 * 1024 * 1024) {

  const reader = stream.getReader();

let buffer;

const readableWithDefinedChunks = new ReadableStream({
  async pull(controller) {
    let fulfilledChunkQuota = false;

    while (!fulfilledChunkQuota) {
      const status = await reader.read();

      if (!status.done) {
        const chunk = status.value;

        buffer = new Uint8Array([...(buffer || []), ...chunk]);

        while (buffer.byteLength >= chunkSize) {
          const chunkToSend = buffer.slice(0, chunkSize);
          controller.enqueue(chunkToSend);
          buffer = new Uint8Array([...buffer.slice(chunkSize)]);
          fulfilledChunkQuota = true;
        }
      }
      if (status.done) {
        fulfilledChunkQuota = true;
        if (buffer.byteLength > 0) {
          controller.enqueue(buffer);
        }
        controller.close();
      }
    }
  },
});

return readableWithDefinedChunks
}