import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder,
} from "discord.js"
import { buildCardAttachments } from "../util/CardUtil";
import keywordData from '../../assets/keywords/all_keywords_full.json';
import Fuse from "fuse.js"

interface KeyworkEntry {
    keyword: string;
    description: string;
}

const fuse = new Fuse<KeyworkEntry>(keywordData as KeyworkEntry[], {
    keys: ['keyword'],
    threshold: 0.3
});

export const data = new SlashCommandBuilder()
    .setName('keyword')
    .setDescription("Displays the mechanics associated with a given Magic: the Gathering keyword.")
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
    

    const results = fuse.search(titleCasedKeyword);
    const match = results.length > 0 ? results[0].item : null;

    let descrption: string;

    if(match) {
        descrption = `**${match.description}**`
    } else {
        descrption = `:x: No Keyword Associated with "${titleCasedKeyword}"`
    }

    const cardEmbed = new EmbedBuilder()
                        .setTitle(match ? match.keyword : titleCasedKeyword)
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