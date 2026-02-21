const Discord = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "aislar",
  description: "🚫 | Aísla temporalmente a un usuario (Timeout).",
  options: [
    {
      name: "usuario",
      description: "Usuario que quieres aislar",
      type: 6, // USER
      required: true
    },
    {
      name: "duracion",
      description: "Duración del aislamiento (ej: 10m, 1h, 1d)",
      type: 3, // STRING
      required: true
    },
    {
      name: "motivo",
      description: "Motivo del aislamiento",
      type: 3, // STRING
      required: false
    },
    {
      name: "evidencia",
      description: "Link o descripción de la evidencia",
      type: 3, // STRING
      required: false
    }
  ],

  run: async (client, interaction) => {
    const rolPermitido = "1469968983494099160"; 
    const canalLogsID = "1471003008622919896"; 

    if (!interaction.member.roles.cache.has(rolPermitido)) {
      return interaction.reply({
        content: "❌ No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser("usuario");
    const miembro = interaction.guild.members.cache.get(usuario.id);
    const duracionTexto = interaction.options.getString("duracion");
    const duracionMs = ms(duracionTexto);
    const motivo = interaction.options.getString("motivo") || "No especificado.";
    const evidencia = interaction.options.getString("evidencia") || "No proporcionada.";

    if (!miembro) {
      return interaction.reply({
        content: "❌ No se pudo encontrar al usuario en el servidor.",
        ephemeral: true
      });
    }

    // Validar duración (Max 28 días por limitación de Discord)
    if (!duracionMs || duracionMs < 1000 || duracionMs > ms("28d")) {
      return interaction.reply({
        content: "⏱️ Ingresa una duración válida entre 1s y 28d. Ej: `10m`, `2h`, `1d`.",
        ephemeral: true
      });
    }

    // En v13 se verifica si tiene el timestamp activo
    if (miembro.communicationDisabledUntilTimestamp > Date.now()) {
      return interaction.reply({
        content: "⚠️ Ese usuario ya está aislado.",
        ephemeral: true
      });
    }

    try {
      // Intentar enviar DM
      await usuario.send(`🚫 Has sido aislado en **${interaction.guild.name}** por **${ms(duracionMs, { long: true })}**.\n**Motivo:** ${motivo}`).catch(() => {});

      // Aplicar Timeout en v13
      await miembro.timeout(duracionMs, motivo);

      // Embed de confirmación (v13)
      const embedConfirmacion = new Discord.MessageEmbed()
        .setTitle("⏳ Usuario aislado temporalmente")
        .setColor("ORANGE")
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 Usuario", value: `${usuario.tag} (${usuario.id})`, inline: false },
          { name: "🕒 Duración", value: ms(duracionMs, { long: true }), inline: false },
          { name: "🛠️ Moderador", value: `${interaction.user.tag}`, inline: false },
          { name: "📄 Motivo", value: motivo, inline: false },
          { name: "📎 Evidencia", value: evidencia, inline: false }
        )
        .setFooter(client.user.username, client.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      if (evidencia.startsWith("http") && /\.(png|jpe?g|gif|webp)$/.test(evidencia)) {
        embedConfirmacion.setImage(evidencia);
      }

      await interaction.reply({ embeds: [embedConfirmacion] });

      // Log Embed
      const canalLogs = interaction.guild.channels.cache.get(canalLogsID);
      if (canalLogs && canalLogs.type === "GUILD_TEXT") {
        const embedLog = new Discord.MessageEmbed()
          .setTitle("🚫 Usuario Aislado (Timeout)")
          .setColor("RED")
          .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "👤 Usuario", value: `${usuario.tag} (${usuario.id})`, inline: true },
            { name: "🕒 Duración", value: ms(duracionMs, { long: true }), inline: true },
            { name: "🛠️ Moderador", value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
            { name: "📄 Motivo", value: motivo, inline: false },
            { name: "📎 Evidencia", value: evidencia, inline: false }
          )
          .setFooter("Log de moderación | Aislamiento temporal")
          .setTimestamp();

        if (evidencia.startsWith("http") && /\.(png|jpe?g|gif|webp)$/.test(evidencia)) {
          embedLog.setImage(evidencia);
        }

        await canalLogs.send({ embeds: [embedLog] });
      }

    } catch (error) {
      console.error("Error al aislar:", error);
      return interaction.reply({
        content: "❌ Ocurrió un error al intentar aislar al usuario. Asegúrate de que mi rol esté por encima del suyo.",
        ephemeral: true
      });
    }
  }
};