// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

const customRacerName = {
	"Racer 1": "Lightning McQueen",
	"Racer 2": "Doc Hudson",
	"Racer 3": "Ramone",
	"Racer 4": "Sally Carrera",
	"Racer 5": "Mater"
}

const customTrackName = {
	"Track 1": "Bristol Motor Speedway",
	"Track 2": "Martinswville Speedway",
	"Track 3": "Los Angeles Intl Speedway",
	"Track 4": "Rustbelt Raceway",
	"Track 5": "Tomasville Speedway",
	"Track 6": "Race Around Radiator Springs"
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				console.log("getTracks:", tracks)
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				console.log("getRacers:", racers)
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		let { target } = event

		// Race track form field
		if (target.matches('.card.track') || target.parentNode.matches('.card.track')) {
			if (target.parentNode.matches('.card.track')) {
				target = target.parentNode;
			}
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer') || target.parentNode.matches('.card.podracer')) {
			if (target.parentNode.matches('.card.podracer')) {
				target = target.parentNode;
			}
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE


/**
* @description This async function controls the flow of the race, add the logic and error handling
* Get player_id and track_id from the store,
* invoke the API call to create the race, then save the result,
* render starting UI
* update the store with the race id
* The race has been created, now start the countdown:
* call the async function runCountdown,
* call the async function startRace,
* call the async function runRace
*/
async function handleCreateRace() {
	const player_id = store.player_id;
	const track_id = store.track_id;

	if (!player_id || !track_id) {
		alert("Please select racer and track to start the race!");
		return
	}

	try {
		const race = await createRace(player_id, track_id);

		renderAt('#race', renderRaceStartView(race.Track, race.Cars));

		store.race_id = parseInt(race.ID) - 1;

		await runCountdown();

		await startRace(store.race_id);

		await runRace(store.race_id);

	} catch (err) {
		console.log("Error with handleCreateRace:: ", err);
	}
}


/**
* @description 
* use Javascript's built in setInterval method to get race info every 500ms,
**/
	/* 
		if the race info status property is "in-progress", update the leaderboard by calling:
		renderAt('#leaderBoard', raceProgress(res.positions))
	*/

	/* 
		if the race info status property is "finished", run the following:

		clearInterval(raceInterval) // to stop the interval from repeating
		renderAt('#race', resultsView(res.positions)) // to render the results view
		reslove(res) // resolve the promise
	*/
function runRace(raceID) {
	return new Promise(resolve => {
		const raceInterval = setInterval(async () => {

			try {
				const raceStatus = await getRace(raceID)
				console.log("raceStatus.status: ", raceStatus.status)
				if (raceStatus.status === "in-progress") {
					renderAt('#leaderBoard', raceProgress(raceStatus.positions))
				} else if (raceStatus.status === "finished") {
					clearInterval(raceInterval)
					renderAt('#race', resultsView(raceStatus.positions))
					resolve(raceStatus)
				}
			} catch (err) {
				console.log("Error with raceInterval:: ", err)

			}
		}, 500)
	})
}

/**
* @description 
* wait for the DOM to load,
* use Javascript's built in setInterval method to count down once per second,
* run this DOM manipulation to decrement the countdown for the user,
* if the countdown is done, clear the interval, resolve the promise, and return
*/
async function runCountdown() {
	try {
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			const countdown = setInterval(() => {
				if (timer !== 0) {
					document.getElementById('big-numbers').innerHTML = --timer
				} else {
					clearInterval(countdown);
					resolve();
				}
			}, 1000);
		})
	} catch (error) {
		console.log("Error with runCountdown:: ", error);
	}
}


/**
* @description 
* remove class selected from all racer options,
* add class selected to current target,
* save the selected racer to the store
* @param {object} target - html element for racer
*/
function handleSelectPodRacer(target) {
	const selected = document.querySelector('#racers .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	target.classList.add('selected')

	store.player_id = parseInt(target.id);
}

/**
* @description 
* remove class selected from all track options,
* add class selected to current target,
* save the selected track id to the store
* @param {object} target - html element for track
*/
function handleSelectTrack(target) {
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	target.classList.add('selected')

	store.track_id = parseInt(target.id)
}

/**
* @description Invoke the API call to accelerate
*/
function handleAccelerate() {
	accelerate(store.race_id)
		.then(() => console.log("accelerate button clicked"))
		.catch((error) => console.log(error))
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	console.log("renderRacerCars:", racers)
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${customRacerName[driver_name]}</h3>
			<p>Top speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
			<img class="racerCard" src="/assets/images/Racer_${id}.jpeg" alt="${customRacerName[driver_name]}"/>
		</li>
	`
}

function renderTrackCards(tracks) {
	console.log("renderTrackCards:", tracks)
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track
	return `
		<li id="${id}" class="card track">
			<h3>${customTrackName[name]}</h3>
			
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	const { name } = track
	return `
		<header>
			<h1>Track: ${customTrackName[name]}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>
			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me Fast!!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		if (p.id == store.player_id) {
			return `
			<tr>
				<td>
					<h3>${count++} - ${customRacerName[p.driver_name]} - you</h3>
				</td>
			</tr>
		`
		} else {
			return `
			<tr>
				<td>
					<h3>${count++} - ${customRacerName[p.driver_name]}</h3>
				</td>
			</tr>
		`
		}
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results.join(' ')}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	}
}

// Make a fetch call (with error handling!) to each of the following API endpoints 

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`)
		.then(res => res.json())
		.catch(err => console.log(err))
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`)
		.then(res => res.json())
		.catch(err => console.log(err))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`)
		.then(res => res.json())
		.catch(err => console.log(err))
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.catch(err => console.log("Problem with getRace request::", err))
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.catch(err => console.log("Problem with accelerate request::", err))
}
