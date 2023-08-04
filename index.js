//Import node modules
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');
require('dotenv').config();
const Enmap = require('enmap');

const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));
async function error(err) {
	console.log(chalk.redBright(err));
	await sleep(200);
	process.exit(0);
}

//Establish the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [
		Partials.Channel
	]
});

//Establish the data collection
client.commands = new Collection();
client.data = new Enmap({
	name: 'data',
	fetchAll: false,
	autoFetch: true,
	cloneLevel: 'deep',
});

//Define command folders
const commandFolders = fs.readdirSync('./commands');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

//Import events and commands
console.log('// ╔════ Events ════╗ \\')
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(chalk.hex('#808080')('Loaded event ') + chalk.hex('#a6e3a1')(`${file} - ${require(`./events/${file}`).name} event`));
}

console.log('// ╔════ Commands ════╗ \\')
for (const folder of commandFolders) {
    if (folder.endsWith('.js')) {
        console.log(chalk.red(`File (${folder}) not in subdirectory, please move it. File has been ignored.`));
        continue;
    }
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        console.log(chalk.hex('#808080')('Loaded command ') + chalk.hex('#a6e3a1')(`${file} - ${require(`./commands/${folder}/${file}`).data.name}`));
    }
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	const member = interaction.member;

	//Command counter
	if (!interaction.client.data.get('cmdCounterTotal')) interaction.client.data.set('cmdCounterTotal', 0);
	try {
		interaction.client.data.set('cmdCounterTotal', parseInt(interaction.client.data.get('cmdCounterTotal')) + 1);
	} catch (err) {
		console.log('Can no longer store command count!');
	}

	//Check if command is guild only
	if (command.guildOnly === true && interaction.guild === null) {
		return message.reply({content: 'That command is guild only!', allowedMentions: { repliedUser: false }});
	}

	//Permissions system
	if (member.permissions.has(command.permissions) === false) {
		return interaction.reply({content: 'You do not have the required permissions to use this command!', ephemeral: true});
	}

	//Execute the command
	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.log(error);
		const embed = new EmbedBuilder()
			.setTitle('Error')
			.setDescription(`${error}`)
			.setThumbnail('https://images-ext-1.discordapp.net/external/9yiAQ7ZAI3Rw8ai2p1uGMsaBIQ1roOA4K-ZrGbd0P_8/https/cdn1.iconfinder.com/data/icons/web-essentials-circle-style/48/delete-512.png?width=461&height=461')
			.setColor('#f38ba8')
			.setTimestamp();
		try {
			await interaction.reply({ embeds: [embed], ephemeral: true });
		} catch(err) {
			try {
				await interaction.editReply({ embeds: [embed] });
			} catch(err) {
				console.log(err);
			}
		}
	}
});
client.login(client.token);

// Global env for osu! API
//global.osuAPI = process.env.OSU_CLIENT_ID;
//global.osuSecret = process.env.OSU_CLIENT_SECRET;
const {auth, v2} = require('osu-api-extended');
const login = async () => {
	//await auth.login(global.osuAPI, global.osuSecret);
	await auth.login_lazer('hmuy', 'Khanhhuy123');
	//const data = await v2.beatmap.id.details(1256136)
	//console.log(data);
}
login();