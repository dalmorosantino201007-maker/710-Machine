const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "nixware",
  description: "📦 | Entrega Nixware",
  options: [
    {
      name: "key",
      description: "Ingrese la/s key(s).",
      type: 3, // STRING en v13
      required: true,
    }
  ],

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
    const key = interaction.options.getString("key");

    // MessageEmbed adaptado a v13
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://media.discordapp.net/attachments/1294464739006480385/1336544441317724281/rage-1.png")
      .setFooter(botName, botAvatar) // v13 usa (texto, icono)
      .setDescription(
        `**•  __Producto__:** Nixware CS2 <:nixware:1411738983515553793>\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Website:** [Haz Click Aqui](https://nixware.cc/)\n\n` +
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