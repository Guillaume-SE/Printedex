import axios from "axios";
import fs from "fs";
import path from "path";
import readline from "readline";

const dataFile = path.join(process.cwd(), "pokedex.js");
// const imagesFolder = path.join(process.cwd(), "public/sprites");
const defaultSpritesFolder = path.join(process.cwd(), "public/sprites/default");
const shinySpritesFolder = path.join(process.cwd(), "public/sprites/shiny");

if (!fs.existsSync(defaultSpritesFolder)) {
	fs.mkdirSync(defaultSpritesFolder);
}
if (!fs.existsSync(shinySpritesFolder)) {
	fs.mkdirSync(shinySpritesFolder);
}

// Set up readline for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// HELPERS

const failedRequests = new Map();

function handleError(errorMessage, id, reason) {
	console.warn(errorMessage);

	if (!failedRequests.has(id)) {
		failedRequests.set(id, []);
	}

	failedRequests.get(id).push(reason); // Track multiple failures per Pokémon
}

async function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNameByLanguage(namesArray, langCode) {
	return namesArray.find((n) => n.language.name === langCode)?.name || null;
}

function formatGeneration(generationName) {
	const mapping = {
		"generation-i": "1",
		"generation-ii": "2",
		"generation-iii": "3",
		"generation-iv": "4",
		"generation-v": "5",
		"generation-vi": "6",
		"generation-vii": "7",
		"generation-viii": "8",
		"generation-ix": "9",
		"generation-x": "10",
	};

	return mapping[generationName] || null;
}

function getSpriteFilename(name, id, variant = "") {
	// Sanitize ":" to avoid errors with Pokémon "Type:0".
	const sanitizedName = name ? name.replace(/:/g, "_") : `Pokemon_${id}`;
	return variant ? `${sanitizedName}_${variant}.jpg` : `${sanitizedName}.jpg`;
}

function getImagePath(filename, type) {
	const folder = type === "shiny" ? shinySpritesFolder : defaultSpritesFolder;
	return path.join(folder, filename);
}

async function saveSpriteImage(spriteUrl, filename, type) {
	if (spriteUrl) {
		const imagePath = getImagePath(filename, type);
		const imageStream = await axios({
			url: spriteUrl,
			method: "GET",
			responseType: "stream",
		});
		imageStream.data.pipe(fs.createWriteStream(imagePath));
	} else {
		console.warn(`Image not found for ${filename}`);
	}
}

// CORE

async function fetchData(number, pokedexData) {
	try {
		// Fetch species data
		let infoResponse;
		try {
			infoResponse = await axios.get(
				`https://pokeapi.co/api/v2/pokemon-species/${number}`
			);
			if (!infoResponse.data) {
				handleError(
					`API returned no data for Pokémon ID ${number}`,
					number,
					"empty species response"
				);
				return; // Skip processing this Pokémon
			}
		} catch (error) {
			handleError(
				`Failed to fetch Pokémon species data for ID ${number}: ${error.message}`,
				number,
				"fetching species data"
			);
			return; // Skip processing this Pokémon
		}

		const id = infoResponse.data.id;
		const nameFr = getNameByLanguage(infoResponse.data.names, "fr");
		const nameEng = getNameByLanguage(infoResponse.data.names, "en");
		const nameJp = getNameByLanguage(infoResponse.data.names, "ja");
		const generation = formatGeneration(infoResponse.data.generation.name);

		if (!nameFr)
			handleError(
				`French name missing for Pokémon ID ${number}`,
				number,
				"adding fr name"
			);
		if (!nameEng)
			handleError(
				`English name missing for Pokémon ID ${number}`,
				number,
				"adding eng name"
			);
		if (!nameJp)
			handleError(
				`Japanese name missing for Pokémon ID ${number}`,
				number,
				"adding jp name"
			);

		if (!generation)
			handleError(
				`Pokémon ID ${number} doesn't have a valid generation`,
				number,
				"adding generation"
			);

		// Fetch image data
		let spriteFilenameDefault;
		let spriteFilenameShiny;
		try {
			const imageResponse = await axios.get(
				`https://pokeapi.co/api/v2/pokemon/${number}`
			);
			const frontDefaultUrl = imageResponse.data.sprites.front_default || null;
			const frontShinyUrl = imageResponse.data.sprites.front_shiny || null;

			spriteFilenameDefault = frontDefaultUrl
				? getSpriteFilename(nameFr, number)
				: null;
			spriteFilenameShiny = frontShinyUrl
				? getSpriteFilename(nameFr, number, "shiny")
				: null;

			if (frontDefaultUrl) {
				const defaultFilename = getSpriteFilename(nameFr, number);
				await saveSpriteImage(frontDefaultUrl, defaultFilename, "default"); // Pass only the filename
			}

			if (frontShinyUrl) {
				const shinyFilename = getSpriteFilename(nameFr, number, "shiny");
				await saveSpriteImage(frontShinyUrl, shinyFilename, "shiny"); // Pass only the filename
			}
		} catch (error) {
			handleError(
				`Failed to fetch Pokémon image data for ID ${number}: ${error.message}`,
				number,
				"fetching image data"
			);
			return;
		}

		// Add entry to pokedexData
		const entry = {
			id,
			name: { fr: nameFr, eng: nameEng, jp: nameJp },
			generation,
			spriteFilenames: {
				default: spriteFilenameDefault,
				shiny: spriteFilenameShiny,
			},
		};
		pokedexData.push(entry);
		console.log(`Successfully saved Pokémon ID ${id}!`);
	} catch (error) {
		handleError(
			`Unexpected error processing Pokémon ID ${number}: ${error.message}`,
			number,
			"unexpected processing error"
		);
	}
}

function askForRange() {
	rl.question(
		"Enter the first Pokedex ID of your list (minimum 1): ",
		(first) => {
			const firstId = parseInt(first, 10);
			if (isNaN(firstId) || firstId < 1) {
				console.log("Invalid input. First ID must be 1 or greater.");
				return askForRange();
			}

			rl.question(
				"Enter the last Pokedex ID of your list (must be greater than first): ",
				(last) => {
					const lastId = parseInt(last, 10);
					if (isNaN(lastId) || lastId <= firstId) {
						console.log(
							"Invalid input. Last ID must be greater than first ID."
						);
						return askForRange();
					}

					rl.close();
					startProcessing(firstId, lastId);
				}
			);
		}
	);
}

// EXECUTION

async function startProcessing(firstId, lastId) {
	console.log(`✅ Input validated: Range ${firstId} - ${lastId}`);

	// Erase previous data
	fs.writeFileSync(dataFile, "export const pokedex = [];");
	console.log("pokedex.js cleared before filling new data.");

	const pokedexData = [];
	const range = Array.from(
		{ length: lastId - firstId + 1 },
		(_, i) => firstId + i
	);

	await Promise.all(
		range.map(async (number) => {
			await fetchData(number, pokedexData);
			await delay(20);
		})
	);

	try {
		pokedexData.sort((a, b) => a.id - b.id);
		fs.writeFileSync(
			dataFile,
			`export const pokedex = ${JSON.stringify(pokedexData, null, 2)};`
		);
		console.log("Data saved successfully to pokedex.js!");
	} catch (error) {
		handleError(
			`Failed to save JSON data file: ${error.message}`,
			"N/A",
			"saving data"
		);
	}
}

askForRange();
