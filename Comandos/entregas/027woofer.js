const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "027woofer",
  description: "📦 | Entrega 027 Woofer",
  options: [
    {
      name: "key",
      description: "Ingrese la/s key(s).",
      type: 3, // STRING en v13
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // ID del rol requerido (Limpiado para evitar errores)
    const requiredRoleId = "1475299082250489968";

    // Verificar permisos
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    const botName = client.user.username;
    const botAvatar = client.user.displayAvatarURL({ dynamic: true });
    const key = interaction.options.getString("key");

    // MessageEmbed (Sintaxis v13)
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://media.discordapp.net/attachments/1359569148614541532/1382624268830900285/image.png")
      .setFooter(botName, botAvatar) // En v13: (texto, icono)
      .setDescription(
        `**•  __Producto__:** 027 Woofer\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Download:** ||||\n\n` +
        `Déjanos por favor una reseña para poder seguir creciendo! `
      );

    // 1. Confirmación efímera para el staff
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Envío público del producto al canal
    await interaction.channel.send({ embeds: [embed] });
  }
};