const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {tools, v2} = require('osu-api-extended');
const Vibrant = require('node-vibrant');
module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('Get map info from ID, URL or search')
        .addStringOption(option => option.setName('map').setDescription('Map ID or search query').setRequired(true))
        .addStringOption(option => option.setName('status')
            .setDescription('Status of the beatmap set to search for')
            .setRequired(false)
            .addChoices(
                {name: "Ranked", value: "ranked"},
                {name: "Qualified", value: "qualified"},
                {name: "Loved", value: "loved"},
                {name: "Favourites", value: "favourites"},
                {name: "Pending", value: "pending"},
                {name: "WIP", value: "wip"},
                {name: "Graveyard", value: "graveyard"},
            )
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const input = interaction.options.getString('map');
        let bm = '';
        let isnum = /^\d+$/.test(input);
        if (isnum === true) {
            bm = await v2.beatmap.set.details(input);
        } else {
            const inputStatus = interaction.options.getString('status');
            let response = '';
            if (inputStatus === null) {
                response = await v2.beatmaps.search({query: input, limit: 1, mode: 'osu', section: 'ranked'});
            } else {
                response = await v2.beatmaps.search({query: input, limit: 1, mode: 'osu', section: inputStatus});
            }
            if (response.beatmapsets[0] === undefined) return interaction.editReply({content: 'No maps found.', ephemeral: true});
            const id = response.beatmapsets[0].id;
            bm = await v2.beatmap.set.details(id);
        }
        function fmtMSS(s){return(s-(s%=60))/60+(9<s?':':':0')+s};
        const date = new Date(bm.submitted_date);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        let status = '';
        switch (bm.ranked){
            case -2:
                status = '🪦 Graveyard';
                break;
            case -1:
                status = '⚒️ WIP';
                break;
            case 0:
                status = '⏱️ Pending';
                break;
            case 1:
                status = '⬆️ Ranked';
                break;
            case 2:
                status = '✅ Approved';
                break;
            case 3:
                status = '☑️ Qualified';
                break;
            case 4:
                status = '💖 Loved';
                break;
        }
        let color = null;
        color = await Vibrant.from(bm.covers.cover).getPalette()
        color = color.Vibrant.hex;
        const sorted = bm.beatmaps.sort((a, b) => b.difficulty_rating - a.difficulty_rating);
        const top = await v2.scores.beatmap(bm.beatmaps[0].id, {mode: 'osu', type: 'global'});
        // what the fuck is this
        let mods = '';
        if (top[0].mods.length !== 0) {
            mods = '+'+top[0].mods.join('')+' - ';
        } else {
            mods = ''
        }
        let pp = '';
        try {
            pp = ' - '+top[0].pp.toFixed(2)+'pp';
        } catch {
            pp = ''
        }
        const embed = new EmbedBuilder()
            .setAuthor({name: `${bm.creator}`, iconURL: `${bm.user.avatar_url}`, url: `https://osu.ppy.sh/users/${bm.user.id}`})
            .setTitle(`${bm.artist} - ${bm.title}`)
            .setDescription(`**Length:** ${fmtMSS(bm.beatmaps[0].total_length)} | **BPM:** ${bm.bpm}`)
            .addFields(
                {
                    name: `**${bm.beatmaps[0].difficulty_rating}⭐ [${bm.beatmaps[0].version}]**`,
                    value: `**AR:** ${bm.beatmaps[0].ar} | **OD:** ${bm.beatmaps[0].accuracy} | **CS:** ${bm.beatmaps[0].cs} | **HP:** ${bm.beatmaps[0].drain}\n**Max Combo:** ${bm.beatmaps[0].max_combo}x | **Objects:** ${bm.beatmaps[0].count_circles} | **Sliders:** ${bm.beatmaps[0].count_sliders} | **Spinners:** ${bm.beatmaps[0].count_spinners}\n**#1:** ${top[0].user.username} (${mods}${(top[0].accuracy*100).toFixed(2)}%${pp}) | ${top[0].max_combo}x`
                }
            )
            .setColor(color)
            .setURL(`https://osu.ppy.sh/beatmapsets/${bm.id}`)
            .setImage(`${bm.covers.cover}`)
            .setFooter({text: `${status} | ❤️ ${bm.favourite_count} | Submitted ${dateStr}`})
        const lowerDiffs = sorted.slice(1, 3); 
        for await (const beatmap of lowerDiffs) {
            if (beatmap === bm.beatmaps[0]) return;
            if (beatmap.mode !== 'osu') return;
            const tops = await v2.scores.beatmap(beatmap.id, {mode: 'osu', type: 'global'});
            let mods = '';
            if (tops[0].mods.length !== 0) {
                mods = '+'+tops[0].mods.join('')+' - ';
            } else {
                mods = ''
            }
            let pp = '';
            try {
                pp = ' - '+tops[0].pp.toFixed(2)+'pp';
            } catch {
                pp = ''
            }
            const fields = {
                name: `**${beatmap.difficulty_rating}⭐ [${beatmap.version}]**`,
                value: `**AR:** ${beatmap.ar} | **OD:** ${beatmap.accuracy} | **CS:** ${beatmap.cs} | **HP:** ${beatmap.drain}\n**Max Combo:** ${beatmap.max_combo} | **Objects:** ${beatmap.count_circles} | **Sliders:** ${beatmap.count_sliders} | **Spinners:** ${beatmap.count_spinners}\n**#1:** ${tops[0].user.username} (${mods}${(tops[0].accuracy*100).toFixed(2)}%${pp}) | ${tops[0].max_combo}x`
            }
            embed.addFields(fields);
        };
        await interaction.editReply({embeds: [embed]});
    }
}