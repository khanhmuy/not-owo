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
        let isnum = /^[0-9][A-Za-z0-9 -]*$/.test(input);
        if (isnum === true) {
            bm = await v2.beatmaps.details({type: 'set', id: input});
        } else {
            const inputStatus = interaction.options.getString('status');
            let response = '';
            if (inputStatus === null) {
                response = await v2.search({type: 'beatmaps', query: input, limit: 1, mode: 'osu', status: 'ranked'});
            } else {
                response = await v2.search({type: 'beatmaps', query: input, limit: 1, mode: 'osu', status: inputStatus});
            }
            if (response.beatmapsets[0] === undefined) return interaction.editReply({content: 'No maps found.', ephemeral: true});
            const id = response.beatmapsets[0].id;
            bm = await v2.beatmaps.details({type: 'set', id: id});
        }
        function fmtMSS(s){return(s-(s%=60))/60+(9<s?':':':0')+s};
        const date = new Date(bm.submitted_date);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        let status, lbState = '';
        switch (bm.ranked){
            case -2:
                status = '🪦 Graveyard';
                lbState = 0
                break;
            case -1:
                status = '⚒️ WIP';
                lbState = 0;
                break;
            case 0:
                status = '⏱️ Pending';
                lbState = 0;
                break;
            case 1:
                status = '⬆️ Ranked';
                lbState = 1;
                break;
            case 2:
                status = '✅ Approved';
                lbState = 1;
                break;
            case 3:
                status = '☑️ Qualified';
                lbState = 1;
                break;
            case 4:
                status = '💖 Loved';
                lbState = 1;
                break;
        }
        let color = null;
        color = await Vibrant.from(bm.covers.cover).getPalette()
        color = color.Vibrant.hex;
        const sorted = bm.beatmaps.sort((a, b) => b.difficulty_rating - a.difficulty_rating);

        // what the fuck is this
        let mods, pp, top, numberOne = '';
        top = await v2.scores.list({type: 'leaderboard', beatmap_id: bm.beatmaps[0].id, mode: 'osu'});
        if (lbState == 1) {
            if (top[0].mods.length !== 0) {
                mods = `+`
                top[0].mods.forEach(mod => {
                    mods = mods.concat(mod.acronym);
                })
            } else {
                mods = ''
            }
            try {
                pp = ' - '+top[0].pp.toFixed(2)+'pp';
            } catch {
                pp = ''
            }
        } else if (lbState == 0) {
            mods, pp = '';
        }
        let okCount = top[0].statistics.ok || 0;
        let mehCount = top[0].statistics.meh || 0;
        let missCount = top[0].statistics.miss || 0;
        try {
            numberOne = `\n**#1:** ${top[0].user.username} (${mods}) | ${(top[0].accuracy*100).toFixed(2)}%${pp} | ${top[0].max_combo}x | ${okCount}/${mehCount}/${missCount}`
        } catch (err) {
            numberOne = ``
        }
        
        const embed = new EmbedBuilder()
            .setAuthor({name: `${bm.creator}`, iconURL: `${bm.user.avatar_url}`, url: `https://osu.ppy.sh/users/${bm.user.id}`})
            .setTitle(`${bm.artist} - ${bm.title}`)
            .setDescription(`**Length:** ${fmtMSS(bm.beatmaps[0].total_length)} | **BPM:** ${bm.bpm}`)
            .addFields(
                {
                    name: `**${bm.beatmaps[0].difficulty_rating}⭐ [${bm.beatmaps[0].version}]**`,
                    value: `**AR:** ${bm.beatmaps[0].ar} | **OD:** ${bm.beatmaps[0].accuracy} | **CS:** ${bm.beatmaps[0].cs} | **HP:** ${bm.beatmaps[0].drain}\n**Max Combo:** ${bm.beatmaps[0].max_combo}x | **Objects:** ${bm.beatmaps[0].count_circles} | **Sliders:** ${bm.beatmaps[0].count_sliders} | **Spinners:** ${bm.beatmaps[0].count_spinners}${numberOne}`
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
            const tops = await v2.scores.list({type: 'leaderboard', beatmap_id: beatmap.id, mode: 'osu'});
            let mods, pp, top, numberOne = '';
            if (lbState == 1) {
                if (tops[0].mods.length !== 0) {
                    mods = `+`
                    tops[0].mods.forEach(mod => {
                        mods = mods.concat(mod.acronym);
                    })
                } else {
                    mods = ''
                }
                pp = '';
                try {
                    pp = ' - '+tops[0].pp.toFixed(2)+'pp';
                } catch {
                    pp = ''
                }
            } else if (lbState == 0) {
                mods, pp = '';
            }
            let okCount = tops[0].statistics.ok || 0;
            let mehCount = tops[0].statistics.meh || 0;
            let missCount = tops[0].statistics.miss || 0;
            try {
                numberOne = `\n**#1:** ${tops[0].user.username} (${mods}) | ${(tops[0].accuracy*100).toFixed(2)}%${pp} | ${tops[0].max_combo}x |  | ${okCount}/${mehCount}/${missCount}`
            } catch (err) {
                numberOne = ``
            }
            const fields = {
                name: `**${beatmap.difficulty_rating}⭐ [${beatmap.version}]**`,
                value: `**AR:** ${beatmap.ar} | **OD:** ${beatmap.accuracy} | **CS:** ${beatmap.cs} | **HP:** ${beatmap.drain}\n**Max Combo:** ${beatmap.max_combo} | **Objects:** ${beatmap.count_circles} | **Sliders:** ${beatmap.count_sliders} | **Spinners:** ${beatmap.count_spinners}${numberOne}`
            }
            embed.addFields(fields);
        };
        await interaction.editReply({embeds: [embed]});
    }
}