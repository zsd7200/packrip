"use strict";

/*
MAIN.JS

Loads DOM elements upon window load, handles input, handles dark mode, and more.
*/
window.onload = function () {
  var loading = document.querySelector("#lds-ring");
  var setDropdown = document.querySelector("#sets");
  var setSubmit = document.querySelector("#set-submit");
  var pack = document.querySelector("#pack");
  var lsKey = "zsdpackrip-";
  var smEnergies = localStorage.getItem(lsKey + "smEnergy") ? JSON.parse(localStorage.getItem(lsKey + "smEnergy")) : [];
  var setData = {};
  var setIDs = [];
  var currSet = {};
  var currSetID = ""; // get setIDs upon load

  socket.on('start', function (sets) {
    setData = JSON.parse(sets);
    setIDs = Object.keys(setData).filter(function (set) {
      // filter out promos, mcdonalds sets, and POP series sets
      if (setData[set].indexOf("Promo") > -1 || setData[set].indexOf("McDonald") > -1 || setData[set].indexOf("POP") > -1) return false;else return true;
    });

    for (var i = 0; i < setIDs.length; i++) {
      var option = document.createElement("option");
      option.text = setData[setIDs[i]];
      setDropdown.add(option);
    } // enable items and restore last selection (if applicable)


    if (setDropdown.options.length > 0) {
      setSubmit.disabled = false;
      setDropdown.disabled = false;
      if (localStorage.getItem(lsKey + "selection")) setDropdown.value = localStorage.getItem(lsKey + "selection");
    } else console.log("error, could not get data from server");

    loading.classList.add("hidden"); // emit this to stores energies from sun and moon base set from server

    if (smEnergies.length == 0) socket.emit('get-energies');
  }); // store last pack selection

  setDropdown.onchange = function () {
    localStorage.setItem(lsKey + "selection", setDropdown.value);
  }; // send request for set


  setSubmit.onclick = function () {
    // get ID from name
    for (var i = 0; i < setIDs.length; i++) {
      if (setData[setIDs[i]] == setDropdown.value) currSetID = setIDs[i];
    } // only emit if it is not in localstorage, otherwise pull from localstorage


    if (!localStorage.getItem(lsKey + currSetID)) {
      socket.emit('get-set', currSetID);
      loading.classList.remove("hidden");
    } else {
      currSet = JSON.parse(localStorage.getItem(lsKey + currSetID));
      showCards();
    }
  }; // energy storage


  socket.on('get-energies', function (data) {
    for (var i = 164; i < data.length; i++) {
      smEnergies.push(data[i]);
    }

    localStorage.setItem(lsKey + "smEnergy", JSON.stringify(smEnergies));
  }); // hide loading icon and set localstorage data

  socket.on('get-set', function (data, setID) {
    loading.classList.add("hidden");
    localStorage.setItem(lsKey + setID, JSON.stringify(data));
    currSet = data;
    showCards();
  }); // send error to console

  socket.on('error', function (err) {
    console.log(err);
  }); // currently just gets 10 random cards
  // (should be set to 11 with energies)

  var showCards = function showCards() {
    // empty array to hold current pack
    var packArr = [];
    var holo = true; // divide current set by rarities

    var currSetComm = currSet.filter(function (card) {
      return card.rarity == "Common";
    });
    var currSetUncomm = currSet.filter(function (card) {
      return card.rarity == "Uncommon";
    });
    var currSetRare = currSet.filter(function (card) {
      return card.rarity == "Rare";
    });
    var currSetHolo = currSet.filter(function (card) {
      return card.rarity == "Rare Holo";
    });
    var currSetV = currSet.filter(function (card) {
      return card.rarity == "Rare Holo V";
    });
    var currSetVMax = currSet.filter(function (card) {
      return card.rarity == "Rare Holo VMAX";
    });
    var currSetUlt = currSet.filter(function (card) {
      return card.rarity == "Rare Ultra";
    });
    var currSetRain = currSet.filter(function (card) {
      return card.rarity == "Rare Rainbow";
    });
    var currSetSec = currSet.filter(function (card) {
      return card.rarity == "Rare Secret";
    });
    var currSetAmaz = currSet.filter(function (card) {
      return card.rarity == "Amazing Rare";
    }); // check for duplicate cards

    var dupeCheck = function dupeCheck(currPack, set) {
      var dupe, rand; // loops until dupe is false

      do {
        dupe = false;
        rand = random(0, set.length);

        for (var i = 0; i < currPack.length; i++) {
          if (currPack[i] == set[rand]) {
            dupe = true;
            break;
          }
        }
      } while (dupe); // return card


      return set[rand];
    };

    var randCard = function randCard(set) {
      return set[random(0, set.length)];
    };

    switch (currSetID) {
      default:
        for (var i = 0; i < 11; i++) {
          packArr.push(randCard(currSet));
        }

        break;

      case "swsh4":
        // vivid voltage data from https://cardzard.com/blogs/news/vivid-voltage-pull-rate-data
        var comm = random(0, 5) + 4; // at least 4 commons

        var uncom = 8 - comm; // remainder with uncommons

        var amazing = random(0, 20) == 0 ? true : false; // 1/20 chance for amazing
        // fill up common and uncommon slots

        for (var _i = 0; _i < comm; _i++) {
          packArr.push(dupeCheck(packArr, currSetComm));
        }

        for (var _i2 = 0; _i2 < uncom; _i2++) {
          packArr.push(dupeCheck(packArr, currSetUncomm));
        } // shuffle array order


        shuffle(packArr); // reverse slot

        if (amazing) packArr.push(randCard(currSetAmaz));else if (random(0, 2184) < 1313) {
          // 60% chance for reverse slot rare (same as regular chances of non-holo rare)
          if (random(0, 2184) < 366) // 17% chance for reverse slot holo rare
            packArr.push(randCard(currSetHolo));else packArr.push(randCard(currSetRare));
        } else if (random(0, 3) == 0) // 1/3 chance for uncommon reverse slot over common, this one is a guess
          packArr.push(randCard(currSetUncomm));else packArr.push(randCard(currSetComm)); // rare slot

        if (random(0, 2184) < 23) // 1.05% chance for golden
          packArr.push(randCard(currSetSec));else if (random(0, 2184) < 31) // 1.42% chance for rainbow
          packArr.push(randCard(currSetRain));else if (random(0, 2184) < 89) // 4.07% chance for ultra rare
          packArr.push(randCard(currSetUlt));else if (random(0, 2184) < 91) // 4.17% chance for VMAX
          packArr.push(randCard(currSetVMax));else if (random(0, 2184) < 271) // 12.41 chance for V
          packArr.push(randCard(currSetV));else if (random(0, 2184) < 366) // 16.76% chance for holo
          packArr.push(randCard(currSetHolo));else {
          packArr.push(randCard(currSetRare));
          holo = false;
        } // energies from VV are supposed to be from swsh base set
        // but the TCG API doesn't have these energies available,
        // so we're using sm energies instead

        packArr.unshift(randCard(smEnergies));
        break;
    } // clear pack innerHTML and 


    pack.innerHTML = "";

    for (var _i3 = 0; _i3 < packArr.length; _i3++) {
      var div = document.createElement('div');
      var img = document.createElement('img');
      div.classList.add("card");
      img.src = packArr[_i3].images.small;

      if (currSetID === "swsh4") {
        if (_i3 == 0) img.classList.add("sm-energy"); // add holo class to reverse and end holo

        if (holo && _i3 == packArr.length - 1 || _i3 == packArr.length - 2) div.classList.add("holo");
      }

      div.appendChild(img);
      pack.appendChild(div);
    }
  };
};
/*
VARIABLES.JS

Global variables and helper functions.
*/

/* MARK: - Other Variables - */


var darkMode = false;
var socket = io();
/* MARK: - Helper Functions - */
// random int

var random = function random(min, max) {
  return Math.floor(Math.random() * max) + min;
}; // shuffle array
// taken from https://javascript.info/task/shuffle


var shuffle = function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = random(0, i);
    var _ref = [arr[j], arr[i]];
    arr[i] = _ref[0];
    arr[j] = _ref[1];
  }
}; // fading elements in/out helper functions


var fade = function fade(el1, el2) {
  el1.style.opacity = "0";
  setTimeout(function () {
    el1.style.display = "none";
    el2.style.display = "block";
    setTimeout(function () {
      el2.style.opacity = "100";
    }, 50);
  }, 500);
};

var fadeOut = function fadeOut(el) {
  el.style.opacity = "0";
  setTimeout(function () {
    el.style.display = "none";
  }, 500);
};

var fadeIn = function fadeIn(el) {
  var displayType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "block";
  el.style.display = displayType;
  setTimeout(function () {
    el.style.opacity = "100";
  }, 50);
};