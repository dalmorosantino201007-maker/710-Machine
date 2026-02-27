const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: "rankingstaff",
    description: "Muestra el top de Staff con más tickets asumidos",
    run: async (client, interaction) => {
        const rankingPath = './DataBaseJson/ranking.json';
        if (!fs.existsSync(rankingPath)) return interaction.reply({ content: "📭 No hay datos registrados.", ephemeral: true });

        const ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
        const sorted = Object.entries(ranking)
            .sort(([, a], [, b]) => b.tickets - a.tickets)
            .slice(0, 10);

        if (sorted.length === 0) return interaction.reply({ content: "📭 Ranking vacío.", ephemeral: true });

        const description = sorted.map(([id, data], index) => {
            return `**${index + 1}.** <@${id}> — \`${data.tickets}\` tickets`;
        }).join('\n');

        const embed = new MessageEmbed()
            .setTitle("🏆 Ranking de Staff")
            .setColor("GOLD")
            .setDescription(description)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};