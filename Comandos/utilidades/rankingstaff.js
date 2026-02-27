const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankingstaff')
        .setDescription('Muestra el top de staff con más tickets atendidos'),

    async execute(interaction) {
        // 1. Obtener todos los datos del servidor actual
        // (Dependiendo de tu DB, esto puede variar)
        const allData = await db.all(); 
        
        // 2. Filtrar solo los datos de tickets de este servidor
        const ranking = allData
            .filter(data => data.id.startsWith(`ticketsAtendidos_${interaction.guild.id}`))
            .map(data => {
                const userId = data.id.split('_')[2];
                return { id: userId, count: data.value };
            })
            .sort((a, b) => b.count - a.count) // Ordenar de mayor a menor
            .slice(0, 10); // Tomar el Top 10

        if (ranking.length === 0) {
            return interaction.reply('Aún no hay datos de tickets atendidos.');
        }

        // 3. Construir el mensaje
        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranking de Staff - Tickets Atendidos')
            .setColor('#5865F2')
            .setTimestamp();

        let description = "";
        ranking.forEach((staff, index) => {
            description += `**${index + 1}.** <@${staff.id}> — \`${staff.count}\` tickets\n`;
        });

        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
    }
};