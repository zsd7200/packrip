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
    let tilt1 = true;
    
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
        
        // console.log(currSetID);
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
        
        // try to store new set data in localStorage
        try { localStorage.setItem(lsKey + setID, JSON.stringify(data)); }
        catch(err) {
            // store data to put back into localStorage
            let selection, energy;
            selection = localStorage.getItem(lsKey + "selection");
            energy = localStorage.getItem(lsKey + "smEnergy");
            
            // clear localstorage and restore some old data
            localStorage.clear();
            localStorage.setItem(lsKey + "selection", selection);
            localStorage.setItem(lsKey + "smEnergy", energy);
            localStorage.setItem(lsKey + setID, JSON.stringify(data));
        }
        
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
        let boosterArt = "";
        
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
        
        // get a random card from the entirety of your given set
        let randCard = (set) => { return set[random(0, set.length)]; };
        
        // gets a pack from a set of parameters,
        // most likely won't be used for older sets,
        // but good for newer sets
        let getPack = (reverse = "none",
                       revPerc = -1,
                       totalOdds = -1,
                       rareOdds = {},
                       guaranteeHolo = false,
                       useSmEnergies = true,) => {

            let retArr = [];
            const comm = random(0, 5) + 4;
            const uncom = 8 - comm;
            const amazing = (reverse == "amazing" && random(0, 100) < revPerc) ? true : false;
            const energy = (reverse == "energy" && random(0, 100) < revPerc) ? true : false;
            
            // fill up common and uncommon slots
            for(let i = 0; i < comm; i++)
                retArr.push(dupeCheck(retArr, currSetComm));
            
            for(let i = 0; i < uncom; i++)
                retArr.push(dupeCheck(retArr, currSetUncomm));
            
            // shuffle array order
            shuffle(retArr);
            
            // reverse slot
            if(amazing)
                retArr.push(randCard(currSetAmaz));
            else if (energy && useSmEnergies)
                retArr.push(randCard(smEnergies));
            else if(random(0, totalOdds) < rareOdds.revRare) {
                if(random(0, totalOdds) < rareOdds.holo)
                    retArr.push(randCard(currSetHolo));
                else
                    retArr.push(randCard(currSetRare));
            } 
            else if(random(0, totalOdds) < rareOdds.uncomRev)
                retArr.push(randCard(currSetUncomm));
            else
                retArr.push(randCard(currSetComm));
            
            // rare slot
            if(random(0, totalOdds) < rareOdds.sec)
                retArr.push(randCard(currSetSec));
            else if(random(0, totalOdds) < rareOdds.rain)
                retArr.push(randCard(currSetRain));
            else if(random(0, totalOdds) < rareOdds.ult)
                retArr.push(randCard(currSetUlt));
            else if(random(0, totalOdds) < rareOdds.vmax)
                retArr.push(randCard(currSetVMax));
            else if(random(0, totalOdds) < rareOdds.v)
                retArr.push(randCard(currSetV));
            else if(random(0, totalOdds) < rareOdds.holo || guaranteeHolo)
                retArr.push(randCard(currSetHolo));
            else {
                retArr.push(randCard(currSetRare));
                holo = false;
            }
            
            if(useSmEnergies)
                retArr.unshift(randCard(smEnergies));
            
            return retArr;
        };
        
        switch(currSetID) {
            default:
                for(let i = 0; i < 11; i++)
                    packArr.push(randCard(currSet));
                break;
            case "swsh4":                                   // vivid voltage data from https://cardzard.com/blogs/news/vivid-voltage-pull-rate-data
                packArr = getPack("amazing", 5, 2184, {     // 5% chance for amazing, x/2184 for whole set
                    revRare : 1313,                         // 60% chance for reverse slot rare (same as regular chances of non-holo rare)
                    holo : 366,                             // 16.76% chance for holo
                    uncomRev : 764,                         // 35% chance for uncommon reverse slot over common, this one is a guess
                    sec : 23,                               // 1.05% chance for golden
                    rain : 31,                              // 1.42% chance for rainbow
                    ult : 89,                               // 4.07% chance for ultra rare
                    vmax : 91,                              // 4.17% chance for VMAX
                    v : 271,                                // 12.41 chance for V
                });
                break;
            case "swsh35":                                  // champ's path data from https://cardzard.com/blogs/news/champions-path-pull-rate-data-2020
                packArr = getPack("energy", 9, 1457, {      // 9% chance for amazing, x/1457 for whole set
                    revRare : 248,                          // 17% chance for reverse slot rare (same as regular chances of non-holo rare)
                    holo : 1105,                            // 75% chance for holo
                    uncomRev : 504,                         // 34% chance for uncommon reverse slot over common, this one is a guess
                    sec : 19,                               // 1.28% chance for secret
                    rain : 24,                              // 1.65% chance for rainbow
                    ult : 61,                               // 4.21% chance for ultra rare
                    vmax : 248,                             // 17.03% chance for VMAX
                    v : 248,                                // 17.03% chance for V
                }, true);
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
            img.classList.add("tilt1");
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
            
            // remove hidden class from loading
            loading.classList.remove("hidden");
            
            // format pack
            for(let i = 0; i < packArr.length; i++) {
                let div = document.createElement('div');
                let img = document.createElement('img');
                div.classList.add("card");
                div.classList.add("tilt1");
                div.classList.add("hidden");
                div.style.zIndex = 100 - i;
                // if last card in pack, remove loading
                if(i == packArr.length - 1)
                    img.onload = () => { loading.classList.add("hidden"); };
                
                img.src = packArr[i].images.small;
                tilt1 = true;
                
                // do this for modern completed sets
                if(currSetID === "swsh4" || currSetID === "swsh35") {
                    if(packArr[i].supertype == "Energy")
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
            let p;
            
            // move the card over to the left by adding seen card class
            parent.childNodes[cardIndex].classList.add("seen-card");
            parent.childNodes[cardIndex].classList.remove("tilt1");
            parent.childNodes[cardIndex].classList.remove("tilt2");
            parent.childNodes[cardIndex].style.zIndex = packArr.length + cardIndex;
            
            // add new onclick handler to put it back on the pile
            parent.childNodes[cardIndex].onclick = () => {
                if(p)
                    p.remove();
                
                parent.childNodes[cardIndex].style.zIndex = 100 - cardIndex;
                parent.childNodes[cardIndex].classList.remove("seen-card");
                
                // sync tilt animation
                for(let i = cardIndex; i < parent.childNodes.length; i++) {
                    // remove all tilt
                    parent.childNodes[i].classList.remove("tilt1");
                    parent.childNodes[i].classList.remove("tilt2");
                    
                    // readd tilt
                    setTimeout(() => {
                        if(tilt1)
                            parent.childNodes[i].classList.add("tilt2");
                        else
                            parent.childNodes[i].classList.add("tilt1");
                    }, 10);
                }
                
                // swap tilt variable
                tilt1 = !tilt1;
                
                parent.childNodes[cardIndex].onclick = () => { moveCard(cardIndex, parent); };
            };
            
            // get price of pack based on TCGPlayer market price
            if(cardIndex == packArr.length - 1) {
                p = document.createElement('p');
                let noPrices = false;
                let highest = 0;
                let highestIndex = 0;
                let price = 0;
                
                for(let i = 0; i < packArr.length; i++) {
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
                        } else if(packArr[i].tcgplayer.prices.normal) {
                            price += packArr[i].tcgplayer.prices.normal.market;
                            if(packArr[i].tcgplayer.prices.normal.market > highest) {
                                highest = packArr[i].tcgplayer.prices.normal.market;
                                highestIndex = i;
                            }
                        } else if(packArr[i].tcgplayer.prices.holofoil) {                       // this check is a fallback for sets that are still 100% randomized
                            price += packArr[i].tcgplayer.prices.holofoil.market;
                            if(packArr[i].tcgplayer.prices.holofoil.market > highest) {
                                highest = packArr[i].tcgplayer.prices.holofoil.market;
                                highestIndex = i;
                            }
                        }
                    }
                    catch(err) {
                        // to prevent this from being thrown on energy cards
                        if(packArr[i].supertype != "Energy")
                            noPrices = true;
                        
                        // tcgplayer price debugging
                        if(noPrices) {
                            console.log("Error on card: " + i);
                            console.log(packArr[i]);
                            console.log(err);
                        }
                        continue;
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
                p.classList.add("price");
                
                // append to flexbox
                parent.appendChild(p);
            }
        };
    };
};