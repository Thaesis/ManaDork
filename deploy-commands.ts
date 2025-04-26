import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js"
import * as dotenv from "dotenv"
import { readdirSync } from "fs"
import path from "path"

dotenv.config();

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

const commandFiles = readdirSync(path.join(__dirname, "commands"))
                        .filter(file => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Registering slahs commands. . .');

        await rest.put(
            Routes.applicationCommands(process.env.APP_ID!),
            { body: commands }
        );

        console.log('Slash commands registered sucessfully.');
    } catch (error) {
        console.error(error);
    }
})();