//function to run user entered code
//Can only take one type of input for arguments currently
function runCode() {
    //collect needed elements
    const userCodetext = document.getElementById('codeEditor');
    const userInputs = document.getElementById('inputEditor');
    //create the function
    let userCode = new Function (`return ${userCodetext.value}`);
    let userFunction = userCode();
    //turn the inputs into an array that adjusts based on input type of string, object or array
    let userformattedInputs = formatInputs(userInputs.value); 
    
    return userFunction(...userformattedInputs);
}

// Formatt user inputs into an array to be used in there entered function
function formatInputs(inputs) {
    let formattedInputs;
     //type object 
    if (inputs.includes('{')) { 
        formattedInputs = inputs.split('},');
        // ensure that each argument has a closing }
        for (let i = 0; i < formattedInputs.length; i++) {
            if(!formattedInputs[i].includes('}')) formattedInputs[i] += '}';
        } 
        formattedInputs = formattedInputs.map(argument => JSON.parse(argument)); 
    } 
    //type arrary
    else if (inputs.includes('[')) {
        formattedInputs = inputs.split('],');
        formattedInputs = formattedInputs.map(argument => argument.split(','));
    }
    // type string
    else { 
       formattedInputs = inputs.split(',');
    }
    return formattedInputs;
}

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

    updateTestDetails(passed);
});

// Might need to be moved to another script not sure yet
const resetInputsButton = document.getElementById('resetButton');
resetInputsButton.addEventListener('click', ()=> document.getElementById('inputEditor').value = '');

// Details Box
// Temporary counter until run history is connected to MongoDB
let runCount = 0;

function updateTestDetails(passed) {
    const testStatus = document.getElementById('testStatus');
    const lasrRun = document.getElementById('lastRun');
    const runCountElement = document.getElementById('runCount');

    if(passed) {
        testStatus.innerHTML = '<span class="green-dot"></span> Passed';
    } else {
        testStatus.innerHTML = '<span class="red-dot"></span> Failed'
    }

    lastRun.textContent = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });

    runCount++;
    runCountElement.textContent = runCount;
}