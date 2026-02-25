const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearpanel')
        .setDescription('Limpia los DMs'),
    async run(client, interaction) {
        // tu código...
    }
};