const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "sharkmenu",
  description: "📦 | Entrega Shark Menu",
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
    const requiredRoleId = "1475299082250489968";

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
      .setThumbnail("https://cdn.discordapp.com/attachments/1399443054535901235/1408192920254677022/image.png")
      .setFooter(botName, botAvatar) // v13 usa (texto, icono)
      .setDescription(
        `**•  __Producto__:** Shark Menu <:sharkmenu:1375470745622155314>\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Download:** ||https://cdn.sharksoftwares.com.br/download||\n` +
        `**•  Discord:** ||https://discord.gg/E3wxkxBpNH||\n\n` +
        `Déjanos por favor una para poder seguir creciendo!`
      );

    // 1. Confirmación efímera para el staff
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Envío del producto al canal público
    await interaction.channel.send({ embeds: [embed] });
  }
};