const WINDOWS_MAX_SECONDS = 315_360_000;

const FIELD_LIMITS = Object.freeze({
  hours: 9_999,
  minutes: 59,
  seconds: 59,
});

export function parseDurationPart(value, field) {
  const label = { hours: "시간", minutes: "분", seconds: "초" }[field];
  const maximum = FIELD_LIMITS[field];

  if (maximum === undefined) {
    throw new Error("알 수 없는 시간 단위입니다.");
  }

  const normalizedValue = value === "" ? 0 : Number(value);

  if (!Number.isInteger(normalizedValue) || normalizedValue < 0 || normalizedValue > maximum) {
    throw new Error(`${label}은(는) 0~${maximum} 사이의 정수로 입력해 주세요.`);
  }

  return normalizedValue;
}

export function toTotalSeconds({ hours, minutes, seconds }) {
  return hours * 3_600 + minutes * 60 + seconds;
}

export function splitDuration(totalSeconds) {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0) {
    throw new Error("전체 시간은 0 이상의 정수여야 합니다.");
  }

  return {
    hours: Math.floor(totalSeconds / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatDuration(totalSeconds) {
  const { hours, minutes, seconds } = splitDuration(totalSeconds);
  return [hours, minutes, seconds]
    .map((part, index) => (index === 0 ? String(part).padStart(2, "0") : String(part).padStart(2, "0")))
    .join(":");
}

export function getCommand(os, totalSeconds) {
  if (!Number.isInteger(totalSeconds) || totalSeconds <= 0) {
    throw new Error("종료할 시간을 1초 이상 입력해 주세요.");
  }

  if (os === "windows") {
    if (totalSeconds > WINDOWS_MAX_SECONDS) {
      throw new Error("Windows 종료 예약은 최대 315,360,000초까지 지원합니다.");
    }

    return {
      command: `shutdown /s /t ${totalSeconds}`,
      kind: "WINDOWS · SECONDS",
      noteHtml:
        "명령 프롬프트 또는 PowerShell에 붙여 넣으세요. 예약을 취소하려면 <code>shutdown /a</code>를 실행하세요.",
    };
  }

  if (os === "macos") {
    if (totalSeconds % 60 === 0) {
      const totalMinutes = totalSeconds / 60;

      return {
        command: `sudo shutdown -h +${totalMinutes}`,
        kind: "MACOS · MINUTES",
        noteHtml:
          "터미널에 붙여 넣고 관리자 암호를 입력하세요. 예약을 취소하려면 <code>sudo killall shutdown</code>을 실행하세요.",
      };
    }

    return {
      command: `sudo shutdown -h +${totalSeconds}s`,
      kind: "MACOS · EXACT SECONDS",
      noteHtml:
        "macOS의 초 단위 예약 문법을 사용합니다. 예약을 취소하려면 <code>sudo killall shutdown</code>을 실행하세요.",
    };
  }

  if (os === "linux") {
    if (totalSeconds % 60 === 0) {
      return {
        command: `sudo shutdown -h +${totalSeconds / 60}`,
        kind: "LINUX · MINUTES",
        noteHtml:
          "터미널에 붙여 넣고 관리자 암호를 입력하세요. 예약을 취소하려면 <code>sudo shutdown -c</code>를 실행하세요.",
      };
    }

    return {
      command: `sudo sh -c 'sleep ${totalSeconds} && shutdown -h now'`,
      kind: "LINUX · EXACT SECONDS",
      noteHtml:
        "Linux 기본 shutdown은 분 단위로 예약합니다. 초 단위를 지키기 위해 이 터미널을 열어 두고, 취소하려면 <code>Ctrl + C</code>를 누르세요.",
    };
  }

  throw new Error("지원하지 않는 운영체제입니다.");
}

export function detectOperatingSystem(userAgent = "") {
  const source = userAgent.toLowerCase();

  if (source.includes("win")) return "windows";
  if (source.includes("mac")) return "macos";
  if (source.includes("linux") || source.includes("x11")) return "linux";
  return "windows";
}
