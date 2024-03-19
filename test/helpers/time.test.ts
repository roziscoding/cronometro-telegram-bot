import { assertEquals } from "@std/assert";
import { ms, parseTime } from "../../src/helpers/time.ts";

Deno.test("parseTime", async (t) => {
  await t.step("parses hours", () => {
    assertEquals(parseTime("1h"), { hours: 1, minutes: 0, days: 0 });
    assertEquals(parseTime("1hr"), { hours: 1, minutes: 0, days: 0 });
    assertEquals(parseTime("1hrs"), { hours: 1, minutes: 0, days: 0 });
  });

  await t.step("parses minutes", () => {
    assertEquals(parseTime("1m"), { hours: 0, minutes: 1, days: 0 });
    assertEquals(parseTime("1min"), { hours: 0, minutes: 1, days: 0 });
    assertEquals(parseTime("1mins"), { hours: 0, minutes: 1, days: 0 });
  });

  await t.step("parses days", () => {
    assertEquals(parseTime("1d"), { hours: 0, minutes: 0, days: 1 });
    assertEquals(parseTime("1day"), { hours: 0, minutes: 0, days: 1 });
    assertEquals(parseTime("1days"), { hours: 0, minutes: 0, days: 1 });
  });

  await t.step("parses multiple", () => {
    const result = parseTime("1h 1m 1d");
    assertEquals(result, { hours: 1, minutes: 1, days: 1 });
  });

  await t.step("parses multiple in any order", () => {
    const result = parseTime("1d 1m 1h");
    assertEquals(result, { hours: 1, minutes: 1, days: 1 });
  });

  await t.step("parses negative time to 0", () => {
    const result = parseTime("-1h");
    assertEquals(result, { hours: 0, minutes: 0, days: 0 });
  });

  await t.step("parses invalid time to 0", () => {
    const result = parseTime("invalid");
    assertEquals(result, { hours: 0, minutes: 0, days: 0 });
  });

  await t.step("partial times", () => {
    assertEquals(parseTime("1h 1"), { hours: 1, minutes: 0, days: 0 });
  });

  await t.step("parses decimal times to 0", () => {
    assertEquals(parseTime("1.5h"), { hours: 0, minutes: 0, days: 0 });
  });
});

Deno.test("ms", async (t) => {
  await t.step("converts to milliseconds", () => {
    assertEquals(ms({ hours: 1 }), 3600000);
    assertEquals(ms({ minutes: 1 }), 60000);
    assertEquals(ms({ days: 1 }), 86400000);
  });
});

Deno.test("integrated", async (t) => {
  await t.step("when time is valid", () => {
    const result = parseTime("1h 1m 1d");
    assertEquals(ms(result), 90060000);
  });

  await t.step("invalid time", () => {
    const result = parseTime("invalid");
    assertEquals(ms(result), 0);
  });

  await t.step("negative time", () => {
    const result = parseTime("-1h");
    assertEquals(ms(result), 0);
  });
});
