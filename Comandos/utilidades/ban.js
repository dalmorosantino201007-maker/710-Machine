const Discord = require("discord.js");

module.exports = {
  name: "ban",
  description: "🚫 | Banea a un usuario del servidor.",
  options: [
    {
      name: "usuario",
      description: "Usuario que quieres banear",
      type: 6, // USER en v13
      required: true
    },
    {
      name: "motivo",
      description: "Motivo del baneo",
      type: 3, // STRING en v13
      required: false
    },
    {
      name: "evidencia",
      description: "Link o descripción de la evidencia",
      type: 3, // STRING en v13
      required: false
    }
  ],

  run: async (client, interaction) => {
    const rolPermitido = "1469968983494099160"; 
    const canalLogsID = "1471003008622919896"; 

    if (!interaction.member.roles.cache.has(rolPermitido)) {
      return interaction.reply({
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser("usuario");
    const miembro = interaction.guild.members.cache.get(usuario.id);
    const motivo = interaction.options.getString("motivo") || "No especificado.";
    const evidencia = interaction.options.getString("evidencia") || "No proporcionada.";

    if (!miembro) {
      return interaction.reply({
        content: "❌ No se pudo encontrar al usuario en el servidor.",
        ephemeral: true
      });
    }

    if (!miembro.bannable) {
      return interaction.reply({
        content: "❌ No puedo banear a ese usuario (puede que tenga un rol más alto o permisos especiales).",
        ephemeral: true
      });
    }

    try {
      // Enviar DM al usuario baneado antes de ejecutar el ban
      await usuario.send(`Has sido baneado del servidor **${interaction.guild.name}**.\n**Motivo:** ${motivo}`).catch(() => {
          console.log(`No se le pudo enviar el DM a ${usuario.tag}`);
      });

      // Ejecutar el baneo
      await miembro.ban({ reason: motivo });

      // Embed de confirmación (v13)
      const embedConfirmacion = new Discord.MessageEmbed()
        .setTitle("✅ Usuario baneado exitosamente")
        .setColor("GREEN")
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 Usuario", value: `${usuario.tag} (${usuario.id})`, inline: false },
          { name: "🛠️ Moderador", value: `${interaction.user.tag}`, inline: false },
          { name: "📄 Motivo", value: motivo, inline: false },
          { name: "📎 Evidencia", value: evidencia, inline: false }
        )
        .setFooter(client.user.username, client.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await interaction.reply({ embeds: [embedConfirmacion] });

      // Embed de logs (v13)
      const embedLog = new Discord.MessageEmbed()
        .setTitle("🚫 Usuario Baneado")
        .setColor("RED")
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 Usuario", value: `${usuario.tag} (${usuario.id})`, inline: true },
          { name: "🛠️ Moderador", value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: "📄 Motivo", value: motivo, inline: false },
          { name: "📎 Evidencia", value: evidencia, inline: false }
        )
        .setFooter("Log de moderación | Baneo ejecutado")
        .setTimestamp();

      const canalLogs = interaction.guild.channels.cache.get(canalLogsID);
      if (canalLogs && canalLogs.type === "GUILD_TEXT") {
        await canalLogs.send({ embeds: [embedLog] });
      }

    } catch (error) {
      console.error("Error al banear:", error);
      return interaction.reply({
        content: "❌ Ocurrió un error al intentar banear al usuario.",
        ephemeral: true
      });
    }
  }
};