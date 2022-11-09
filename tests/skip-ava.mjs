import test from "ava";
import { skip } from "../src/tar.mjs";

test("skip zero", async t => {
  const dummyReader = {};

  t.deepEqual(
    await skip(dummyReader, new Uint8Array([0x00, 0x01]), 0),
    new Uint8Array([0x00, 0x01])
  );
});
test("skip some without refill", async t => {
  const dummyReader = {};

  t.deepEqual(
    await skip(dummyReader, new Uint8Array([0x00, 0x01, 0x03]), 2),
    new Uint8Array([0x03])
  );
});

test("skip some with fill", async t => {
  const dummyReader = {
    read: async () => {
      return { done: false, value: new Uint8Array([0x02, 0x03, 0x04]) };
    }
  };

  t.deepEqual(
    await skip(dummyReader, new Uint8Array([0x00, 0x01]), 4),
    new Uint8Array([0x04])
  );
});
