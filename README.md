# [Pokemon TCG Pack Simulator](http://www.openpkmn.cards/)
Also available at https://ripapack.herokuapp.com/.

Pokémon TCG pack opening simulator. Uses the [Pokémon TCG API](https://pokemontcg.io/) to get card/set data, and pull rate data from various sources in an attempt to be accurate to each set's own pull rates.

Currently completed sets:
- Sun and Moon (sm1)
- Guardians Rising (sm2)
- Burning Shadows (sm3)
- Shining Legends (sm35)
- Crimson Invasion (sm4)
- Ultra Prism (sm5)
- Forbidden Light (sm6)
- Celestial Storm (sm7)
- Dragon Majesty (sm75)
- Lost Thunder (sm8)
- Team Up (sm9)
- Detective Pikachu (det1)
- Unbroken Bonds (sm10)
- Unified Minds (sm11)
- Hidden Fates (sm115)
- Cosmic Eclipse (sm12)
- Sword and Shield (swsh1)
- Rebel Clash (swsh2)
- Darkness Ablaze (swsh3)
- Champion's Path (swsh35)
- Vivid Voltage (swsh4)
- Shining Fates (swsh45)
- Battle Styles (swsh5)\*

Completed sets are listed with a "✓" in the dropdown menu and have their own booster pack art. Uncompleted sets will show a default pack art and generate 11 cards at random from that set.

\* - Battle Styles pull data has been entered, but the Pokémon TCG API has not been updated to include Battle Styles as of 3/17/21. This asterisk will be removed once the API is updated and Battle Styles is tested to be accurate. 

## Install
To install and run the server locally run these commands:
```
git clone https://github.com/zsd7200/packrip.git
cd packrip
npm i
npm run watch
```
The server will now be running on port 3000 (http://localhost:3000/), unless otherwise specified.

Press `CTRL+C` to terminate the watch process.
