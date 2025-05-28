<script setup>
import { onMounted, ref } from "vue";
import { pokedex } from "/pokedex.js";

const selectedGens = ref([]);
const selectedLanguage = ref("fr");

const gensList = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const languageList = ["fr", "eng", "jp"];
const pokemonList = ref([]);
const canPrint = ref(false);

onMounted(() => {
	selectedGens.value = gensList;
});

// Generate the filtered list
function generate() {
	if (selectedGens.value.length === 0) {
		selectedGens.value = gensList;
	}
	pokemonList.value = pokedex
		.filter((pokemon) => selectedGens.value.includes(pokemon.generation)) // Filter by generation
		.map((pokemon) => ({
			id: pokemon.id,
			name: pokemon.name[selectedLanguage.value],
			imageUrl: `./sprites/default/${pokemon.spriteFilenames.default}`,
			generation: pokemon.generation,
		}));
	canPrint.value = true;
}

// Show print dialog
function showPrintDialog() {
	window.print();
}
</script>

<template>
	<div class="generate">
		<!-- User selection controls -->
		<div id="filters">
			<div>
				<fieldset>
					<legend>Choisissez une ou plusieurs générations</legend>
					<label
						v-for="gen in gensList"
						:key="gen"
					>
						<input
							type="checkbox"
							:value="gen"
							v-model="selectedGens"
						/>
						Gen {{ gen }}
					</label>
				</fieldset>
			</div>

			<div>
				<fieldset>
					<legend>Choisissez une langue pour les noms</legend>
					<label
						v-for="lang in languageList"
						:key="lang"
					>
						<input
							type="radio"
							:value="lang"
							v-model="selectedLanguage"
						/>
						{{ lang }}
						<span>
							<img
								class="flag-icon"
								:src="`./icons/${lang}-flag.svg`"
								alt=""
							/>
						</span>
					</label>
				</fieldset>
			</div>
		</div>
		<button @click="generate">Generate List</button>
		<button
			:disabled="!canPrint"
			@click="showPrintDialog"
		>
			Impression
		</button>
	</div>

	<!-- generated list -->
	<div
		id="container"
		class="container"
	>
		<div
			v-for="pokemon in pokemonList"
			:key="pokemon.id"
			class="cell"
		>
			<input
				type="checkbox"
				v-model="pokemon.selected"
			/>
			<img
				class="sprite"
				:src="pokemon.imageUrl"
				:alt="pokemon.name"
			/>
			<div class="id-name-wrapper">
				<p class="pokemon-id">#{{ pokemon.id }} - G{{ pokemon.generation }}</p>
				<p>{{ pokemon.name }}</p>
			</div>
		</div>
	</div>
</template>
