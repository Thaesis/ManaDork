import {
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
    EmbedBuilder,
    ButtonInteraction,
    AttachmentBuilder,
    Collection,
    ActivityType
} from "discord.js";
import * as path from "path";
import { readdirSync } from "fs";
import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";
import { ClientWithCommands } from "./ClientWithCommands";
import { Card } from "./Card";
import * as util from "./util/util";
import { fetchCard } from "./util/fetchCard";
import { buildCardAttachments } from "./util/CardUtil";

dotenv.config();

// Bot Entrypoint
const client = new ClientWithCommands({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Command registration
client.commands = new Collection();

const commandFiles = readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    console.log(`Currently Servicing ${client.guilds.cache.size} servers`);
    client.user?.setPresence({
        activities: [{
            name: `Currently Assisting ${client.guilds.cache.size} servers!`,
            type: ActivityType.Watching
        }],
        status: `online`
    });
});

// Chat command handling
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const matches = [...message.content.matchAll(/\{\{(.+?)\}\}/g)];

    if (matches.length === 0) return;

    if (matches.length > 5) {
        await message.reply("⚠️ Users may only reference up to 5 cards at a time.");
        return;
    }

    for (const match of matches) {

        const rawContent = match[0].trim();

        try {

            const card = await fetchCard(rawContent);

            await message.channel.send({
                embeds: [card.getEmbed(util.EmbedType.Default)],
                files: await buildCardAttachments(card)
            });

        } catch (error) {

            if (axios.isAxiosError(error) && error.response?.data?.object === "error") {
                const apiError = error.response.data;
                await message.channel.send(`:x: **SCryfall**: ${apiError.details}`);

            } else {

                console.error(error);
                await message.channel.send(`:warning: An unexpected error occurred while fetching card **${rawContent}**.`);

            }
        }
    }
});


// Command Passthrough
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No Command Assocaited with ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: `There was an error executing ${command}` });
    }
});

client.login(process.env.DISCORD_TOKEN);