const fs = require('fs');

module.exports = {
    name: "rankingreset",
    description: "Resetea el ranking de Staff (Solo Admins)",
    run: async (client, interaction) => {
        // ID del rol que puede resetear (ajústalo si es necesario)
        const rolAdmin = "1469618981781373042"; 

        if (!interaction.member.roles.cache.has(rolAdmin)) {
            return interaction.reply({ content: "❌ No tienes permiso para hacer esto.", ephemeral: true });
        }

        const rankingPath = './DataBaseJson/ranking.json';
        fs.writeFileSync(rankingPath, JSON.stringify({}, null, 2));

        return interaction.reply({ content: "✅ El ranking ha sido reseteado a 0." });
    }
};