// collected needed elements and info
const userCode = document.getElementById('codeEditor');
const saveButton = document.getElementById('saveButton');
const hiddenUser = document.getElementById('currentUser');
const saveStatus = document.getElementById('saveStatus');

// add event listener to send code to the server route
saveButton.addEventListener('click', async (event)=> {
    // name the code based on the function name
    const functionName = userCode.value.split('function ')[1].split('(')[0];
    const codeValue = userCode.value;
    try {
        const response = await fetch('api/saveCode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({code: codeValue, codeName: functionName, currentUser: hiddenUser.value})
        });
        const result = await response.json();
        console.log(result);
        if (!result.ok) { 
            throw new Error(result.message || 'Unable to save Code');
        } else {
            saveStatus.innerText = 'Code Saved';
        } 
    } catch (error) { 
        error.textContent = error.message === 'Failed to fetch'
        ? 'Cannot reach the server. Please try again.'
        : error.message;
    }
});