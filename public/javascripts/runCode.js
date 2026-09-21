//function to run user entered code
//Can only take one type of input for arguments currently
function runCode() {
    //collect needed elements
    const userCodetext = document.getElementById('codeEditor');
    const userArguments = document.getElementById('inputEditor');
    //create the function
    let userCode = new Function (`return ${userCodetext.value}`);
    let userFunction = userCode();
    //turn the inputs into an array that adjusts based on input type of string, object or array
    let userFunctionArguments; 
    //type object 
    if (userArguments.value.includes('{')) { 
        userFunctionArguments = userArguments.value.split('},');
        // ensure that each argument has a closing }
        for (let i = 0; i < userFunctionArguments.length; i++) {
            if(!userFunctionArguments[i].includes('}')) userFunctionArguments[i] += '}';
        } 
        userFunctionArguments = userFunctionArguments.map(argument => JSON.parse(argument)); 
    } 
    //type arrary
    else if (userArguments.value.includes('[')) {
        userFunctionArguments = userArguments.value.split('],');
        userFunctionArguments = userFunctionArguments.map(argument => argument.split(','));
    }
    // type string
    else { 
        userArguments.value.split(',');
    }

    return userFunction(...userFunctionArguments);
}

//display the output of the code
function displayOutput(codeFunction) {
    const outPutElement = document.getElementById("outputDisplay").firstChild;
    outPutElement.innerText = JSON.stringify(codeFunction);
}

//event listeners
const runCodeButton = document.getElementById('runButton');
runCodeButton.addEventListener('click', ()=> { 
    displayOutput(runCode());
});