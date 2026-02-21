const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "nordvpn",
  description: "📦 | Entrega Nord Vpn",
  options: [
    {
      name: "account",
      description: "Ingrese la/s account(s).",
      type: 3, // STRING en v13
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // ID del rol de ventas (limpiado de errores)
    const requiredRoleId = "1469968666425823274";

    // Verificar si el usuario tiene el rol requerido
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    const botName = client.user.username;
    const botAvatar = client.user.displayAvatarURL({ dynamic: true });
    const account = interaction.options.getString("account");

    // MessageEmbed adaptado a v13
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      // Si quieres añadir el thumbnail de NordVPN puedes usar .setThumbnail("URL_AQUÍ")
      .setFooter(botName, botAvatar) // Formato v13: (texto, icono)
      .setDescription(
        `**•  __Producto__:** Nord Vpn Account\n\n` +
        `**•  Account(s):** ||${account}||\n` +
        `**•  Login:** [Haz Click Aqui](https://nordaccount.com/login)\n\n` +
        `Déjanos por favor una reseña para poder seguir creciendo!`
      );

    // 1. Respuesta efímera para el staff
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Envío público al canal
    await interaction.channel.send({ embeds: [embed] });
  }
};