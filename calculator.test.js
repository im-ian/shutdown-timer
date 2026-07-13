import test from "node:test";
import assert from "node:assert/strict";

import {
  detectOperatingSystem,
  formatDuration,
  getCommand,
  parseDurationPart,
  splitDuration,
  toTotalSeconds,
} from "./calculator.js";

test("시간, 분, 초를 전체 초로 환산한다", () => {
  assert.equal(toTotalSeconds({ hours: 1, minutes: 2, seconds: 3 }), 3_723);
});

test("전체 초를 입력 필드 값으로 분해한다", () => {
  assert.deepEqual(splitDuration(7_261), { hours: 2, minutes: 1, seconds: 1 });
});

test("24시간이 넘는 시간도 잘리지 않도록 표시한다", () => {
  assert.equal(formatDuration(360_061), "100:01:01");
});

test("빈 필드는 0으로 해석한다", () => {
  assert.equal(parseDurationPart("", "minutes"), 0);
});

test("소수, 음수, 범위를 넘는 분과 초를 거부한다", () => {
  assert.throws(() => parseDurationPart("1.5", "hours"), /정수/);
  assert.throws(() => parseDurationPart("-1", "hours"), /0~9999/);
  assert.throws(() => parseDurationPart("60", "minutes"), /0~59/);
  assert.throws(() => parseDurationPart("60", "seconds"), /0~59/);
});

test("Windows 명령은 전체 초를 /t 값으로 사용한다", () => {
  assert.equal(getCommand("windows", 3_723).command, "shutdown /s /t 3723");
});

test("macOS와 Linux는 분 단위일 때 기본 shutdown 예약을 사용한다", () => {
  assert.equal(getCommand("macos", 3_600).command, "sudo shutdown -h +60");
  assert.equal(getCommand("linux", 90 * 60).command, "sudo shutdown -h +90");
});

test("macOS는 기본 shutdown의 초 접미사로 정확한 시간을 지원한다", () => {
  assert.equal(getCommand("macos", 3_723).command, "sudo shutdown -h +3723s");
});

test("Linux는 초가 남으면 sleep으로 정확한 시간을 지원한다", () => {
  assert.equal(
    getCommand("linux", 3_723).command,
    "sudo sh -c 'sleep 3723 && shutdown -h now'",
  );
});

test("0초 예약은 모든 운영체제에서 거부한다", () => {
  assert.throws(() => getCommand("windows", 0), /1초 이상/);
  assert.throws(() => getCommand("macos", 0), /1초 이상/);
});

test("user agent에서 운영체제를 감지한다", () => {
  assert.equal(detectOperatingSystem("Windows NT 10.0"), "windows");
  assert.equal(detectOperatingSystem("Macintosh; Intel Mac OS X"), "macos");
  assert.equal(detectOperatingSystem("X11; Linux x86_64"), "linux");
  assert.equal(detectOperatingSystem("Unknown"), "windows");
});
