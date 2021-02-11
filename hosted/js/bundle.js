"use strict";

/*
MAIN.JS

Loads DOM elements upon window load, handles input, handles dark mode, and more.
*/
window.onload = function () {
  var loading = document.querySelector("#lds-ring");
  var setDropdown = document.querySelector("#sets");
  var setSubmit = document.querySelector("#set-submit");
  var setIDs = [];
  var currSet = {};
  var lsKey = "zsdpackrip-"; // get setIDs upon load

  socket.on('start', function (sets) {
    setIDs = sets;

    for (var i = 0; i < setIDs.length; i++) {
      var option = document.createElement("option");
      option.text = setIDs[i];
      setDropdown.add(option);
    }

    loading.classList.add("hidden");
  }); // send request for set

  setSubmit.onclick = function () {
    // only emit if it is not in localstorage, otherwise pull from localstorage
    if (!localStorage.getItem(lsKey + setDropdown.value)) socket.emit('get-set', setDropdown.value);else console.log(JSON.parse(localStorage.getItem(lsKey + setDropdown.value)));
  }; // set localstorage data


  socket.on('get-set', function (data, setID) {
    localStorage.setItem(lsKey + setID, JSON.stringify(data));
  }); // send error to console

  socket.on('error', function (err) {
    console.log(err);
  });
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