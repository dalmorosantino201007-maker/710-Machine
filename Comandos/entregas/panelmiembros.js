const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "panelmiembros",
  description: "📦 | Entregar Panel Miembros",

  run: async (client, interaction) => {
    // ID del rol requerido (Limpiado para evitar errores de sintaxis)
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

    // MessageEmbed (Sintaxis v13)
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://cdn.discordapp.com/attachments/1357892619262361841/1370550788325113907/discord-logo-icon-editorial-free-vector.png")
      .setFooter(botName, botAvatar) // En v13: (texto, icono)
      .setDescription(
        `**•  __Producto__:** Panel Miembros\n\n` +
        `**•  Link:** ||https://members-hub.store/||\n\n` +
        `Déjanos por favor una reseña para poder seguir creciendo!`
      );

    // 1. Confirmación efímera para el staff
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Enviar embed públicamente al canal
    await interaction.channel.send({ embeds: [embed] });
  }
};