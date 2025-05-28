import { pokedex } from "./pokedex.js";

// Verify the structure of pokedex
if (!Array.isArray(pokedex)) {
	console.log("❌ Error: pokedex.js format is invalid!");
	process.exit(1);
}

// Count total Pokémon
const totalCount = pokedex.length;

// Find unique IDs
const uniqueIds = new Set(pokedex.map((entry) => entry.id));
const uniqueCount = uniqueIds.size;

// Count duplicate occurrences
const duplicateCount = pokedex.reduce((acc, entry) => {
	acc[entry.id] = (acc[entry.id] || 0) + 1;
	return acc;
}, {});

// Filter only IDs that appear more than once
const duplicateEntries = Object.entries(duplicateCount)
	.filter(([_, count]) => count > 1)
	.map(([id, count]) => ({ id, count }));

// Detect missing properties
const missingData = {
	fr: [],
	eng: [],
	jp: [],
	generation: [],
	defaultSprite: [],
	shinySprite: [],
};

const missingLabels = {
	fr: "a French name",
	eng: "an English name",
	jp: "a Japanese name",
	generation: "a valid generation",
	defaultSprite: "a default sprite",
	shinySprite: "a shiny sprite",
};

pokedex.forEach((entry) => {
	if (!entry.name?.fr) missingData.fr.push(entry.id);
	if (!entry.name?.eng) missingData.eng.push(entry.id);
	if (!entry.name?.jp) missingData.jp.push(entry.id);
	if (!entry.generation) missingData.generation.push(entry.id);
	if (!entry.spriteFilenames?.default) missingData.defaultSprite.push(entry.id);
	if (!entry.spriteFilenames?.shiny) missingData.shinySprite.push(entry.id);
});

// 📝 Scan Report
console.log(`🔍 Scan Report:`);
console.log(`📌 Total Pokémon: ${totalCount}`);
console.log(`🆔 Unique Pokémon IDs: ${uniqueCount}`);

if (duplicateEntries.length === 0) {
	console.log("✅ No duplicate Pokémon IDs found!");
} else {
	console.log(`⚠️  Found duplicate Pokémon IDs!`);
	console.log(`📌 Duplicate list:\n`);
	duplicateEntries.forEach(({ id, count }) => {
		console.log(`- ID ${id} → Appears **${count} times**`);
	});
}

// 🛠️ Missing Property Report
console.log(`\n🔍 **Missing Data Report:**\n`);
Object.entries(missingData).forEach(([property, ids]) => {
	if (ids.length > 0) {
		console.log(
			`⚠️  Missing ${missingLabels[property]} for ${
				ids.length
			} Pokémon: ${ids.join(", ")}`
		);
	} else {
		console.log(`✅ All Pokémon have ${missingLabels[property]}!`);
	}
});
