import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder,
} from "discord.js"
import { fetchCard } from "../util/fetchCard";
import { buildCardAttachments } from "../util/CardUtil";
import keywordData from '../../assets/keywords/all_keywords_full.json';

export const data = new SlashCommandBuilder()
    .setName('keyword')
    .setDescription("Displays the rules associated with a given Magic: the Gathering keyword.")
    .addStringOption(option =>
        option.setName(`name`)
            .setDescription(`Name of the keyword`)
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName(`private`)
            .setDescription('display privately?')
            .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {

    const keywordInput = interaction.options.getString('name', true).toLowerCase();
    const displayPrivately = interaction.options.getBoolean('private') ?? false;
    
    const formatKeyword = interaction.options.getString('name', true);
    const titleCasedKeyword = formatKeyword
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    const match = keywordData.find(entry => entry.keyword === keywordInput);

    let descrption: string;

    if(match) {
        descrption = `**${match.description}**`
    } else {
        descrption = `:x: No Keyword Associated with "${titleCasedKeyword}"`
    }

    const cardEmbed = new EmbedBuilder()
                        .setTitle(titleCasedKeyword)
                        .setThumbnail("attachment://scryfall.png")
                        .setDescription(descrption)
                        .setColor(0xb08ee8)
                        .setFooter({ text: "All information is provided by Scryfall."})
                        
    const files = await buildCardAttachments();
    const flags = displayPrivately ? MessageFlags.Ephemeral : undefined;

    await interaction.reply({
        embeds: [cardEmbed], 
        files: files,
        flags: flags
    });
}