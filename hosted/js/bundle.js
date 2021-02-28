"use strict";

/*
MAIN.JS

Loads DOM elements upon window load, handles input, handles dark mode, and more.
*/
window.onload = function () {
  var loading = document.querySelector("#lds-ring");
  var errDisp = document.querySelector("#err-disp");
  var setDropdown = document.querySelector("#sets");
  var setSubmit = document.querySelector("#set-submit");
  var pack = document.querySelector("#pack");
  var lsKey = "zsdpackrip-";
  var packArtDir = "assets/img/packs/";
  var smEnergies = localStorage.getItem(lsKey + "smEnergy") ? JSON.parse(localStorage.getItem(lsKey + "smEnergy")) : [];
  var setData = {};
  var setIDs = [];
  var currSet = {};
  var currSetID = "";
  var tilt1 = true; // used for synchronizing animations after putting cards back

  var errCheck; // use this so only one setTimeout is going at a time in open()
  // get setIDs upon load

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
    } else {
      errDisp.innerHTML = "<p class=\"header\">ERROR:</p>";
      errDisp.innerHTML += "Something went wrong!<br>";
      errDisp.innerHTML += "Could not get data from server!<br>";
      errDisp.innerHTML += "Please refresh the page.";
      errDisp.classList.remove("hidden");
    }

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
    } // console.log(currSetID);

  }; // energy storage


  socket.on('get-energies', function (data) {
    for (var i = 164; i < data.length; i++) {
      smEnergies.push(data[i]);
    }

    localStorage.setItem(lsKey + "smEnergy", JSON.stringify(smEnergies));
  }); // hide loading icon and set localstorage data

  socket.on('get-set', function (data, setID) {
    loading.classList.add("hidden"); // try to store new set data in localStorage

    try {
      localStorage.setItem(lsKey + setID, JSON.stringify(data));
    } catch (err) {
      // store data to put back into localStorage
      var selection, energy;
      selection = localStorage.getItem(lsKey + "selection");
      energy = localStorage.getItem(lsKey + "smEnergy"); // clear localstorage and restore some old data

      localStorage.clear();
      localStorage.setItem(lsKey + "selection", selection);
      localStorage.setItem(lsKey + "smEnergy", energy);
      localStorage.setItem(lsKey + setID, JSON.stringify(data));
    }

    currSet = data;
    showCards();
  }); // send error to console

  socket.on('error', function (err) {
    errDisp.innerHTML = "<p class=\"header\">ERROR:</p>";
    errDisp.innerHTML += "Something went wrong!<br>";
    errDisp.innerHTML += "Please report the following to the dev:<br>";
    errDisp.innerHTML += err;
    errDisp.classList.remove("hidden");
  }); // generate packs and display them

  var showCards = function showCards() {
    // empty array to hold current pack
    var packArr = [];
    var holo = true; // for use in show/get booster art

    var boosterArt = ""; // divide current set by rarities

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
    }; // get a random card from the entirety of your given set


    var randCard = function randCard(set) {
      return set[random(0, set.length)];
    }; // gets a pack from a set of parameters,
    // most likely won't be used for older sets,
    // but good for newer sets


    var getPack = function getPack() {
      var reverse = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "none";
      var revPerc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
      var totalOdds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var rareOdds = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var guaranteeHolo = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      var useSmEnergies = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
      var retArr = [];
      var comm = random(0, 5) + 4;
      var uncom = 8 - comm;
      var amazing = reverse == "amazing" && random(0, 100) < revPerc ? true : false;
      var energy = reverse == "energy" && random(0, 100) < revPerc ? true : false; // fill up common and uncommon slots

      for (var i = 0; i < comm; i++) {
        retArr.push(dupeCheck(retArr, currSetComm));
      }

      for (var _i = 0; _i < uncom; _i++) {
        retArr.push(dupeCheck(retArr, currSetUncomm));
      } // shuffle array order


      shuffle(retArr); // reverse slot

      if (amazing) retArr.push(randCard(currSetAmaz));else if (energy && useSmEnergies) retArr.push(randCard(smEnergies));else if (random(0, totalOdds) < rareOdds.revRare) {
        if (random(0, totalOdds) < rareOdds.holo || guaranteeHolo) retArr.push(randCard(currSetHolo));else retArr.push(randCard(currSetRare));
      } else if (random(0, totalOdds) < rareOdds.uncomRev) retArr.push(randCard(currSetUncomm));else retArr.push(randCard(currSetComm)); // rare slot

      if (random(0, totalOdds) < rareOdds.sec) retArr.push(randCard(currSetSec));else if (random(0, totalOdds) < rareOdds.rain) retArr.push(randCard(currSetRain));else if (random(0, totalOdds) < rareOdds.ult) retArr.push(randCard(currSetUlt));else if (random(0, totalOdds) < rareOdds.vmax) retArr.push(randCard(currSetVMax));else if (random(0, totalOdds) < rareOdds.v) retArr.push(randCard(currSetV));else if (random(0, totalOdds) < rareOdds.holo || guaranteeHolo) retArr.push(randCard(currSetHolo));else {
        retArr.push(randCard(currSetRare));
        holo = false;
      }
      if (useSmEnergies) retArr.unshift(randCard(smEnergies));
      return retArr;
    };

    switch (currSetID) {
      default:
        for (var i = 0; i < 11; i++) {
          packArr.push(randCard(currSet));
        }

        break;

      case "swsh4":
        // vivid voltage data from https://cardzard.com/blogs/news/vivid-voltage-pull-rate-data
        packArr = getPack("amazing", 5, 2184, {
          // 5% chance for amazing, x/2184 for whole set
          revRare: 1313,
          // 60% chance for reverse slot rare (same as regular chances of non-holo rare)
          holo: 366,
          // 16.76% chance for holo
          uncomRev: 764,
          // 35% chance for uncommon reverse slot over common, this one is a guess
          sec: 23,
          // 1.05% chance for golden
          rain: 31,
          // 1.42% chance for rainbow
          ult: 89,
          // 4.07% chance for ultra rare
          vmax: 91,
          // 4.17% chance for VMAX
          v: 271 // 12.41 chance for V

        });
        break;

      case "swsh35":
        // champ's path data from https://cardzard.com/blogs/news/champions-path-pull-rate-data-2020
        packArr = getPack("energy", 9, 1457, {
          // 9% chance for amazing, x/1457 for whole set
          revRare: 248,
          // 17% chance for reverse slot rare (same as regular chances of non-holo rare)
          holo: 1105,
          // 75% chance for holo
          uncomRev: 504,
          // 34% chance for uncommon reverse slot over common, this one is a guess
          sec: 19,
          // 1.28% chance for secret
          rain: 24,
          // 1.65% chance for rainbow
          ult: 61,
          // 4.21% chance for ultra rare
          vmax: 248,
          // 17.03% chance for VMAX
          v: 248 // 17.03% chance for V

        }, true);
        break;
    } // clear pack innerHTML and 


    pack.innerHTML = ""; // check if image for booster exists
    // otherwise, use default image

    var getBoosterArt = function getBoosterArt() {
      var img = new Image();

      img.onload = function () {
        showBoosterArt(packArtDir + currSetID + ".webp");
      };

      img.onerror = function () {
        showBoosterArt(packArtDir + "default.webp");
      };

      img.src = packArtDir + currSetID + ".webp";
    }; // called with correct source after finding out what src to use


    var showBoosterArt = function showBoosterArt(imgSrc) {
      var flex = document.createElement('div');
      var div = document.createElement('div');
      var img = document.createElement('img');
      flex.classList.add("center");
      div.classList.add("booster-container");
      img.classList.add("booster-art");
      img.classList.add("tilt1");
      img.src = imgSrc;

      flex.onclick = function () {
        open(flex, div);
      };

      flex.appendChild(div);
      div.appendChild(img);
      pack.appendChild(flex);
    }; // run getBooster art


    getBoosterArt();

    var open = function open(parent, child) {
      // remove event handler on parent
      parent.onclick = false; // zoom child in

      child.classList.add("zoom"); // remove hidden class from loading

      loading.classList.remove("hidden"); // handle showing an error if applicable

      errDisp.classList.add("hidden"); // reset timeout for error checking

      clearTimeout(errCheck);
      errCheck = setTimeout(function () {
        if (loading.classList.length == 0) {
          errDisp.innerHTML = "<p class=\"header\">ERROR:</p>";
          errDisp.innerHTML += "It seems like something went wrong...<br>";
          errDisp.innerHTML += "Please refresh and try again.";
          errDisp.classList.remove("hidden");
        }
      }, 5000); // format pack

      var _loop = function _loop(_i2) {
        var div = document.createElement('div');
        var img = document.createElement('img');
        div.classList.add("card");
        div.classList.add("tilt1");
        div.classList.add("hidden");
        div.style.zIndex = 100 - _i2; // if last card in pack, remove loading and err message

        if (_i2 == packArr.length - 1) img.onload = function () {
          loading.classList.add("hidden");
          errDisp.classList.add("hidden");
        };
        img.src = packArr[_i2].images.small;
        tilt1 = true; // do this for modern completed sets

        if (currSetID === "swsh4" || currSetID === "swsh35") {
          if (packArr[_i2].supertype == "Energy" && !packArr[_i2].subtypes) img.classList.add("sm-energy"); // add holo class to reverse and end holo

          if (holo && _i2 == packArr.length - 1 || _i2 == packArr.length - 2) div.classList.add("holo");
        }

        div.onclick = function () {
          moveCard(_i2, parent);
        };

        div.appendChild(img);
        parent.appendChild(div);
      };

      for (var _i2 = 0; _i2 < packArr.length; _i2++) {
        _loop(_i2);
      } // remove child and show cards


      setTimeout(function () {
        child.remove();

        for (var _i3 = 0; _i3 < parent.childNodes.length; _i3++) {
          parent.childNodes[_i3].classList.remove("hidden");
        }
      }, 500);
    };

    var moveCard = function moveCard(cardIndex, parent) {
      var p; // move the card over to the left by adding seen card class

      parent.childNodes[cardIndex].classList.add("seen-card");
      parent.childNodes[cardIndex].classList.remove("tilt1");
      parent.childNodes[cardIndex].classList.remove("tilt2");
      parent.childNodes[cardIndex].style.zIndex = packArr.length + cardIndex; // add new onclick handler to put it back on the pile

      parent.childNodes[cardIndex].onclick = function () {
        if (p) p.remove();
        parent.childNodes[cardIndex].style.zIndex = 100 - cardIndex;
        parent.childNodes[cardIndex].classList.remove("seen-card"); // sync tilt animation

        var _loop2 = function _loop2(_i4) {
          // remove all tilt
          parent.childNodes[_i4].classList.remove("tilt1");

          parent.childNodes[_i4].classList.remove("tilt2"); // readd tilt


          setTimeout(function () {
            if (tilt1) parent.childNodes[_i4].classList.add("tilt2");else parent.childNodes[_i4].classList.add("tilt1");
          }, 10);
        };

        for (var _i4 = cardIndex; _i4 < parent.childNodes.length; _i4++) {
          _loop2(_i4);
        } // swap tilt variable


        tilt1 = !tilt1;

        parent.childNodes[cardIndex].onclick = function () {
          moveCard(cardIndex, parent);
        };
      }; // get price of pack based on TCGPlayer market price


      if (cardIndex == packArr.length - 1) {
        p = document.createElement('p');
        var noPrices = false;
        var highest = 0;
        var highestIndex = 0;
        var price = 0;

        for (var _i5 = 0; _i5 < packArr.length; _i5++) {
          // start from holofoil and work down
          try {
            if (packArr[_i5].tcgplayer.prices.holofoil && _i5 == packArr.length - 1 || !packArr[_i5].tcgplayer.prices.reverseHolofoil && _i5 == packArr.length - 2) {
              price += packArr[_i5].tcgplayer.prices.holofoil.market;

              if (packArr[_i5].tcgplayer.prices.holofoil.market > highest) {
                highest = packArr[_i5].tcgplayer.prices.holofoil.market;
                highestIndex = _i5;
              }
            } else if (packArr[_i5].tcgplayer.prices.reverseHolofoil && _i5 == packArr.length - 2) {
              price += packArr[_i5].tcgplayer.prices.reverseHolofoil.market;

              if (packArr[_i5].tcgplayer.prices.reverseHolofoil.market > highest) {
                highest = packArr[_i5].tcgplayer.prices.reverseHolofoil.market;
                highestIndex = _i5;
              }
            } else if (packArr[_i5].tcgplayer.prices.normal) {
              price += packArr[_i5].tcgplayer.prices.normal.market;

              if (packArr[_i5].tcgplayer.prices.normal.market > highest) {
                highest = packArr[_i5].tcgplayer.prices.normal.market;
                highestIndex = _i5;
              }
            } else if (packArr[_i5].tcgplayer.prices.holofoil) {
              // this check is a fallback for sets that are still 100% randomized
              price += packArr[_i5].tcgplayer.prices.holofoil.market;

              if (packArr[_i5].tcgplayer.prices.holofoil.market > highest) {
                highest = packArr[_i5].tcgplayer.prices.holofoil.market;
                highestIndex = _i5;
              }
            }
          } catch (err) {
            // to prevent this from being thrown on energy cards
            if (packArr[_i5].supertype != "Energy") noPrices = true; // tcgplayer price debugging

            if (noPrices) {
              console.log("Error on card: " + _i5);
              console.log(packArr[_i5]);
              console.log(err);
            }

            continue;
          }
        } // create header


        p.innerHTML = "<p class=\"header\">PRICE:</p>"; // update innerhtml for new p element

        if (!noPrices) {
          p.innerHTML += "Your pack is worth: <b>$" + price.toFixed(2) + "</b>.<br>";
          p.innerHTML += "Your best hit was: <b>" + packArr[highestIndex].name + "</b> at <b>$" + highest.toFixed(2) + "</b>.";
        } else {
          p.innerHTML += "This pack is missing at least one card on TCGPlayer, and therefore cannot be valued. <br>";
          p.innerHTML += "Apologies for the inconvenience.";
        }

        p.style.zIndex = 1000;
        p.classList.add("price"); // append to flexbox

        parent.appendChild(p);
      }
    };
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
};