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

//display the output of the code
function displayOutput(codeFunction) {
    const outPutElement = document.getElementById("outputDisplay").firstChild;
    outPutElement.innerText = JSON.stringify(codeFunction);
}

function compareResults(actualResult) {
    const expectedInput = document.getElementById('expectedEditor').value;

    try {
        const expectedResult = JSON.parse(expectedInput);

        return JSON.stringify(actualResult) === JSON.stringify(expectedResult);
    } catch (error) {
        return String(actualResult).trim() === expectedInput.trim();
    }
}

//event listeners
const runCodeButton = document.getElementById('runButton');
    runCodeButton.addEventListener('click', ()=> { 
    const actualResult = runCode();

    displayOutput(actualResult);

    const passed = compareResults(actualResult);

    const runBadge = document.getElementById('runBadge');
    const outputMessage = document.getElementById('outputMessage');

    if (passed) {
        runBadge.innerHTML = '<span>✓</span> Passed';
        runBadge.style.backgroundColor = 'var(--green-soft)';
        runBadge.style.color = 'var(--green)';
        outputMessage.textContent = 'Result matches expected output';
    } else {
        runBadge.innerHTML = '<span>✗</span> Failed';
        runBadge.style.backgroundColor = '#fee2e2';
        runBadge.style.color = '#dc2626';
        outputMessage.textContent = 'Result does not match expected output';
    }
});
