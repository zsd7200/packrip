/*
MAIN.JS

Loads DOM elements upon window load, handles input, handles dark mode, and more.
*/

window.onload = () => {
    let loading = document.querySelector("#lds-ring");
    let setDropdown = document.querySelector("#sets");
    let setSubmit = document.querySelector("#set-submit");
    let pack = document.querySelector("#pack");
    const lsKey = "zsdpackrip-";
    const packArtDir = "assets/img/packs/";
    let smEnergies = (localStorage.getItem(lsKey + "smEnergy")) ? JSON.parse(localStorage.getItem(lsKey + "smEnergy")) : [];
    let setData = {};
    let setIDs = [];
    let currSet = {};
    let currSetID = "";
    
    // get setIDs upon load
    socket.on('start', (sets) => {
        setData = JSON.parse(sets);
        setIDs = Object.keys(setData).filter((set) => {
            // filter out promos, mcdonalds sets, and POP series sets
            if(setData[set].indexOf("Promo") > -1 || setData[set].indexOf("McDonald") > -1 || setData[set].indexOf("POP") > -1)
                return false;
            else
                return true;
        });
        
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
            console.log("error, could not get data from server");
        
        loading.classList.add("hidden");
        
        // emit this to stores energies from sun and moon base set from server
        if(smEnergies.length == 0)
            socket.emit('get-energies');
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
    
    // energy storage
    socket.on('get-energies', (data) => {
        for(let i = 164; i < data.length; i++)
            smEnergies.push(data[i]);
        
        localStorage.setItem(lsKey + "smEnergy", JSON.stringify(smEnergies));
    });
    
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
    
    // generate packs and display them
    let showCards = () => {
        // empty array to hold current pack
        let packArr = [];
        let holo = true;
        
        // divide current set by rarities
        let currSetComm = currSet.filter((card) => { return card.rarity == "Common"; });
        let currSetUncomm = currSet.filter((card) => { return card.rarity == "Uncommon"; });
        let currSetRare = currSet.filter((card) => { return card.rarity == "Rare"; });
        let currSetHolo = currSet.filter((card) => { return card.rarity == "Rare Holo"; });
        let currSetV = currSet.filter((card) => { return card.rarity == "Rare Holo V"; });
        let currSetVMax = currSet.filter((card) => { return card.rarity == "Rare Holo VMAX"; });
        let currSetUlt = currSet.filter((card) => { return card.rarity == "Rare Ultra"; });
        let currSetRain = currSet.filter((card) => { return card.rarity == "Rare Rainbow"; });
        let currSetSec = currSet.filter((card) => { return card.rarity == "Rare Secret"; });
        let currSetAmaz = currSet.filter((card) => { return card.rarity == "Amazing Rare"; });
        
        // for use later
        let boosterArt = "";
        
        // check for duplicate cards
        let dupeCheck = (currPack, set) => {
            let dupe, rand;
            
            // loops until dupe is false
            do {
                dupe = false;
                rand = random(0, set.length);
                
                for(let i = 0; i < currPack.length; i++) {
                    if(currPack[i] == set[rand]) {
                        dupe = true;
                        break;
                    }
                }
            } while(dupe);
            
            // return card
            return set[rand];
        };
        
        let randCard = (set) => { return set[random(0, set.length)]; };
        
        switch(currSetID) {
            default:
                for(let i = 0; i < 11; i++)
                    packArr.push(randCard(currSet));
                break;
            case "swsh4":                                               // vivid voltage data from https://cardzard.com/blogs/news/vivid-voltage-pull-rate-data
                const comm = random(0, 5) + 4;                          // at least 4 commons
                const uncom = 8 - comm;                                 // remainder with uncommons
                const amazing = (random(0, 20) == 0) ? true : false;    // 1/20 chance for amazing
                
                // fill up common and uncommon slots
                for(let i = 0; i < comm; i++)
                    packArr.push(dupeCheck(packArr, currSetComm));
                
                for(let i = 0; i < uncom; i++)
                    packArr.push(dupeCheck(packArr, currSetUncomm));
                
                // shuffle array order
                shuffle(packArr);
                
                // reverse slot
                if(amazing)
                    packArr.push(randCard(currSetAmaz));
                else if(random(0, 2184) < 1313) {                       // 60% chance for reverse slot rare (same as regular chances of non-holo rare)
                    if(random(0, 2184) < 366)                           // 17% chance for reverse slot holo rare
                        packArr.push(randCard(currSetHolo));
                    else
                        packArr.push(randCard(currSetRare));
                } 
                else if(random(0, 3) == 0)                              // 1/3 chance for uncommon reverse slot over common, this one is a guess
                    packArr.push(randCard(currSetUncomm));
                else
                    packArr.push(randCard(currSetComm));
                
                // rare slot
                if(random(0, 2184) < 23)                                // 1.05% chance for golden
                    packArr.push(randCard(currSetSec));
                else if(random(0, 2184) < 31)                           // 1.42% chance for rainbow
                    packArr.push(randCard(currSetRain));
                else if(random(0, 2184) < 89)                           // 4.07% chance for ultra rare
                    packArr.push(randCard(currSetUlt));
                else if(random(0, 2184) < 91)                           // 4.17% chance for VMAX
                    packArr.push(randCard(currSetVMax));
                else if(random(0, 2184) < 271)                          // 12.41 chance for V
                    packArr.push(randCard(currSetV));
                else if(random(0, 2184) < 366)                          // 16.76% chance for holo
                    packArr.push(randCard(currSetHolo));
                else {
                    packArr.push(randCard(currSetRare));
                    holo = false;
                }
                
                // energies from VV are supposed to be from swsh base set
                // but the TCG API doesn't have these energies available,
                // so we're using sm energies instead
                packArr.unshift(randCard(smEnergies));
                
                break;
        }
        
        // clear pack innerHTML and 
        pack.innerHTML = "";
        
        // check if image for booster exists
        // otherwise, use default image
        let getBoosterArt = () => {
            let img = new Image();
            img.onload = () => { showBoosterArt(packArtDir + currSetID + ".webp");  };
            img.onerror = () => { showBoosterArt(packArtDir + "default.webp"); };
            img.src = packArtDir + currSetID + ".webp";
        };
        
        // called with correct source after finding out what src to use
        let showBoosterArt = (imgSrc) => {
            let flex = document.createElement('div');
            let div = document.createElement('div');
            let img = document.createElement('img');
            flex.classList.add("center");
            div.classList.add("holo");
            div.classList.add("booster-container");
            img.classList.add("booster-art");
            img.src = imgSrc;
            flex.onclick = () => { open(flex, div); };
            flex.appendChild(div);
            div.appendChild(img);
            pack.appendChild(flex);
        };
        
        // run getBooster art
        getBoosterArt();
        
        let open = (parent, child) => {
            // remove event handler on parent
            parent.onclick = false;
            
            // zoom child in
            child.classList.add("zoom");
            
            // format pack
            for(let i = 0; i < packArr.length; i++) {
                let div = document.createElement('div');
                let img = document.createElement('img');
                div.classList.add("card");
                div.classList.add("hidden");
                div.style.zIndex = packArr.length - i;
                img.src = packArr[i].images.small;
                
                if(currSetID === "swsh4") {
                    if(i == 0)
                        img.classList.add("sm-energy");
                    
                    // add holo class to reverse and end holo
                    if(holo && i == (packArr.length - 1) || i == (packArr.length - 2))
                        div.classList.add("holo");
                }
                
                div.onclick = () => { moveCard(i, parent); };
                div.appendChild(img);
                parent.appendChild(div);
            }
            
            // remove child and show cards
            setTimeout(() => { 
                child.remove();
                for(let i = 0; i < parent.childNodes.length; i++)
                    parent.childNodes[i].classList.remove("hidden");
            }, 500);
        };
        
        let moveCard = (cardIndex, parent) => {
            // move the card over to the left by adding seen card class
            parent.childNodes[cardIndex].classList.add("seen-card");
            parent.childNodes[cardIndex].style.zIndex = packArr.length + cardIndex;
            
            // add new onclick handler to put it back on the pile
            parent.childNodes[cardIndex].onclick = () => {
                parent.childNodes[cardIndex].classList.remove("seen-card");
                parent.childNodes[cardIndex].style.zIndex = packArr.length - cardIndex;
                parent.childNodes[cardIndex].onclick = () => { moveCard(cardIndex, parent); };
            };
            
            // get price of pack based on TCGPlayer market price
            if(cardIndex == packArr.length - 1) {
                let p = document.createElement('p');
                let noPrices = false;
                let highest = 0;
                let highestIndex = 0;
                let price = 0;
                
                // start at 1 to skip energy
                for(let i = 1; i < packArr.length; i++) {
                    // start from holofoil and work down
                    try {
                        if((packArr[i].tcgplayer.prices.holofoil && i == packArr.length - 1) || (!packArr[i].tcgplayer.prices.reverseHolofoil && i == packArr.length - 2)) {
                            price += packArr[i].tcgplayer.prices.holofoil.market;
                            if(packArr[i].tcgplayer.prices.holofoil.market > highest) {
                                highest = packArr[i].tcgplayer.prices.holofoil.market;
                                highestIndex = i;
                            }
                        } else if(packArr[i].tcgplayer.prices.reverseHolofoil && i == packArr.length - 2) {
                            price += packArr[i].tcgplayer.prices.reverseHolofoil.market;
                            if(packArr[i].tcgplayer.prices.reverseHolofoil.market > highest) {
                                highest = packArr[i].tcgplayer.prices.reverseHolofoil.market;
                                highestIndex = i;
                            }
                        } else if(packArr[i].tcgplayer.prices.normal.market) {
                            price += packArr[i].tcgplayer.prices.normal.market;
                            if(packArr[i].tcgplayer.prices.normal.market > highest) {
                                highest = packArr[i].tcgplayer.prices.normal.market;
                                highestIndex = i;
                            }
                        }
                    }
                    catch(err) {
                        noPrices = true;
                    }
                }
                
                // update innerhtml for new p element
                if(!noPrices) {
                    p.innerHTML = "Your pack is worth: <b>$" + price.toFixed(2) + "</b>.<br>";
                    p.innerHTML += "Your best hit was: <b>" + packArr[highestIndex].name + "</b> at <b>$" + highest.toFixed(2) + "</b>.";
                } else {
                    p.innerHTML = "This pack is missing at least one card on TCGPlayer, and therefore cannot be valued. <br>";
                    p.innerHTML += "Apologies for the inconvenience.";
                }
                
                p.style.zIndex = 1000;
                
                // append to flexbox
                parent.appendChild(p);
            }
        };
    };
};