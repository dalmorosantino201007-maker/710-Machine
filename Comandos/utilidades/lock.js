const Discord = require("discord.js");

module.exports = {
  name: "lock",
  description: "🔒 | Bloquea el canal para ciertos roles.",

  run: async (client, interaction) => {
    // En v13 se usa el string "ADMINISTRATOR"
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    const canal = interaction.channel;
    const rolBloqueado = "1469619306886205574"; // ID del rol

    try {
      // Bloquear visibilidad para @everyone
      // En v13 los permisos van en MAYÚSCULAS
      await canal.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        VIEW_CHANNEL: false
      });

      // Bloquear mensajes y hilos para el rol específico
      await canal.permissionOverwrites.edit(rolBloqueado, {
        SEND_MESSAGES: false,
        CREATE_PUBLIC_THREADS: false,
        CREATE_PRIVATE_THREADS: false,
        SEND_MESSAGES_IN_THREADS: false
      });

      await interaction.reply({
        content: `✅ Canal bloqueado correctamente:\n- \`@everyone\` ya no puede ver este canal.\n- <@&${rolBloqueado}> no puede enviar mensajes ni gestionar hilos.`
      });
    } catch (error) {
      console.error("Error al ejecutar /lock:", error);
      await interaction.reply({
        content: "❌ Hubo un error al bloquear el canal.",
        ephemeral: true
      });
    }
  }
};