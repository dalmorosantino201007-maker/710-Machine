const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comandlist')
        .setDescription('Muestra la lista completa de comandos y sus permisos'),
    run: async (client, interaction) => {
        // Al igual que el anterior, la respuesta está programada en el index.js
    },
};