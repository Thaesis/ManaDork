import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    AttachmentBuilder,
    EmbedBuilder
} from "discord.js"

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays help information to the user requesting');

export async function execute(interaction: ChatInputCommandInteraction) {

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
    
            await interaction.reply({
                embeds: [helpEmbed],
                files: [{ attachment:"./assets/thumbnail/scrybot.png", name: "scrybot.png" }],
                ephemeral: true
            });
}