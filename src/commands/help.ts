import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    AttachmentBuilder,
    EmbedBuilder,
    MessageFlags
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
                        name: "{{ card_name }} or {{ card_name[SET, Collector#] }}",
                        value: "Attempts to find a card on Scryfall that matches <card_name>; The name needs to be accurate enough to remove ambiguity among similar card names. It can also be used to pull specific printings of a card.\nExample: `{{Abrade}}`\nExample:  Woah! Look at this `{{ swamp[ONE, 367] }}`"
                    },
                    {
                        name: "/help",
                        value: "Displays this help pannel."
                    },
                    {
                        name:"/legal <card_name> (optional)private: true/false",
                        value: "Displays only the legalitiy of <card_name> in all Magic: The Gathering Formats\nExample: `/legal Amber Mox`"
                    }, 
                    {
                        name: "/rulings <card_name> (optional)private: true/false",
                        value: "Displays only the 5 most recent offical rulings regarding <card_name>\nExample: `/rulings Derevi, Empyrial Tactician`"
                    },
                    {
                        name: "/sets",
                        value: "Displays all Magic: The Gathering sets in which <card_name> appears.\nExample: `/sets Sol Ring`"
                    },
                    {
                        name: "/keyword <keyword_name>",
                        value: "Displays the rules assocaited with a given keyword.\nExample: `/keyword Banding`"
                    }
                )
                .setFooter({ text: "End of /help"})
                .setColor(0x7c4c2e)
                .setThumbnail("attachment://scrybot.png");

            await interaction.reply({
                embeds: [helpEmbed],
                files: [{ attachment:"./assets/thumbnail/scrybot.png", name: "scrybot.png" }],
                flags: MessageFlags.Ephemeral
            });
}