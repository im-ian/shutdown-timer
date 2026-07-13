import {
  detectOperatingSystem,
  getCommand,
  parseDurationPart,
  toTotalSeconds,
} from "./calculator.js";

const elements = {
  fields: {
    hours: document.querySelector("#hours"),
    minutes: document.querySelector("#minutes"),
    seconds: document.querySelector("#seconds"),
  },
  inputError: document.querySelector("#input-error"),
  commandOutput: document.querySelector("#command-output"),
  usageNote: document.querySelector("#usage-note"),
  copyButton: document.querySelector("#copy-button"),
  osButtons: [...document.querySelectorAll("[data-os]")],
};

let selectedOs = detectOperatingSystem(navigator.userAgent);
let copyFeedbackTimer;

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

  try {
    const totalSeconds = readDuration();
    const result = getCommand(selectedOs, totalSeconds);

    elements.inputError.textContent = "";
    elements.commandOutput.textContent = result.command;
    elements.usageNote.innerHTML = result.noteHtml;
    elements.copyButton.disabled = false;
  } catch (error) {
    elements.inputError.textContent = error.message;
    elements.commandOutput.textContent = "—";
    elements.usageNote.textContent = "유효한 시간을 입력하면 여기에 실행할 명령어가 표시됩니다.";
    elements.copyButton.disabled = true;
  }
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
  window.clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = window.setTimeout(() => {
    elements.copyButton.querySelector("span").textContent = "복사";
  }, 1_800);
}

Object.values(elements.fields).forEach((input) => {
  input.addEventListener("input", render);
  input.addEventListener("focus", (event) => event.currentTarget.select());
});

elements.osButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedOs = button.dataset.os;
    render();
  });
});

elements.copyButton.addEventListener("click", copyCommand);

render();
