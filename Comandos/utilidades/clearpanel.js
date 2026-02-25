const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearpanel')
        .setDescription('Muestra el panel para limpiar tus mensajes directos con el bot'),
    run: async (client, interaction) => {
        // La lógica real la manejamos en el index.js con el interactionCreate
        // pero el comando debe estar registrado aquí para que aparezca en Discord.
    },
};