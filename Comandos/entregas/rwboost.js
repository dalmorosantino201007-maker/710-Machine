const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "rwboost",
  description: "📦 | Recompensas por Boostear",

  run: async (client, interaction) => {
    // ID del rol requerido (limpiado de errores de sintaxis)
    const requiredRoleId = "1469967630365622403";

    // Verificar si el usuario tiene el rol
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    const botName = client.user.username;
    const botAvatar = client.user.displayAvatarURL({ dynamic: true });

    // MessageEmbed adaptado a v13
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tus boosts! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://media.discordapp.net/attachments/1387582521662771363/1411738364142420069/2184-heart-boost.png")
      .setFooter(botName, botAvatar) // v13 usa (texto, icono)
      .setDescription(
        `**•  __Producto__:** Reward Boost 🔮\n\n` +
        `**•  Link:** ||https://gofile.io/d/g0W8UD||\n\n` +
        `Déjanos por favor una reseña para poder seguir creciendo!`
      );

    // 1. Confirmación efímera para el staff
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Envío del producto al canal
    await interaction.channel.send({ embeds: [embed] });
  }
};