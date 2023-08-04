require('dotenv').config();
const chalk = require('chalk');
const fs = require('node:fs');
const { Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

const commands = [];
const commandFolders = fs.readdirSync('./commands');

console.log('Started refreshing application (/) commands.');
for (const folder of commandFolders) {
	if (folder.endsWith('.js')) {
        console.log(chalk.red(`File (${folder}) not in subdirectory, please move it. File has been ignored.`));
        return;
    }
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
		commands.push(command.data.toJSON());
        console.log(chalk.hex('#808080')('Registered command ') + chalk.hex('#3c850c')(`${file} - ${require(`./commands/${folder}/${file}`).data.name}`));
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();