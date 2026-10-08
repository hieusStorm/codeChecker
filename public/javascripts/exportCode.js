//event listener
const exportButton = document.getElementById('exportButton');
exportButton.addEventListener('click', exportCode);

function exportCode() {
    //collect the text and the language to export
    const codeValue = document.getElementById('codeEditor').value;
    const codeLanguage = 'js';
    // determine the name of the file
    //split based on where the function is and then split base on where the opening of function arguments is to create a name to be used for the file. Only do this if function is in the code other wise use a defualt name
    let fileName = (codeValue.includes('function')) ? codeValue.split('function')[1].split('(')[0] : 'exportedCode';
    //add file extension
    fileName += `.${codeLanguage}`;

    //create the file object
    const codeFile = new File([codeValue], fileName);

    // download the file
    const downloadLink = document.createElement('a');
    const url = URL.createObjectURL(codeFile);

    downloadLink.href = url;
    downloadLink.download = codeFile.name;
    downloadLink.style = 'display: none;';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
    return;
}