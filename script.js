import {
  detectOperatingSystem,
  formatDuration,
  getCommand,
  parseDurationPart,
  splitDuration,
  toTotalSeconds,
} from "./calculator.js";

const elements = {
  fields: {
    hours: document.querySelector("#hours"),
    minutes: document.querySelector("#minutes"),
    seconds: document.querySelector("#seconds"),
  },
  inputError: document.querySelector("#input-error"),
  durationDisplay: document.querySelector("#duration-display"),
  secondsDisplay: document.querySelector("#seconds-display"),
  commandOutput: document.querySelector("#command-output"),
  commandKind: document.querySelector("#command-kind"),
  usageNote: document.querySelector("#usage-note"),
  copyButton: document.querySelector("#copy-button"),
  resetButton: document.querySelector("#reset-button"),
  detectedBadge: document.querySelector("#detected-badge"),
  toast: document.querySelector("#toast"),
  currentYear: document.querySelector("#current-year"),
  osButtons: [...document.querySelectorAll("[data-os]")],
  presetButtons: [...document.querySelectorAll("[data-seconds]")],
};

let selectedOs = detectOperatingSystem(navigator.userAgent);
let toastTimer;

function readDuration() {
  const parts = Object.fromEntries(
    Object.entries(elements.fields).map(([field, input]) => [
      field,
      parseDurationPart(input.value, field),
    ]),
  );

  return toTotalSeconds(parts);
}

function render() {
  elements.osButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.os === selectedOs));
  });

  let totalSeconds;

  try {
    totalSeconds = readDuration();
    const result = getCommand(selectedOs, totalSeconds);

    elements.inputError.textContent = "";
    elements.durationDisplay.textContent = formatDuration(totalSeconds);
    elements.secondsDisplay.textContent = totalSeconds.toLocaleString("ko-KR");
    elements.commandOutput.textContent = result.command;
    elements.commandKind.textContent = result.kind;
    elements.usageNote.innerHTML = result.noteHtml;
    elements.copyButton.disabled = false;
  } catch (error) {
    if (totalSeconds === undefined) {
      elements.durationDisplay.textContent = "--:--:--";
      elements.secondsDisplay.textContent = "—";
    } else {
      elements.durationDisplay.textContent = formatDuration(totalSeconds);
      elements.secondsDisplay.textContent = totalSeconds.toLocaleString("ko-KR");
    }

    elements.inputError.textContent = error.message;
    elements.commandOutput.textContent = "시간을 확인해 주세요";
    elements.commandKind.textContent = "WAITING FOR INPUT";
    elements.usageNote.textContent = "유효한 시간을 입력하면 여기에 실행할 명령어가 표시됩니다.";
    elements.copyButton.disabled = true;
  }
}

function setDuration(totalSeconds) {
  const duration = splitDuration(totalSeconds);
  Object.entries(duration).forEach(([field, value]) => {
    elements.fields[field].value = value;
  });
  render();
}

async function copyCommand() {
  const command = elements.commandOutput.textContent;

  try {
    await navigator.clipboard.writeText(command);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = command;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  elements.copyButton.querySelector("span").textContent = "완료";
  elements.toast.textContent = "명령어를 복사했습니다.";
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.copyButton.querySelector("span").textContent = "복사";
    elements.toast.classList.remove("is-visible");
  }, 1_800);
}

Object.values(elements.fields).forEach((input) => {
  input.addEventListener("input", render);
  input.addEventListener("focus", (event) => event.currentTarget.select());
});

elements.osButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedOs = button.dataset.os;
    elements.detectedBadge.textContent = "직접 선택";
    render();
  });
});

elements.presetButtons.forEach((button) => {
  button.addEventListener("click", () => setDuration(Number(button.dataset.seconds)));
});

elements.resetButton.addEventListener("click", () => setDuration(0));
elements.copyButton.addEventListener("click", copyCommand);
elements.currentYear.textContent = new Date().getFullYear();

render();
