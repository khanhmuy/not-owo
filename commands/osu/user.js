const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {v2} = require('osu-api-extended');
module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Get a user\'s details.')
        .addStringOption(option => option.setName('user')
            .setDescription('The user to get the detail of.')
            .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getString('user');
        if (user === undefined || user === null) {
            const osuId = interaction.client.data.get(`user.${interaction.user.id}.osuId`);
            if (osuId === null) return interaction.editReply({content: 'You must provide a user.', ephemeral: true});
            const res = await v2.user.details(osuId);
            const embed = new EmbedBuilder()
                .setTitle(`${res.username}'s profile for osu!std`)
                .setURL(`https://osu.ppy.sh/users/${res.id}`)
                .setThumbnail(`${res.avatar_url}`)
                .setColor('#f5c2e7')
                .addFields(
                    {name: 'Rank', value: `#${res.statistics.global_rank} (:flag_${res.country_code.toLowerCase()}:#${res.statistics.country_rank})`, inline: true},
                    {name: 'Peak Rank', value: `#${res.rank_highest.rank}`, inline: true},
                    {name: 'Level', value: `${res.statistics.level.current} (+${res.statistics.level.progress}%)`, inline: true},
                    {name: 'PP', value: `${res.statistics.pp}pp`, inline: true},
                    {name: 'Accuracy', value: `${res.statistics.hit_accuracy.toFixed(2)}%`, inline: true},
                    {name: 'Total Score', value: `${res.statistics.total_score}`, inline: true},
                    {name: 'Ranked Score', value: `${res.statistics.ranked_score}`, inline: true},
                    {name: 'Play Count', value: `${res.statistics.play_count}`, inline: true},
                    {name: 'Ranks', value: `X: ${res.statistics.grade_counts.ss} | XH: ${res.statistics.grade_counts.ssh}\nS: ${res.statistics.grade_counts.s} | SH: ${res.statistics.grade_counts.sh}\nA: ${res.statistics.grade_counts.a}`, inline: true},
                )
            await interaction.editReply({embeds: [embed]});
        } else {
            const search = await v2.site.search({mode: 'user', query: user});
            if (search.user.data[0] === undefined || search.user.data[0].username !== user) {
                await interaction.editReply({content: 'User not found.', ephemeral: true});
            } else if(search.user.data[0].username) {
                const res = await v2.user.details(search.user.data[0].id);
                const embed = new EmbedBuilder()
                    .setTitle(`${res.username}'s profile for osu!std`)
                    .setURL(`https://osu.ppy.sh/users/${res.id}`)
                    .setThumbnail(`${res.avatar_url}`)
                    .setColor('#f5c2e7')
                    .addFields(
                        {name: 'Rank', value: `#${res.statistics.global_rank} ( :flag_${res.country_code.toLowerCase()}:#${res.statistics.country_rank} )`, inline: true},
                        {name: 'Peak Rank', value: `#${res.rank_highest.rank}`, inline: true},
                        {name: 'Level', value: `${res.statistics.level.current} + (${res.statistics.level.progress}%)`, inline: true},
                        {name: 'PP', value: `${res.statistics.pp}pp`, inline: true},
                        {name: 'Accuracy', value: `${res.statistics.hit_accuracy.toFixed(2)}%`, inline: true},
                        {name: 'Total Score', value: `${res.statistics.total_score}`, inline: true},
                        {name: 'Ranked Score', value: `${res.statistics.ranked_score}`, inline: true},
                        {name: 'Play Count', value: `${res.statistics.play_count}`, inline: true},
                        {name: 'Ranks', value: `X: ${res.statistics.grade_counts.ss} | XH: ${res.statistics.grade_counts.ssh}\nS: ${res.statistics.grade_counts.s} | SH: ${res.statistics.grade_counts.sh}\nA: ${res.statistics.grade_counts.a}`, inline: true},
                    )
                await interaction.editReply({embeds: [embed]});
            }
        }
    }
}
