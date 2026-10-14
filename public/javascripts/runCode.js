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
})
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
    runCodeButton.addEventListener('click', ()=> { 
    const actualResult = runCode();

    displayOutput(actualResult);

    const passed = compareResults(actualResult);
    if (window.saveRunResult) window.saveRunResult(passed);

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

    updateTestDetails(passed);
});

// Might need to be moved to another script not sure yet
const resetInputsButton = document.getElementById('resetButton');
resetInputsButton.addEventListener('click', ()=> document.getElementById('inputEditor').value = '');

// Details Box
// Temporary counter until run history is connected to MongoDB
let runCount = Number(document.getElementById('runCount')?.textContent) || 0;

function updateTestDetails(passed) {
    const testStatus = document.getElementById('testStatus');
    const lastRun = document.getElementById('lastRun');
    const runCountElement = document.getElementById('runCount');

    if (testStatus) {
        testStatus.innerHTML = passed
            ? '<span class="green-dot"></span> Passed'
            : '<span class="red-dot"></span> Failed';
    }

    if (lastRun) {
        // same format the server uses, e.g. "Oct 14, 10:42 AM"
        lastRun.textContent = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    // only count runs of saved tests, matching what the server stores
    const isSaved = new URLSearchParams(location.search).get('codename');
    if (runCountElement && isSaved) {
        runCount++;
        runCountElement.textContent = runCount;
    }
}