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

// fading elements in/out helper functions
let fade = (el1, el2) => {
    el1.style.opacity = "0";
    setTimeout(() => {
        el1.style.display = "none";
        
        el2.style.display = "block";
        setTimeout(() => {
            el2.style.opacity = "100";
        }, 50);
    }, 500);
};

let fadeOut = (el) => {
    el.style.opacity = "0";
    setTimeout(() => { el.style.display = "none"; }, 500);
};

let fadeIn = (el, displayType = "block") => {
    el.style.display = displayType;
    setTimeout(() => { el.style.opacity = "100"; }, 50);
};