const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

// Esta ruta DEBE ser igual en ambos archivos para que lean el mismo JSON
const dbPath = path.resolve(__dirname, "../../DataBaseJson/staff.json");

module.exports = {
  name: "rankingstaff",
  description: "🏆 | Muestra el ranking de tickets del staff.",

  run: async (client, interaction) => {
    // 1. Iniciar la respuesta diferida (Slash Command)
    await interaction.deferReply();

    try {
      // 2. Verificar si el archivo existe físicamente en el servidor
      if (!fs.existsSync(dbPath)) {
        console.log("⚠️ ERROR: El archivo staff.json no existe en la ruta:", dbPath);
        return interaction.editReply({ content: "❌ No se encontró la base de datos de tickets." });
      }

      // 3. Forzar lectura fresca del archivo (sin caché)
      const rawData = fs.readFileSync(dbPath, "utf8");
      const staffData = JSON.parse(rawData);
      
      console.log("✅ Datos leídos del JSON:", staffData);

      // 4. Convertir el objeto en una lista y filtrar
      const rankingArray = Object.keys(staffData)
        .map(id => ({ id, ...staffData[id] }))
        .filter(staff => staff.tickets > 0)
        .sort((a, b) => b.tickets - a.tickets); // Ordenar de mayor a menor

      // 5. Si no hay tickets registrados
      if (rankingArray.length === 0) {
        return interaction.editReply({ 
          content: "📬 Aún no hay registros en el ranking o los tickets están en 0." 
        });
      }

      // 6. Crear el mensaje del ranking (Top 10)
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

    } catch (error) {
      console.error("❌ Error al procesar rankingstaff:", error);
      await interaction.editReply({ content: "❌ Hubo un error al leer el ranking." });
    }
  },
};