const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

// Esta ruta sube dos niveles (../../) para entrar en DataBaseJson
const dbPath = path.resolve(__dirname, "../../DataBaseJson/staff.json");

module.exports = {
  name: "addtickets",
  description: "🎟️ | Añade tickets a un miembro del staff.",
  options: [
    { name: "usuario", description: "Staff al que sumas tickets.", type: "USER", required: true },
    { name: "cantidad", description: "Cantidad a sumar.", type: "INTEGER", required: true },
  ],

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    // Verificar Rol de Staff (el mismo que usas para /close)
    const ID_ROL_STAFF = "1469967630365622403";
    if (!interaction.member.roles.cache.has(ID_ROL_STAFF) && !interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.editReply({ content: "❌ No tienes permiso para usar este comando." });
    }

    const targetUser = interaction.options.getUser("usuario");
    const cantidad = interaction.options.getInteger("cantidad");

    try {
      // 1. Leer el archivo (si no existe, crear objeto vacío)
      let staffData = {};
      if (fs.existsSync(dbPath)) {
        const rawData = fs.readFileSync(dbPath, "utf8");
        staffData = rawData ? JSON.parse(rawData) : {};
      }

      // 2. Inicializar y sumar
      if (!staffData[targetUser.id]) {
        staffData[targetUser.id] = { name: targetUser.username, tickets: 0 };
      }
      staffData[targetUser.id].tickets += cantidad;

      // 3. Guardar cambios
      fs.writeFileSync(dbPath, JSON.stringify(staffData, null, 2));

      const embed = new Discord.MessageEmbed()
        .setTitle("🎟️ Tickets Actualizados")
        .setDescription(`Se añadieron **${cantidad}** tickets a ${targetUser}.`)
        .addField("Total actual:", `**${staffData[targetUser.id].tickets}** tickets`)
        .setColor("GOLD");

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error en addtickets:", error);
      await interaction.editReply({ content: "❌ Error al escribir en la base de datos." });
    }
  },
};