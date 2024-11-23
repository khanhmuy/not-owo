const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {v2} = require('osu-api-extended');
module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup various functions for the bot')
        .addSubcommand(command => command.setName('player')
            .setDescription('Set your osu! username.')
            .addStringOption(option => option.setName('username')
                .setDescription('Your osu! username.')
                .setRequired(true))),
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        if (interaction.options.getSubcommand() === 'player') {
            const username = interaction.options.getString('username');
            const data = await v2.search({type: 'site', mode: 'user', query: username});
            if (data.user.data[0] === undefined || data.user.data[0].username !== username) {
                await interaction.editReply({content: 'User not found.', ephemeral: true});
            } else {
                const dscId = interaction.user.id;
                const osuId = data.user.data[0].id;
                interaction.client.data.ensure(`user.${dscId}.osuId`, osuId);
                interaction.client.data.set(`user.${dscId}.osuId`, osuId);
                const embed = new EmbedBuilder()
                    .setTitle('Success!')
                    .setURL(`https://osu.ppy.sh/u/${osuId}`)
                    .setThumbnail(`${data.user.data[0].avatar_url}`)
                    .setColor('#a6e3a1')
                    .setDescription(`Your osu! username has been set to ${username}.`)
                    .setTimestamp()
                    .setFooter({text: 'You can change this at any time by running /setup player again.', iconURL: 'https://images-ext-1.discordapp.net/external/3OqZdghI9tf65Q2rzB0_gGR9bek8r8eVjzkJc77yFOw/https/i.imgur.com/Req9wGs.png'});
                await interaction.editReply({embeds: [embed], ephemeral: true});
            }
        }
    }
}