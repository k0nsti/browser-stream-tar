import { files } from "browser-stream-tar";

export const tars = {
  /*  "unicode-bsd2.tar": [
    {
      name: "høllø.txt",
      type: "text/plain",
      mode: 0o644,
      "LIBARCHIVE.xattr.com.apple.quarantine":
        "MDA4Mzs2MzZmNzJjOTtTYWZhcmk7QTYwRUIxRTAtRENENy00MjhFLTk1N0QtQzEyQTk2MzZFRjdC"
    }
  ],*/
  "test.tar": [
    { name: "a.txt", type: "text/plain" },
    { name: "b.csv", type: "text/csv" },
    { name: "z.doc" }
  ],
  "bytes.tar": [
    {
      name: "0.bytes",
      mode: 0o644,
      lastModified: new Date("2022-11-10T20:00:07+0000")
    },
    { name: "1.bytes", uid: 501, gid: 20, gname: "staff", uname: "markus" },
    { name: "511.bytes" },
    { name: "512.bytes" },
    { name: "513.bytes" }
  ],
  "v7.tar": [{ name: "test.txt", type: "text/plain" }],
  //  "unicode.tar": [{ name: "høstål.txt", type: "text/plain" }],
  "unicode-bsd.tar": [{ name: "høllø.txt", type: "text/plain" }],
  //  "global-header.tar": [{ name: "ab", type: "application/octet-stream" }],
 /* "gnutar-long-names.tar": [
    {
      name: "a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/file.txt",
      type: "text/plain"
    }
  ]*/
};

export async function assertTarStreamFiles(
  t,
  stream,
  entryNames = [],
  entryStream = async name => {}
) {
  let i = 0;
  for await (const entry of files(stream)) {
    for (const [k, v] of Object.entries(entryNames[i])) {
      t.deepEqual(
        entry[k],
        v,
        `[${i} '${entry.name}'].${k} ${JSON.stringify(entry)}`
      );
    }

    const es = await entryStream(entry.name);
    if (es) {
      console.log("CONTENT", `[${i}]`);
      await compareReadables(
        t,
        es.getReader(),
        (await entry.stream()).getReader(),
        `[${i}].stream`
      );
    } else {
      console.log("NOTHING TO COMPARE", `[${i}]`);
    }
    i++;
  }

  t.is(i, entryNames.length, "number of files");
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
