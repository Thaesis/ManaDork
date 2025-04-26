import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
} from "discord.js"
import { fetchCard } from "../util/fetchCard";
import { buildCardAttachments, fetchCardPrintings } from "../util/CardUtil";

export const data = new SlashCommandBuilder()
    .setName('sets')
    .setDescription("Displays the sets in which a given card is included in Magic: the Gathering.")
    .addStringOption(option =>
        option.setName(`name`)
            .setDescription(`Name of the card`)
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName(`private`)
            .setDescription('display privately?')
            .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {

    const name = interaction.options.getString('name', true);
    const displayPrivately = interaction.options.getBoolean('private') ?? false;

    const card = await fetchCard(name);
    
    const sets = await fetchCardPrintings(card.printsSearchUri);

    const setEmbed = new EmbedBuilder()
        .setTitle(card.name)
        .setURL(card.link)
        .setImage(card.fetchImage())
        .setThumbnail("attachment://scryfall.png")
        .setDescription(sets.join('\n'))
        .setColor(0xb08ee8)
        .setFooter({ text: "All information is provided by Scryfall."})

    const files = await buildCardAttachments(card);
    const flags = displayPrivately ? MessageFlags.Ephemeral : undefined;

    await interaction.reply({
        embeds: [setEmbed],
        files: files,
        flags: flags
    });

}
