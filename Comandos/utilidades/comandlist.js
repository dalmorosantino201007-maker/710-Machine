const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    // La propiedad 'data' es lo que el bot envía a Discord
    data: new SlashCommandBuilder()
        .setName('comandlist') // Asegúrate que esté todo en minúsculas y sin espacios
        .setDescription('Muestra la lista completa de comandos y sus permisos'),
    
    // La función 'run' debe estar presente aunque la lógica principal esté en el index.js
    async run(client, interaction) {
        // Esto sirve como respaldo si el handler intenta ejecutarlo desde aquí
        return; 
    },
};