const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: "renvembed",
    description: "Reenvía el último embed del bot y borra el anterior",
    run: async (client, interaction) => {
        // La lógica ya la pusimos en el index.js por comodidad, 
        // pero este archivo es necesario para que el Handler lo registre.
    },
};