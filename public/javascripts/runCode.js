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

//event listeners
const runCodeButton = document.getElementById('runButton');
runCodeButton.addEventListener('click', ()=> { 
    displayOutput(runCode());
});