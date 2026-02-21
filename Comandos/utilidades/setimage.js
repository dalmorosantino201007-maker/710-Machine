const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "setimagen",
  description: "🖼️ | Cambia el avatar del bot a una imagen animada",
  options: [
    {
      name: "imagen",
      description: "Selecciona la imagen (GIF preferentemente)",
      type: 11, // En v13, 11 corresponde a ATTACHMENT
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

    // Verificar tipo de archivo
    if (!imagen.contentType.startsWith("image/")) {
      return interaction.reply({
        content: "❌ | El archivo proporcionado no es una imagen válida.",
        ephemeral: true
      });
    }

    try {
      await client.user.setAvatar(imagen.url);

      // Cambiado a MessageEmbed (v13)
      const embed = new Discord.MessageEmbed()
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
        content: "❌ | Ocurrió un error al cambiar el avatar. Recuerda que Discord tiene un límite de tiempo entre cambios de avatar.",
        ephemeral: true
      });
    }
  }
}