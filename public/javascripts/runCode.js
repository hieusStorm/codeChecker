// Each comma-separated JSON value is an argument; an array stays one argument.
function formatInputs(inputs) { return JSON.parse(`[${inputs}]`); }
function runCode() {
  const source = document.getElementById("codeEditor").value.trim().replace(/;$/, "");
  const fn = new Function(`return (${source});`)();
  if (typeof fn !== "function") throw new Error("Enter a JavaScript function.");
  return fn(...formatInputs(document.getElementById("inputEditor").value));
}
function displayOutput(value) {
  const serialized = JSON.stringify(value, null, 2);
  document.getElementById("outputDisplay").textContent = serialized === undefined ? String(value) : serialized;
}
const runCodeButton = document.getElementById("runButton");
runCodeButton.addEventListener("click", async () => {
  runCodeButton.disabled = true;
  const badge = document.getElementById("runBadge");
  try {
    displayOutput(await runCode());
    badge.textContent = "Passed";
    badge.classList.remove("error-badge");
  } catch (error) {
    document.getElementById("outputDisplay").textContent = error.message;
    badge.textContent = "Failed";
    badge.classList.add("error-badge");
  } finally {
    document.getElementById("runTime").textContent = "just now";
    runCodeButton.disabled = false;
  }
});
const initialInput = document.getElementById("inputEditor").value;
document.getElementById("resetButton").addEventListener("click", () => {
  document.getElementById("inputEditor").value = initialInput;
});
