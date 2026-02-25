const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearpanel')
        .setDescription('Muestra el panel para limpiar tus mensajes directos con el bot'),
    async run(client, interaction) {
        // La lógica ya la pusimos en tu index.js principal
    }
};