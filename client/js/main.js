/*
MAIN.JS

Loads DOM elements upon window load, handles input, handles dark mode, and more.
*/

window.onload = () => {
    let loading = document.querySelector("#lds-ring");
    let setDropdown = document.querySelector("#sets");
    let setSubmit = document.querySelector("#set-submit");
    let setIDs = [];
    let currSet = {};
    const lsKey = "zsdpackrip-";
    
    // get setIDs upon load
    socket.on('start', (sets) => {
        setIDs = sets;
        for(let i = 0; i < setIDs.length; i++) {
            let option = document.createElement("option");
            option.text = setIDs[i];
            setDropdown.add(option);
        }
        loading.classList.add("hidden");
    });
    
    // send request for set
    setSubmit.onclick = () => {
        
        // only emit if it is not in localstorage, otherwise pull from localstorage
        if(!localStorage.getItem(lsKey + setDropdown.value))
            socket.emit('get-set', setDropdown.value);
        else
            console.log(JSON.parse(localStorage.getItem(lsKey + setDropdown.value)));
    };
    
    // set localstorage data
    socket.on('get-set', (data, setID) => {
        localStorage.setItem(lsKey + setID, JSON.stringify(data));
    });
    
    // send error to console
    socket.on('error', (err) => {
        console.log(err);
    });
};