import { entries } from "browser-stream-tar";

export async function assertTarStreamEntries(
  t,
  stream,
  entryNames = [],
  getEntry = async name => {}
) {
  const e = [
    {
      name: "a.txt",
      size: 23,
      content: new Uint8Array([
        0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
        0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61, 0x74, 0x65, 0x69
      ])
    },
    {
      name: "b.csv",
      size: 13,
      content: new Uint8Array([
        0x43, 0x20, 0x53, 0x20, 0x56, 0x20, 0x46, 0x20, 0x49, 0x20, 0x4c, 0x20,
        0x45
      ])
    },
    {
      name: "z.doc",
      size: 23,
      content: new Uint8Array([
        0x44, 0x69, 0x65, 0x20, 0x44, 0x6f, 0x6b, 0x75, 0x6d, 0x65, 0x6e, 0x74,
        0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x44, 0x61, 0x74, 0x65, 0x69
      ])
    }
  ];

  let i = 0;
  for await (const entry of entries(stream)) {
    t.is(entry.name, e[i].name, "name");
    t.is(entry.size, e[i].size, "size");

    const reader = entry.stream.getReader();
    const { done, value } = await reader.read();
    t.is(value.length, entry.size);
    t.deepEqual(value, e[i].content);
    i++;
  }
  t.is(i,entryNames.length)
}
