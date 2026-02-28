const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

// Esta ruta DEBE ser igual en ambos archivos para que lean el mismo JSON
const dbPath = path.resolve(__dirname, "../../DataBaseJson/staff.json");

module.exports = {
  name: "rankingstaff",
  description: "🏆 | Muestra el ranking de tickets del staff.",

  run: async (client, interaction) => {
    await interaction.deferReply();

    // 1. Leer la base de datos
    if (!fs.existsSync(dbPath)) {
      return interaction.editReply({ content: "❌ Aún no hay registros en el ranking." });
    }

    const staffData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    
    // 2. Convertir el objeto en una lista y filtrar los que tengan 0 tickets
    const rankingArray = Object.keys(staffData)
      .map(id => ({ id, ...staffData[id] }))
      .filter(staff => staff.tickets > 0)
      .sort((a, b) => b.tickets - a.tickets); // Ordenar de mayor a menor

    if (rankingArray.length === 0) {
      return interaction.editReply({ content: "📬 Aún no hay registros en el ranking." });
    }

    // 3. Crear el mensaje del ranking (Top 10)
    const top10 = rankingArray.slice(0, 10);
    let description = "";

    top10.forEach((staff, index) => {
      const medalla = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤";
      description += `${medalla} **#${index + 1}** | <@${staff.id}> - \`${staff.tickets}\` tickets\n`;
    });

    const embed = new Discord.MessageEmbed()
      .setTitle("🏆 Ranking de Staff - Tickets")
      .setDescription(description)
      .setColor("GOLD")
      .setFooter({ text: "710 - Machine System", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};