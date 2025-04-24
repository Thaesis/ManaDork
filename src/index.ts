import {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
    Embed,
    EmbedBuilder,
    ButtonInteraction,
    AttachmentBuilder
} from "discord.js"
import axios, { AxiosError } from "axios"
import * as dotenv from "dotenv"
import {Card} from "./Card"
import * as util from "./util"

dotenv.config();

const scryfallURL = `https://api.scryfall.com/`;
const moxfieldURL = `https://api.moxfield.com/json/decks/`;

// Bot Entrypoint
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

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

    if(message.content.startsWith("!deck")) {

        const args = message.content.slice("!deck".length).trim();
        

    }

    if(message.content.startsWith("!help")) {

        const helpEmbed = new EmbedBuilder()
        .setTitle("**ScryBot Help**")
        .setDescription("The following is a list of commands and how to use them!")
        .addFields(
            {
                name: "!card <card_name>",
                value: "Attempts to find a card on Scryfall that matches <card_name>; The name needs to be accurate enough to remove ambiguity among similar card names.\nExample: `!card Abrade`"
            },
            {
                name: "!card <card_name>[set_number, collector_number]",
                value: "Attemps to find the specific printing of <card_name> on Scryfall that matches [set_number, collector_number]\nExample: `!card swamp[ONE, 367]`"
            },
            {
                name: "!help",
                value: "Displays this help pannel."
            },
            {
                name:"The Following are flags to be added behind the above commands (besides !help).",
                value: "They will display specifically requested information regarding the card retrieved with `!card!`\nExample: `!card Sol Ring /legalities"
            },
            {
                name:"/legalities",
                value: "Displays only the legalitiy of <card> in all Magic: The Gathering Formats\nExample: `!card <card_name> /legalities` or `!card <card_name>[set_number, collector_number] /legalities`"
            },
            {
                name: "/rulings",
                value: "Displays only the 5 most recent offical rulings regarding <card>\nExample: `!card <card_name> /rulings` or `!card <card_name>[set_number, collector_number] /rulings`"
            },
            {
                name: "/sets",
                value: "Displays all Magic: The Gathering sets in which <card> appears.\nExample: `!card <card_name> /sets` or `!card <card_name>[set_number, collector_number] /sets`"
            },
        )
        .setFooter({ text: "End of !help"})
        .setColor(0x7c4c2e)
        .setThumbnail("attachment://scrybot.png");

        await message.channel.send({
            embeds: [helpEmbed],
            files: [{ attachment:"./assets/thumbnail/scrybot.png", name: "scrybot.png"}]
        });
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