/*
VARIABLES.JS

Global variables and helper functions.
*/

/* MARK: - Other Variables - */
let darkMode = false;
let socket = io();

/* MARK: - Helper Functions - */
// random int
let random = (min, max) => { return Math.floor(Math.random() * max) + min; };

// shuffle array
// taken from https://javascript.info/task/shuffle
let shuffle = (arr) => {
    for(let i = arr.length - 1; i > 0; i--) {
        let j = random(0, i);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
};