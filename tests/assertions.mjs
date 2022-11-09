import { entries } from "browser-stream-tar";

export async function assertTarStreamEntries(
  t,
  stream,
  entryNames = [],
  getEntry = async name => {}
) {
  let i = 0;
  for await (const entry of entries(stream)) {
    t.is(entry.name, entryNames[i], `[${i}].name`);

    const s = await getEntry(entry.name);

    await compareReadables(t, s.getReader(), entry.stream.getReader(), `[${i}].stream`);
    i++;
  }
  t.is(i, entryNames.length);
}

async function readAll(reader) {
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

async function compareReadables(t, a, b, message) {
  const av = await readAll(a);
  const bv = await readAll(b);
  t.deepEqual(av, bv, message);
}
