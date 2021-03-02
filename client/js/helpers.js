/*
HELPERS.js

Helper functions.
*/

// random int
let randomInt = (min, max) => { return Math.floor(Math.random() * max) + min; };

// random with two decimal places
let randomFixed = (min, max) => { let num = Math.random() * max + min; return num.toFixed(2); };

// shuffle array
// taken from https://javascript.info/task/shuffle
let shuffle = (arr) => {
	for(let i = arr.length - 1; i > 0; i--) {
		let j = randomInt(0, i);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
};