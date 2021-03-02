"use strict";

/*
HELPERS.js

Helper functions.
*/
// random int
var randomInt = function randomInt(min, max) {
  return Math.floor(Math.random() * max) + min;
}; // random with two decimal places


var randomFixed = function randomFixed(min, max) {
  var num = Math.random() * max + min;
  return num.toFixed(2);
}; // shuffle array
// taken from https://javascript.info/task/shuffle


var shuffle = function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = randomInt(0, i);
    var _ref = [arr[j], arr[i]];
    arr[i] = _ref[0];
    arr[j] = _ref[1];
  }
};
/*
MAIN.JS

Loads DOM elements upon window load, 
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

  var completedSets = ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8", "sm9", "sm10", "sm11", "sm12", "swsh1", "swsh2", "swsh3", "swsh35", "swsh4"];
  var socket = io(); // get setIDs upon load

  socket.on('start', function (sets) {
    setData = JSON.parse(sets);
    setIDs = Object.keys(setData).filter(function (set) {
      // filter out promos, mcdonalds sets, and POP series sets
      if (setData[set].indexOf("Promo") > -1 || setData[set].indexOf("McDonald") > -1 || setData[set].indexOf("POP") > -1) return false;else return true;
    });

    for (var i = 0; i < setIDs.length; i++) {
      var option = document.createElement("option");
      option.text = setData[setIDs[i]]; // add checkmark to completed sets

      for (var j = 0; j < completedSets.length; j++) {
        if (completedSets[j] == setIDs[i]) {
          option.text += " ✓";
          break;
        }
      }

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
    var setName = setDropdown.value.indexOf("✓") > -1 ? setDropdown.value.slice(0, setDropdown.value.length - 2) : setDropdown.value; // get ID from name

    for (var i = 0; i < setIDs.length; i++) {
      if (setData[setIDs[i]] == setName) currSetID = setIDs[i];
    } // only emit if it is not in localstorage, otherwise pull from localstorage


    if (!localStorage.getItem(lsKey + currSetID)) {
      socket.emit('get-set', currSetID);
      loading.classList.remove("hidden");
    } else {
      currSet = JSON.parse(localStorage.getItem(lsKey + currSetID));
      showCards();
    }

    errDisp.classList.add("hidden");
    console.log(currSetID);
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
    });
    var currSetGX = currSet.filter(function (card) {
      return card.rarity == "Rare Holo GX";
    });
    var currSetPrism = currSet.filter(function (card) {
      return card.rarity == "Rare Prism Star";
    }); // check for duplicate cards

    var dupeCheck = function dupeCheck(currPack, set) {
      var dupe, rand; // loops until dupe is false

      do {
        dupe = false;
        rand = randomInt(0, set.length);

        for (var i = 0; i < currPack.length; i++) {
          // also check if it's an energy 
          // only really applicable to sm1
          if (currPack[i] == set[rand] || set[rand].supertype == "Energy" && set[rand].subtypes[0] == "Basic") {
            dupe = true;
            break;
          }
        }
      } while (dupe); // return card


      return set[rand];
    }; // get a specific kind of secret rare
    // currently only used for cosmic eclipse


    var getSpecificSec = function getSpecificSec(supertype, set) {
      var loop = true;
      var rand;

      do {
        rand = randomInt(0, set.length);
        if (set[rand].supertype == supertype) loop = false;
      } while (loop);

      return set[rand];
    }; // get a random card from the entirety of your given set


    var randCard = function randCard(set) {
      return set[randomInt(0, set.length)];
    }; // gets a pack from a set of parameters,
    // most likely won't be used for older sets,
    // but good for newer sets


    var getPack = function getPack() {
      var reverse = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "none";
      var revPerc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
      var rareOdds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var useSmEnergies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      var retArr = [];
      var comm = randomInt(0, 5) + 4;
      var uncom = 8 - comm;
      var prism = reverse == "prism" && randomFixed(0, 100) < revPerc ? true : false;
      var secMon = reverse == "sec-mon" && randomFixed(0, 100) < revPerc ? true : false;
      var energy = reverse == "energy" && randomFixed(0, 100) < revPerc ? true : false;
      var amazing = reverse == "amazing" && randomFixed(0, 100) < revPerc ? true : false; // fill up common and uncommon slots

      for (var i = 0; i < comm; i++) {
        retArr.push(dupeCheck(retArr, currSetComm));
      }

      for (var _i = 0; _i < uncom; _i++) {
        retArr.push(dupeCheck(retArr, currSetUncomm));
      } // shuffle array order


      shuffle(retArr); // reverse slot

      if (prism) retArr.push(randCard(currSetPrism));else if (secMon) retArr.push(getSpecificSec("Pokémon", currSetSec));else if (energy && useSmEnergies) retArr.push(randCard(smEnergies));else if (amazing) retArr.push(randCard(currSetAmaz));else if (randomFixed(0, 100) < rareOdds.revRare) {
        if (randomFixed(0, 100) < rareOdds.holo) retArr.push(randCard(currSetHolo));else retArr.push(randCard(currSetRare));
      } else if (randomFixed(0, 100) < rareOdds.uncomRev) retArr.push(randCard(currSetUncomm));else retArr.push(randCard(currSetComm)); // rare slot

      if (randomFixed(0, 100) < rareOdds.sec) retArr.push(randCard(currSetSec));else if (randomFixed(0, 100) < rareOdds.rain) retArr.push(randCard(currSetRain));else if (randomFixed(0, 100) < rareOdds.ult) retArr.push(randCard(currSetUlt));else if (rareOdds.vmax) {
        if (randomFixed(0, 100) < rareOdds.vmax) retArr.push(randCard(currSetVMax));else if (randomFixed(0, 100) < rareOdds.v) retArr.push(randCard(currSetV));
      } else if (rareOdds.gx) {
        if (randomFixed(0, 100) < rareOdds.gx) retArr.push(randCard(currSetGX));
      } // if rare hasn't been selected, go to these conditions

      if (retArr.length == 9) {
        if (randomFixed(0, 100) < rareOdds.holo) retArr.push(randCard(currSetHolo));else {
          retArr.push(randCard(currSetRare));
          holo = false;
        }
      }

      if (useSmEnergies) {
        var card = randCard(smEnergies); // prevent fairy energy in swsh sets

        if (currSetID.indexOf("swsh") > -1) {
          var isFairy;

          do {
            isFairy = false;

            if (card.name == "Fairy Energy") {
              isFairy = true;
              card = randCard(smEnergies);
            }
          } while (isFairy);
        } // place energy in front


        retArr.unshift(card);
      }

      return retArr;
    }; // most modern set pull rate data taken from here:
    // https://efour.proboards.com/thread/16380/pull-rates-modern-sets
    // if not from there, it will be specified


    switch (currSetID) {
      default:
        for (var i = 0; i < 11; i++) {
          packArr.push(randCard(currSet));
        }

        break;

      case "sm1":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.81,
          rain: 1.47,
          ult: 4.22,
          gx: 11.15
        });
        break;

      case "sm2":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.81,
          rain: 1.29,
          ult: 3.59,
          gx: 11.11
        });
        break;

      case "sm3":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.95,
          rain: 1.59,
          ult: 3.93,
          gx: 10.95
        });
        break;

      case "sm4":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 1.11,
          rain: 1.11,
          ult: 4.44,
          gx: 8.30
        });
        break;

      case "sm5":
        packArr = getPack("prism", 7.91, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.71,
          rain: 1.34,
          ult: 3.56,
          gx: 7.44
        });
        break;

      case "sm6":
        packArr = getPack("prism", 7.91, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.71,
          rain: 1.34,
          ult: 3.56,
          gx: 7.44
        });
        break;

      case "sm7":
        packArr = getPack("prism", 5.47, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.88,
          rain: 1.22,
          ult: 3.78,
          gx: 10.34
        });
        break;

      case "sm75":
        packArr = getPack("prism", 10.8, {
          revRare: 60,
          holo: 100,
          uncomRev: 34,
          sec: 0.77,
          rain: 2.31,
          ult: 6.94,
          gx: 15.42
        });
        break;

      case "sm8":
        packArr = getPack("prism", 12.17, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 1.02,
          rain: 1.33,
          ult: 4.4,
          gx: 10.28
        });
        break;

      case "sm9":
        packArr = getPack("prism", 5.96, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.69,
          rain: 1.03,
          ult: 4.82,
          gx: 9.29
        });
        break;

      case "sm10":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.9,
          rain: 1.39,
          ult: 4.12,
          gx: 9.88
        });
        break;

      case "sm11":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.9,
          rain: 1.44,
          ult: 4.36,
          gx: 12.72
        });
        break;

      case "sm12":
        packArr = getPack("sec-mon", 10.11, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.89,
          rain: 1.5,
          ult: 3.74,
          gx: 11.93
        });
        break;

      case "swsh1":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.91,
          rain: 1.23,
          ult: 3.74,
          vmax: 2.2,
          v: 14.2
        });
        break;

      case "swsh2":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.95,
          rain: 1.5,
          ult: 3.76,
          vmax: 3.4,
          v: 12.65
        });
        break;

      case "swsh3":
        packArr = getPack("none", 0, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 0.87,
          rain: 1.19,
          ult: 3.85,
          vmax: 3.85,
          v: 12.58
        });
        break;

      case "swsh35":
        // champ's path data from https://cardzard.com/blogs/news/champions-path-pull-rate-data-2020
        packArr = getPack("energy", 9.52, {
          revRare: 17,
          holo: 100,
          uncomRev: 34,
          sec: 1.28,
          rain: 1.65,
          ult: 4.21,
          vmax: 17.03,
          v: 17.03
        });
        break;

      case "swsh4":
        // vivid voltage data from https://cardzard.com/blogs/news/vivid-voltage-pull-rate-data
        packArr = getPack("amazing", 5.17, {
          revRare: 60,
          holo: 16.76,
          uncomRev: 34,
          sec: 1.05,
          rain: 1.42,
          ult: 4.07,
          vmax: 4.17,
          v: 12.41
        });
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
      loading.classList.remove("hidden");
      flex.classList.add("center");
      div.classList.add("booster-container");
      img.classList.add("booster-art");
      img.classList.add("tilt1");

      img.onload = function () {
        loading.classList.add("hidden");
      };

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

        for (var j = 0; j < completedSets.length; j++) {
          if (completedSets[j] == currSetID) {
            if (packArr[_i2].supertype == "Energy" && packArr[_i2].subtypes[0] == "Basic") img.classList.add("sm-energy"); // add holo class to reverse and end holo

            if (holo && _i2 == packArr.length - 1 || _i2 == packArr.length - 2) div.classList.add("holo");
            break;
          }
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

            if (noPrices) {//console.log("Error on card: " + i);
              //console.log(packArr[i]);
              //console.log(err);
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