Printedex lets you generate a personalized Pokemon list that you can print on paper.

## Run in local

Note:
Inside `public`, make sure to create a `sprites` folder. Then inside `sprites`, create 2 folders: `default` and `shiny`.

Then run:

```md
- npm install
- node script.js
- node scan.js
- npm run dev
```

`script.js` : will fetch required data to run everything in local in accord to the PokéApi rules. Images will go to newly created `sprites` folder and data will be writen inside `pokedox.js`.

`scan.js` : the function of the "scan.js" script is to examine the "pokedex.js" to verify that each individual Pokémon has all the specified data.
