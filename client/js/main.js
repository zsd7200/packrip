/*
MAIN.JS

Loads DOM elements upon window load, gets pack data from server, and displays cards to user.
*/

window.onload = () => {
	let loading = document.querySelector("#lds-ring");
	let errDisp = document.querySelector("#err-disp");
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
	let tilt1 = true;	   			// used for synchronizing animations after putting cards back
	let errCheck;		   			// use this so only one setTimeout is going at a time in open()
	let completedSets = [
		"sm1", "sm2", "sm3", "sm35", "sm4", "sm5", "sm6", "sm7",
		"sm75", "sm8", "sm9", "det1", "sm10", "sm11", "sm115", "sm12",
		"swsh1", "swsh2", "swsh3", "swsh35", "swsh4", "swsh45", "swsh5", 
		"swsh6", "swsh7",
	];
	let socket = io();
	
	// get setIDs upon load
	socket.on('start',(sets) => {
		setData = JSON.parse(sets);
		setIDs = Object.keys(setData).filter((set) => {
			// filter out promos, mcdonalds sets, POP series sets, and Shiny Vault sets since those are included within their bigger set
			if(setData[set].indexOf("Promo") > -1 || setData[set].indexOf("McDonald") > -1 || setData[set].indexOf("POP") > -1 || setData[set].indexOf("Vault") > -1)
				return false;
			else
				return true;
		});
		
		for(let i = 0; i < setIDs.length; i++) {
			let option = document.createElement("option");
			option.text = setData[setIDs[i]];
			
			// add checkmark to completed sets
			for(let j = 0; j < completedSets.length; j++)
				if(completedSets[j] == setIDs[i]) {
					option.text += " ✓";
					break;
				}
			
			setDropdown.add(option);
		}
		
		// check if data needs to be cleared
		if(!localStorage.getItem(lsKey + "cleared")) {
			localStorage.clear();
			localStorage.setItem(lsKey + "cleared", true);
		}
		
		// enable items and restore last selection (if applicable)
		if(setDropdown.options.length > 0) {
			setSubmit.disabled = false;
			setDropdown.disabled = false;
			
			if(localStorage.getItem(lsKey + "selection"))
				setDropdown.value = localStorage.getItem(lsKey + "selection");
		} else {
			errDisp.innerHTML = `<p class="header">ERROR:</p>`;
			errDisp.innerHTML += "Something went wrong!<br>";
			errDisp.innerHTML += "Could not get data from server!<br>";
			errDisp.innerHTML += "Please refresh the page.";
			errDisp.classList.remove("hidden");
		}
		
		// get shiny vault data for hidden/shining fates
		if(!localStorage.getItem(lsKey + "sma"))
			socket.emit('get-set', "sma");
		if(!localStorage.getItem(lsKey + "swsh45sv"))
			socket.emit('get-set', "swsh45sv");
		
		loading.classList.add("hidden");
		
		// emit this to stores energies from sun and moon base set from server
		if(smEnergies.length == 0)
			socket.emit('get-energies');
	});
	
	// store last pack selection
	setDropdown.onchange = () => { localStorage.setItem(lsKey + "selection", setDropdown.value); };
	
	// send request for set
	setSubmit.onclick = () => {
		const setName = (setDropdown.value.indexOf("✓") > -1) ? setDropdown.value.slice(0, setDropdown.value.length - 2) : setDropdown.value;
		
		// get ID from name
		for(let i = 0; i < setIDs.length; i++)
			if(setData[setIDs[i]] == setName)
				currSetID = setIDs[i];
		
		// only emit if it is not in localstorage, otherwise pull from localstorage
		if(!localStorage.getItem(lsKey + currSetID) || (currSetID == "sm115" && !localStorage.getItem(lsKey + "sma")) || (currSetID == "swsh45" && !localStorage.getItem(lsKey + "swsh45sv"))) {
			socket.emit('get-set', currSetID);
			
			// also get shiny vault if hidden/shining fates
			if(currSetID == "sm115")
				socket.emit('get-set', "sma");
			else if(currSetID == "swsh45")
				socket.emit('get-set', "swsh45sv");
			
			loading.classList.remove("hidden");
		} else {
			currSet = JSON.parse(localStorage.getItem(lsKey + currSetID));
			showCards();
		}
		
		errDisp.classList.add("hidden");
		
		// console.log(currSetID);
	};
	
	// energy storage
	socket.on('get-energies',(data) => {
		for(let i = 164; i < data.length; i++)
			smEnergies.push(data[i]);
		
		localStorage.setItem(lsKey + "smEnergy", JSON.stringify(smEnergies));
	});
	
	// hide loading icon and set localstorage data
	socket.on('get-set',(data, setID) => {
		// try to store new set data in localStorage
		try { localStorage.setItem(lsKey + setID, JSON.stringify(data)); }
		catch(err) {
			// store data to put back into localStorage
			let selection, energy, hiddenFates, shiningFates;
			selection = localStorage.getItem(lsKey + "selection");
			energy = localStorage.getItem(lsKey + "smEnergy");
			hiddenVault = localStorage.getItem(lsKey + "sma");
			shiningVault = localStorage.getItem(lsKey + "swsh45sv");
			
			// clear localstorage and restore some old data
			localStorage.clear();
			localStorage.setItem(lsKey + "cleared", true);
			localStorage.setItem(lsKey + "selection", selection);
			localStorage.setItem(lsKey + "smEnergy", energy);
			localStorage.setItem(lsKey + "sma", hiddenVault);
			localStorage.setItem(lsKey + "swsh45sv", shiningVault);
			
			localStorage.setItem(lsKey + setID, JSON.stringify(data));
		}
		
		currSet = data;
		
		if(setID != "sma" && setID != "swsh45sv")
			showCards();
		
		loading.classList.add("hidden");
	});
	
	// send error to console
	socket.on('error',(err) => {
		errDisp.innerHTML = `<p class="header">ERROR:</p>`;
		errDisp.innerHTML += "Something went wrong!<br>";
		errDisp.innerHTML += "Please report the following to the dev:<br>";
		errDisp.innerHTML += err;
		errDisp.classList.remove("hidden");
	});
	
	// generate packs and display them
	let showCards = () => {
		// empty array to hold current pack
		let packArr = [];
		let holo = true;
		
		// for use in show/get booster art
		let boosterArt = "";
		
		// divide current set by rarities
		let currSetJson = {};
		currSetJson.comm = currSet.filter((card) => { return card.rarity == "Common"; });
		currSetJson.uncomm = currSet.filter((card) => { return card.rarity == "Uncommon"; });
		currSetJson.rare = currSet.filter((card) => { return card.rarity == "Rare"; });
		currSetJson.holo = currSet.filter((card) => { return card.rarity == "Rare Holo"; });
		currSetJson.gx = currSet.filter((card) => { return card.rarity == "Rare Holo GX"; });
		currSetJson.prism = currSet.filter((card) => { return card.rarity == "Rare Prism Star"; });
		currSetJson.v = currSet.filter((card) => { return card.rarity == "Rare Holo V"; });
		currSetJson.vmax = currSet.filter((card) => { return card.rarity == "Rare Holo VMAX"; });
		currSetJson.ult = currSet.filter((card) => { return card.rarity == "Rare Ultra"; });
		currSetJson.rain = currSet.filter((card) => { return card.rarity == "Rare Rainbow"; });
		currSetJson.sec = currSet.filter((card) => { return card.rarity == "Rare Secret"; });
		currSetJson.amaz = currSet.filter((card) => { return card.rarity == "Amazing Rare"; });
		
		// if shining legends, add shining cards to currSetJson
		if(currSetID == "sm35")
			currSetJson.shining = currSet.filter((card) => { return card.rarity == "Rare Shining"; });
		
		// subset to hold multiple reverse slot inserts
		let subset = {};
		if(currSetID == "sm115") {
			let tempSet = JSON.parse(localStorage.getItem(lsKey + "sma"));
			try {
				subset.baby = tempSet.filter((card) => { return card.rarity == "Rare Shiny"; });
				subset.gx = tempSet.filter((card) => { return card.rarity == "Rare Holo GX"; });
				subset.trainer = tempSet.filter((card) => { return card.rarity == "Rare Ultra"; });
				subset.golden = tempSet.filter((card) => { return card.rarity == "Rare Secret"; });
			} catch(err) {
				errDisp.innerHTML = `<p class="header">ERROR:</p>`;
				errDisp.innerHTML += "Something went wrong!<br>";
				errDisp.innerHTML += "Your pack might not be accurate this time, "
				errDisp.innerHTML += "but if you try again in a minute, it will likely "
				errDisp.innerHTML += "be way better."
				errDisp.classList.remove("hidden");
				
				// fill will commons so it'll still show a pack
				subset.baby = currSetJson.comm;
				subset.gx = currSetJson.comm;
				subset.trainer = currSetJson.comm;
				subset.golden = currSetJson.comm;
			}
		} else if(currSetID == "swsh45") {
			let tempSet = JSON.parse(localStorage.getItem(lsKey + "swsh45sv"));
			try {
				subset.baby = tempSet.filter((card) => { return card.rarity == "Rare Shiny"; });
				subset.v = tempSet.filter((card) => { return card.rarity == "Rare Holo V"; });
				subset.vmax = tempSet.filter((card) => { return card.rarity == "Rare Holo VMAX"; });
				subset.golden = tempSet.filter((card) => { return card.rarity == "Rare Secret"; });
			} catch(err) {
				errDisp.innerHTML = `<p class="header">ERROR:</p>`;
				errDisp.innerHTML += "Something went wrong!<br>";
				errDisp.innerHTML += "Your pack might not be accurate this time, "
				errDisp.innerHTML += "but if you try again in a minute, it will likely "
				errDisp.innerHTML += "be way better."
				errDisp.classList.remove("hidden");
				
				// fill will commons so it'll still show a pack
				subset.baby = currSetJson.comm;
				subset.v = currSetJson.comm;
				subset.vmax = currSetJson.comm;
				subset.golden = currSetJson.comm;
			}
		}
		
		// check for duplicate cards
		let dupeCheck = (currPack, set) => {
			let dupe, rand;

			// loops until dupe is false
			do {
				dupe = false;
				rand = randomInt(0, set.length);
				
				for(let i = 0; i < currPack.length; i++) {
					// also check if it's an energy 
					// only really applicable to sm1
					if(currPack[i] == set[rand] || (set[rand].supertype == "Energy" && set[rand].subtypes[0] == "Basic")) {
						dupe = true;
						break;
					}
				}
			} while(dupe);
			
			// return card
			return set[rand];
		};
		
		// get a specific kind of secret rare
		// currently only used for cosmic eclipse
		let getSpecificSec = (supertype, set) => {
			let loop = true;
			let rand;
			
			do {
				rand = randomInt(0, set.length);
				
				if(set[rand].supertype == supertype)
					loop = false;
			
			} while(loop);
			
			return set[rand];
		};
		
		// get a random card from the entirety of your given set
		let randCard = (set) => { return set[randomInt(0, set.length)]; };
		
		// gets a pack from a set of parameters,
		// most likely won't be used for older sets,
		// but good for newer sets
		let getPack = (reverse = "none",
					   rev = {},
					   rareOdds = {},
					   useSmEnergies = true,) => {

			let retArr = [];
			const comm = randomInt(0, 5) + 4;
			const uncom = 8 - comm;
			const prism = (reverse == "prism" && randomFixed(0, 100) < rev.perc) ? true : false;
			const secMon = (reverse == "sec-mon" && randomFixed(0, 100) < rev.perc) ? true : false;
			const energy = (reverse == "energy" && randomFixed(0, 100) < rev.perc) ? true : false;
			const amazing = (reverse == "amazing" && randomFixed(0, 100) < rev.perc) ? true : false;
			const multiple = (reverse == "multiple") ? true : false;
			
			// fill up common and uncommon slots
			for(let i = 0; i < comm; i++)
				retArr.push(dupeCheck(retArr, currSetJson.comm));
			
			for(let i = 0; i < uncom; i++)
				retArr.push(dupeCheck(retArr, currSetJson.uncomm));
			
			// shuffle array order
			shuffle(retArr);
			
			// reverse slot
			if(multiple) {
				if(currSetID == "sm115") {				// hidden fates
					if(randomFixed(0, 100) < rev.golden)
						retArr.push(randCard(subset.golden));
					else if(randomFixed(0, 100) < rev.trainer)
						retArr.push(randCard(subset.trainer));
					else if(randomFixed(0, 100) < rev.gx)
						retArr.push(randCard(subset.gx));
					else if(randomFixed(0, 100) < rev.baby)
						retArr.push(randCard(subset.baby));
				} else if(currSetID == "swsh45") {		// shining fates
					if(randomFixed(0, 100) < rev.golden)
						retArr.push(randCard(subset.golden));
					else if(randomFixed(0, 100) < rev.vmax)
						retArr.push(randCard(subset.vmax));
					else if(randomFixed(0, 100) < rev.amazing)
						retArr.push(randCard(currSetJson.amaz));
					else if(randomFixed(0, 100) < rev.v)
						retArr.push(randCard(subset.v));
					else if(randomFixed(0, 100) < rev.baby)
						retArr.push(randCard(subset.baby));
				}
			} else if(prism)
				retArr.push(randCard(currSetJson.prism));
			else if(secMon)
				retArr.push(getSpecificSec("Pokémon", currSetJson.sec));
			else if (energy && useSmEnergies)
				retArr.push(randCard(smEnergies));
			else if(amazing)
				retArr.push(randCard(currSetJson.amaz));
			
			// if insert card hasn't been picked, do this instead
			if(retArr.length != 9) {
				if(randomFixed(0, 100) < rareOdds.revRare) {
					if(randomFixed(0, 100) < rareOdds.holo)
						retArr.push(randCard(currSetJson.holo));
					else
						retArr.push(randCard(currSetJson.rare));
				} 
				else if(randomFixed(0, 100) < rareOdds.uncomRev)
					retArr.push(randCard(currSetJson.uncomm));
				else
					retArr.push(randCard(currSetJson.comm));
			}
			
			// rare slot
			if(randomFixed(0, 100) < rareOdds.sec)
				retArr.push(randCard(currSetJson.sec));
			else if(randomFixed(0, 100) < rareOdds.rain)
				retArr.push(randCard(currSetJson.rain));
			else if(randomFixed(0, 100) < rareOdds.ult)
				retArr.push(randCard(currSetJson.ult));
			else if(rareOdds.vmax) {
				if(randomFixed(0, 100) < rareOdds.vmax)
					retArr.push(randCard(currSetJson.vmax));
				else if(randomFixed(0, 100) < rareOdds.v)
					retArr.push(randCard(currSetJson.v));
			} else if(rareOdds.gx) {
				if(randomFixed(0, 100) < rareOdds.shining)
					retArr.push(randCard(currSetJson.shining));
				else if(randomFixed(0, 100) < rareOdds.gx)
					retArr.push(randCard(currSetJson.gx));
			}
			
			// if rare hasn't been selected, go to these conditions
			if(retArr.length == 9) {
				if(randomFixed(0, 100) < rareOdds.holo)
					retArr.push(randCard(currSetJson.holo));
				else {
					retArr.push(randCard(currSetJson.rare));
					holo = false;
				}
			}
			
			if(useSmEnergies) {
				let card = randCard(smEnergies);
				
				// prevent fairy energy in swsh sets
				if(currSetID.indexOf("swsh") > -1) {
					let isFairy;
					do {
						isFairy = false;						
						if(card.name == "Fairy Energy") {
							isFairy = true;
							card = randCard(smEnergies);
						}
					} while(isFairy);
				}
				
				// place energy in front
				retArr.unshift(card); 
			}
			
			return retArr;
		};

		// custom func for detective pikachu packs since they're weird 4 card packs
		let detectivePack = () => {
			// 4 cards
			// only commons, rares, and URs
			const comm = 3;
			const URperc = 37.08;
			let retArr = [];
			
			// fill commons
			for(let i = 0; i < comm; i++)
				retArr.push(dupeCheck(retArr, currSetJson.comm));
			
			// "ultra rare" in this set just means holographic star symbol
			// for rarity--no spectacular art or anything
			if(randomFixed(0, 100) < URperc)
				retArr.push(randCard(currSetJson.ult));
			else
				retArr.push(randCard(currSetJson.rare));
			
			return retArr;
		};

		// most modern set pull rate data taken from here:
		// https://efour.proboards.com/thread/16380/pull-rates-modern-sets
		// if not from there, it will be specified
		// revRare, holo, and uncommon rare are guesses based on VV pull 
		// rates unless otherwise stated
		switch(currSetID) {
			default:
				for(let i = 0; i < 11; i++)
					packArr.push(randCard(currSet));
				break;
			case "sm1":								 
				packArr = getPack("none", { perc : 0 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 0.81,
					rain : 1.47,
					ult : 4.22,
					gx : 11.15,
				});
				break;
			case "sm2":								 
				packArr = getPack("none", { perc : 0 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 0.81,
					rain : 1.29,
					ult : 3.59,
					gx : 11.11,
				});
				break;
			case "sm3":								 
				packArr = getPack("none", { perc : 0 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 0.95,
					rain : 1.59,
					ult : 3.93,
					gx : 10.95,
				});
				break;
			case "sm35":								 
				packArr = getPack("energy", { perc : 9.52 }, {		// energy insert percent is a guess based on champ's path below
					revRare : 60,
					holo : 100,
					uncomRev : 34,
					sec : 0.91,
					rain : 1.50,
					ult : 3.97,
					gx : 11.85,
					shining : 8.72,
				});
				break;
			case "sm4":								 
				packArr = getPack("none", { perc : 0 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 1.11,
					rain : 1.11,
					ult : 4.44,
					gx : 8.30,
				});
				break;
			case "sm5":								 
				packArr = getPack("prism", { perc : 7.91 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 0.71,
					rain : 1.34,
					ult : 3.56,
					gx : 7.44,
				});
				break;
			case "sm6":								 
				packArr = getPack("prism", { perc : 7.91 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 0.71,
					rain : 1.34,
					ult : 3.56,
					gx : 7.44,
				});
				break;
			case "sm7":								 
				packArr = getPack("prism", { perc : 5.47 }, {
					revRare : 60,
					holo : 16.76,
					uncomRev : 34,
					sec : 0.88,
					rain : 1.22,
					ult : 3.78,
					gx : 10.34,
				});
				break;
			case "sm75":								
				packArr = getPack("prism", { perc : 10.8 }, {
					revRare : 60,
					holo : 100,
					uncomRev : 34,
					sec : 0.77,
					rain : 2.31,
					ult : 6.94,
					gx : 15.42,
				});
				break;
			case "sm8":								 
				packArr = getPack("prism", { perc : 12.17 }, {	 
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 1.02,
					rain : 1.33,
					ult : 4.4, 
					gx : 10.28,
				});
				break;
			case "sm9":								 
				packArr = getPack("prism", { perc : 5.96 }, {	  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.69,
					rain : 1.03,
					ult : 4.82,
					gx : 9.29, 
				});
				break;
			case "det1":
				packArr = detectivePack();	// custom func because weird set
				break;
			case "sm10":								
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.9, 
					rain : 1.39,
					ult : 4.12,
					gx : 9.88, 
				});
				break;
			case "sm11":								
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.9, 
					rain : 1.44,
					ult : 4.36,
					gx : 12.72,
				});
				break;
			case "sm115":
				packArr = getPack("multiple", {
					golden : 1.77,
					trainer : 3.42,
					gx : 10.19,
					baby : 21.2,
					}, {	
						revRare : 60,  
						holo : 16.76,  
						uncomRev : 34, 
						sec : 0,		// secrets are handled in reverse slot
						rain : 1.71,
						ult : 4.87,
						gx : 15.06
					});
				break;
			case "sm12":
				packArr = getPack("sec-mon", { perc : 10.11 }, {   
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.89,
					rain : 1.5,
					ult : 3.74,
					gx : 11.93,
				});
				break;
			case "swsh1":
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.91,
					rain : 1.23,
					ult : 3.74,
					vmax : 2.2,
					v : 14.2,  
				});
				break;
			case "swsh2":
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.95,
					rain : 1.5,
					ult : 3.76,
					vmax : 3.4,
					v : 12.65, 
				});
				break;
			case "swsh3":
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 0.87,
					rain : 1.19,
					ult : 3.85,
					vmax : 3.85,
					v : 12.58, 
				});
				break;
			case "swsh35":	// champ's path data from https://cardzard.com/blogs/news/champions-path-pull-rate-data-2020
				packArr = getPack("energy", { perc : 9.52 }, {	 
					revRare : 17.03,  
					holo : 100,
					uncomRev : 34, 
					sec : 1.28,
					rain : 1.65,
					ult : 4.21,
					vmax : 17.03,  
					v : 17.03, 
				});
				break;
			case "swsh4":	// vivid voltage data from https://cardzard.com/blogs/news/vivid-voltage-pull-rate-data
				packArr = getPack("amazing", { perc : 5.17 }, {	
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 1.05,
					rain : 1.42,
					ult : 4.07,
					vmax : 4.17,
					v : 12.41, 
				});
				break;
			case "swsh45":	// shining fates data from https://cardzard.com/blogs/news/shining-fates-pull-rate-data-2021 and https://old.reddit.com/r/PokemonTCG/comments/ln53pr/compiling_shining_fates_pull_data_and_results/
				packArr = getPack("multiple", {
					golden : 0.64,
					vmax : 2.58,
					amazing : 5.24,
					v : 7.27,
					baby : 23.18,
					}, {	
						revRare : 58.57,
						holo : 17.53,
						uncomRev : 34, 
						sec : 0,		// secrets are handled in reverse slot
						rain : 1.79,
						ult : 4.58,
						vmax : 5.34,
						v : 11.04, 
					});
				break;
			case "swsh5":	// battle styles data from https://cardzard.com/blogs/news/battle-styles-pull-rate-data
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 16.76,  
					uncomRev : 34, 
					sec : 1,	// golden cards + alt art VMAX
					rain : 0.93,
					ult : 3.13,	// fart v + fart trainer
					vmax : 4.34,
					v : 12.1, 
				});
				break;
			case "swsh6":	// chilling reign data from https://cardzard.com/blogs/news/chilling-reign-pull-rate-data-2021
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 13.2,  
					uncomRev : 34, 
					sec : 1.22,	// golden + alt art vmax
					rain : 0.82,
					ult : 3.32, // fart v + fart trainer
					vmax : 4.18,
					v : 12.1, 	// data not provided, so will remain the same from previous set
				});
				break;
			case "swsh7":	// evolving skies data from https://www.reddit.com/r/PokemonTCG/comments/pf5scn/evolving_skies_pull_rate_data_from_5000_packs/
				packArr = getPack("none", { perc : 0 }, {		  
					revRare : 60,  
					holo : 13.2,  // not provided, will remain saim
					uncomRev : 34, 
					sec : 1.36,	// golden + alt art vmax
					rain : 1.22,
					ult : 2.29, // fart v + fart trainer
					vmax : 5.55,
					v : 12.1, 	// data not provided, so will remain the same from previous set
				});
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
			loading.classList.remove("hidden");
			flex.classList.add("center");
			div.classList.add("booster-container");
			img.classList.add("booster-art");
			img.classList.add("tilt1");
			img.onload = () => { loading.classList.add("hidden"); };
			img.src = imgSrc;
			flex.onclick = () => { open(flex,div); };
			flex.appendChild(div);
			div.appendChild(img);
			pack.appendChild(flex);
		};
		
		// run getBooster art
		getBoosterArt();
		
		let open = (parent,child) => {			
			// remove event handler on parent
			parent.onclick = false;
			
			// zoom child in
			child.classList.add("zoom");
			
			// remove hidden class from loading
			loading.classList.remove("hidden");
			
			// handle showing an error if applicable
			errDisp.classList.add("hidden");
			
			// reset timeout for error checking
			clearTimeout(errCheck);
			errCheck = setTimeout(() => {
				if(loading.classList.length == 0) {
					errDisp.innerHTML = `<p class="header">NOTICE:</p>`;
					errDisp.innerHTML += "This seems to be taking a while...<br>";
					errDisp.innerHTML += "If this persists, please refresh and try again.";
					errDisp.classList.remove("hidden");
				}
			}, 10000);
			
			// format pack
			for(let i = 0; i < packArr.length; i++) {
				let div = document.createElement('div');
				let img = document.createElement('img');
				div.classList.add("card");
				div.classList.add("tilt1");
				div.classList.add("hidden");
				div.style.zIndex = 100 - i;
				
				// if last card in pack, remove loading and err message and add onclick to first child
				if(i == packArr.length - 1) {
					img.onload = () => { 
						loading.classList.add("hidden"); 
						errDisp.classList.add("hidden");
					};
				}
				
				img.src = packArr[i].images.small;
				tilt1 = true;
				
				// do this for modern completed sets
				for(let j = 0; j < completedSets.length; j++)
					if(completedSets[j] == currSetID) {
						if(packArr[i].supertype == "Energy" && packArr[i].subtypes[0] == "Basic")
							img.classList.add("sm-energy");
						
						// add holo class to reverse and end holo
						if(currSetID != "det1" && (holo && i == (packArr.length - 1) || i == (packArr.length - 2)))
							div.classList.add("holo");
						
						break;
					}
				
				// every card in detective pikachu is a holo
				if(currSetID == "det1")
					div.classList.add("holo");
				
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
						} else if(packArr[i].tcgplayer.prices.holofoil) {					   // this check is a fallback for sets that are still 100% randomized
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
							//console.log("Error on card: " + i);
							//console.log(packArr[i]);
							//console.log(err);
						}
						continue;
					}
				}
				
				// create header
				p.innerHTML = `<p class="header">PRICE:</p>`;
				
				// update innerhtml for new p element
				if(!noPrices) {
					p.innerHTML += "Your pack is worth: <b>$" + price.toFixed(2) + "</b>.<br>";
					p.innerHTML += "Your best hit was: <b>" + packArr[highestIndex].name + "</b> at <b>$" + highest.toFixed(2) + "</b>.";
				} else {
					p.innerHTML += "This pack is missing at least one card on TCGPlayer, and therefore cannot be accurately valued. <br>";
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