/*
MAIN.JS

Loads DOM elements upon window load, handles input, handles dark mode, and more.
*/

window.onload = () => {
    let loading = document.querySelector("#lds-ring");
    let setDropdown = document.querySelector("#sets");
    let setSubmit = document.querySelector("#set-submit");
    let pack = document.querySelector("#pack");
    let setData = {};
    let setIDs = [];
    let currSet = {};
    let currSetID = "";
    const lsKey = "zsdpackrip-";
    
    // get setIDs upon load
    socket.on('start', (sets) => {
        setData = JSON.parse(sets);
        setIDs = Object.keys(setData);
        
        for(let i = 0; i < setIDs.length; i++) {
            let option = document.createElement("option");
            option.text = setData[setIDs[i]];
            setDropdown.add(option);
        }
        
        // enable items and restore last selection (if applicable)
        if(setDropdown.options.length > 0) {
            setSubmit.disabled = false;
            setDropdown.disabled = false;
            
            if(localStorage.getItem(lsKey + "selection"))
                setDropdown.value = localStorage.getItem(lsKey + "selection");
        } else
            console.log("error");
        
        loading.classList.add("hidden");
    });
    
    // store last pack selection
    setDropdown.onchange = () => { localStorage.setItem(lsKey + "selection", setDropdown.value); };
    
    // send request for set
    setSubmit.onclick = () => {
        // get ID from name
        for(let i = 0; i < setIDs.length; i++)
            if(setData[setIDs[i]] == setDropdown.value)
                currSetID = setIDs[i];
        
        // only emit if it is not in localstorage, otherwise pull from localstorage
        if(!localStorage.getItem(lsKey + currSetID)) {
            socket.emit('get-set', currSetID);
            loading.classList.remove("hidden");
        } else {
            currSet = JSON.parse(localStorage.getItem(lsKey + currSetID));
            showCards();
        }
    };
    
    // hide loading icon and set localstorage data
    socket.on('get-set', (data, setID) => {
        loading.classList.add("hidden");
        localStorage.setItem(lsKey + setID, JSON.stringify(data));
        currSet = data;
        showCards();
    });
    
    // send error to console
    socket.on('error', (err) => {
        console.log(err);
    });
    
    // currently just gets 10 random cards
    // (should be set to 11 with energies)
    let showCards = () => {
        // empty array to hold current pack
        let packArr = [];
        for(let i = 0; i < 10; i++) {
            let energy = false;
            let rand = random(0, currSet.length);
            
            /*
            // guarantee only one energy
            if(i == 10) {
                while(!energy) {
                    if(currSet[rand].supertype == "Energy") {
                        energy = true;
                        console.log(currSet[rand]);
                    } else
                        rand = random(0, currSet.length);
                }
            } else {
                do {
                    if(currSet[rand].supertype == "Energy") {
                        energy = true;
                        rand = random(0, currSet.length);
                    } else
                        energy = false;
                } while(energy);
            }
            */
            // Most sets don't come with their own energies, so 
            // some detective work needs to be done to find out
            // what sets have the standard energy cards, and
            // when to use them.
            
            packArr.push(currSet[rand]);
        }
        
        // clear pack innerHTML and 
        pack.innerHTML = "";
        for(let i = 0; i < packArr.length; i++) {
            let img = document.createElement('img');
            img.classList.add("card");
            img.src = packArr[i].images.small;
            pack.appendChild(img);
        }
    };
};