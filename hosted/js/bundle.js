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
  var setData = {};
  var setIDs = [];
  var currSet = {};
  var currSetID = "";
  var lsKey = "zsdpackrip-"; // get setIDs upon load

  socket.on('start', function (sets) {
    setData = JSON.parse(sets);
    setIDs = Object.keys(setData);

    for (var i = 0; i < setIDs.length; i++) {
      var option = document.createElement("option");
      option.text = setData[setIDs[i]];
      setDropdown.add(option);
    } // enable items and restore last selection (if applicable)


    if (setDropdown.options.length > 0) {
      setSubmit.disabled = false;
      setDropdown.disabled = false;
      if (localStorage.getItem(lsKey + "selection")) setDropdown.value = localStorage.getItem(lsKey + "selection");
    } else console.log("error");

    loading.classList.add("hidden");
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
  }; // hide loading icon and set localstorage data


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

    for (var i = 0; i < 10; i++) {
      var energy = false;
      var rand = random(0, currSet.length);
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
    } // clear pack innerHTML and 


    pack.innerHTML = "";

    for (var _i = 0; _i < packArr.length; _i++) {
      var img = document.createElement('img');
      img.classList.add("card");
      img.src = packArr[_i].images.small;
      pack.appendChild(img);
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