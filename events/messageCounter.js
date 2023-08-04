module.exports = {
	name:'messageCreate',
	execute(interaction) {
		if (!interaction.client.data.get('msgCounterTotal')) interaction.client.data.set('msgCounterTotal', 0);
		try {
			interaction.client.data.set('msgCounterTotal', parseInt(interaction.client.data.get('msgCounterTotal')) + 1);
		} catch (err) {
			console.log('Can no longer store message counter!');
		}
	},
};