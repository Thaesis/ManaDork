# ManaDork Discord Bot

<img src="assets/thumbnail/scrybot.png" alt="ManaDork Banner" width="600"/>

---

ManaDork is a Discord bot designed to enhance Magic: The Gathering gameplay, allowing users to easily query card keywords, mechanics, and rules directly from Scryfall.

🔮 Built for speed, accuracy, and ease of use.

---

## Features
- `/keyword` command to fetch keyword rules and descriptions
- Fuzzy search (handles typos and partial matches)
- Option to display responses privately
- Powered by Scryfall API
- Lightweight and optimized for fast response times

---
## Card Referencing

All magic cards can be referenced in any block of text using `{{ card_name }}` or `{{ card_name [set, collector] }}`.
> Example: " `{{Boiling Seas}}` is such a lame card."  
> Example: "Dude, `{{swamp[ONE, 367]}}` looks insane."


## Slash Commands

| Command | Description |
|:--|:--|
| `/rulings <name>` | Displays the 5 most recent offical rulings pertaining to a given card. |
|`/legal <name>` | Displays the legality of a given card for all formats of Magic: the Gathering.|
|`/sets <name>` | Displays the sets in which a given card is included in Magic: the Gathering.|
| `/keyword <name>` | Displays the mechanics associated with a Magic: The Gathering keyword. |
| `/keyword <name> [private: true/false]` | (Optional) Display the keyword info privately (only visible to you). |

> Example: `/keyword flying`

---
