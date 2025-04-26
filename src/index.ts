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
    Collection
} from "discord.js";
import * as path from "path";
import { readdirSync } from "fs";
import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";
import { ClientWithCommands } from "./ClientWithCommands";
import {Card} from "./Card";
import * as util from "./util";

dotenv.config();

const scryfallURL = `https://api.scryfall.com/`;
const moxfieldURL = `https://api.moxfield.com/json/decks/`;

// Bot Entrypoint
const client = new ClientWithCommands({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();

const commandFiles = readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log('Logged in as ${client.user?.tag}!');
});

client.on("messageCreate", async (message) =>{
    if (message.author.bot) return;

    if(message.content.startsWith("!card")) {

        const args = message.content.slice("!card".length).trim();

        const flags: string[] = args.match(/\/\w+/g) ?? [];
        const cleanArgs = args.replace(/\/\w+/g, "").trim();

        //Matching for Specific Pritings
        const specificPrintingRegex = /^(.+?)\[(\w{2,5}),\s*(\d+)\]$/;
        const match = cleanArgs.match(specificPrintingRegex);

        try{

            let card: Card;

            if (match) {
                const [_, name, setCode, collectorNumber] = match;
                const url = `${scryfallURL}cards/${setCode.toLowerCase()}/${collectorNumber}`
                const response = await util.throttledAxios(url);
                card = new Card(response.data);
            } else {
                const response = await util.throttledAxios(`${scryfallURL}cards/named?fuzzy=${encodeURIComponent(cleanArgs)}`);
                card = new Card(response.data);
            }

            if(flags.includes("/legalities")) {

                await message.channel.send({ 
                    embeds: [card.getEmbed(util.EmbedType.Legalities)], 
                    files: await getCardAttachments(card)
                });

            } else if(flags.includes("/sets")) {

                await card.loadPrintings();
                await sendPaginatedSetEmbed(message, card);

            } else if (flags.includes("/rulings")) {

                await card.loadRulings();
                await message.channel.send({ 
                    embeds: [card.getEmbed(util.EmbedType.Rulings)],
                    files: await getCardAttachments(card)
                });

            } else {

                await message.channel.send({
                    embeds: [card.getEmbed(util.EmbedType.Default)],
                    files: await getCardAttachments(card)
                });

            }
            
        } catch (error) {
            
            if(axios.isAxiosError(error) && error.response?.data?.object === "error") {
                const apiError = error.response.data;
                await message.channel.send(`:x: **SCryfall**: ${apiError.details}`);
            } else {
                console.error(error);
                await message.channel.send(`:warning: An unexpected error occurred while fetching ${Card.name}. For more information, use \`!help\``);
            }

        } 
    }
});

// Command Passthrough
client.on('interactionCreate', async interaction => {
    if(!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No Command Assocaited with ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: `There was an error executing ${command}`});
    }
});

async function sendPaginatedSetEmbed(message: Message, card: Card) {
        let currentPage = 1;
        const perPage = 20;

        const generateEmbed = (page: number): EmbedBuilder => {
            return card.getSetEmbed(page, perPage);
        };

        const row = () =>
         new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next ➡️')
                .setStyle(ButtonStyle.Secondary)
        );

        const sentMessage = await (message.channel as TextChannel).send({
            embeds: [generateEmbed(currentPage)],
            components: [row()],
            files: await getCardAttachments(card)
        })

        const collector = sentMessage.createMessageComponentCollector({
            time: 60_000
        });

        collector.on("collect", async (interaction: ButtonInteraction) => {

            if (interaction.customId === "next") currentPage++;
            if (interaction.customId === "prev") currentPage--;

            const maxPage = Math.ceil(card.printings.length / perPage);
            currentPage = Math.max(1, Math.min(currentPage, maxPage));

            await interaction.update({
                embeds: [generateEmbed(currentPage)],
                components: [row()],
                files: await getCardAttachments(card)
            });
        });

        collector.on("end", async () => {
            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...row().components.map(button => ButtonBuilder.from(button).setDisabled(true))
            );

            await sentMessage.edit({
                components: [disabledRow]
            });
        });

    }   

async function getCardAttachments(card: Card): Promise<AttachmentBuilder[]> {

    const attachments: AttachmentBuilder[] = [
        new AttachmentBuilder("./assets/thumbnail/scryfall.png", { name: "scryfall.png" })
    ];

    if (card.isTwoSided()) {
        attachments.push(await card.fetchMergedAttachment());
    }

    return attachments;
}

client.login(process.env.DISCORD_TOKEN);