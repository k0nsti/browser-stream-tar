import { entries } from "browser-stream-tar";

export const tars = {
  "unicode-bsd2.tar": [
    {
      name: "høllø.txt",
      mode: 0o644,
      "LIBARCHIVE.xattr.com.apple.quarantine":
        "MDA4Mzs2MzZmNzJjOTtTYWZhcmk7QTYwRUIxRTAtRENENy00MjhFLTk1N0QtQzEyQTk2MzZFRjdC"
    }
  ],
  "test.tar": [{ name: "a.txt" }, { name: "b.csv" }, { name: "z.doc" }],
  "bytes.tar": [
    { name: "0.bytes", mode: 0o644, mtime: new Date("2022-11-10T21:00:07") }, // TODO TZ aware ?
    { name: "1.bytes", uid: 501, gid: 20, gname: "staff", uname: "markus" },
    { name: "511.bytes" },
    { name: "512.bytes" },
    { name: "513.bytes" }
  ],
  "v7.tar": [{ name: "test.txt" }],
  "unicode.tar": [{ name: "høstål.txt" }],
  "unicode-bsd.tar": [{ name: "høllø.txt" }],
  "global-header.tar": [{ name: "ab" }]
};

export async function assertTarStreamEntries(
  t,
  stream,
  entryNames = [],
  entryStream = async name => {}
) {
  let i = 0;
  for await (const entry of entries(stream)) {
    for (const [k, v] of Object.entries(entryNames[i])) {
      t.deepEqual(entry[k], v, `[${i}].${k}`);
    }

    const es = await entryStream(entry.name);
    if (es) {
      await compareReadables(
        t,
        es.getReader(),
        entry.stream.getReader(),
        `[${i}].stream`
      );
    }
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
  const [av, bv] = await Promise.all([readAll(a), readAll(b)]);
  t.deepEqual(av, bv, message);
}
