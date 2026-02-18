const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "setimagen",
  description: "🖼️ | Cambia el avatar del bot a una imagen animada",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "imagen",
      description: "Selecciona la imagen (GIF preferentemente)",
      type: Discord.ApplicationCommandOptionType.Attachment,
      required: true
    }
  ],

  run: async (client, interaction) => {
    // ID del rol requerido
    const requiredRoleId = "1333382225085075500";

    // Verificar si el usuario tiene el rol necesario
    const member = interaction.member;
    if (!member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({
        content: "<:crosshost2:1384349772386664550> | No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    const imagen = interaction.options.getAttachment("imagen");

    // Verificar tipo de archivo (opcional)
    if (!imagen.contentType.startsWith("image/")) {
      return interaction.reply({
        content: "❌ | El archivo proporcionado no es una imagen válida.",
        ephemeral: true
      });
    }

    try {
      await client.user.setAvatar(imagen.url);

      const embed = new Discord.EmbedBuilder()
        .setColor(`${config.colorpredeterminado}`)
        .setTitle("✅ | Avatar actualizado")
        .setDescription("La imagen del bot ha sido actualizada correctamente.")
        .setImage(imagen.url)
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

      interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "❌ | Ocurrió un error al cambiar el avatar. Asegúrate de que el archivo sea un `.gif` válido y que el bot tenga permisos.",
        ephemeral: true
      });
    }
  }
}
