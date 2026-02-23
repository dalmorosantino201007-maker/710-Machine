const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "rockstar",
  description: "📦 | Entrega Rockstar",
  options: [
    {
      name: "account",
      description: "Ingrese la/s account(s).",
      type: 3, // STRING
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // ID del rol requerido (limpiado de errores)
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
    const account = interaction.options.getString("account");

    // MessageEmbed adaptado a v13
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://cdn.discordapp.com/attachments/1357892619262361841/1360791033683771564/Rockstar_logo_for_tweets.png")
      .setFooter(botName, botAvatar) // v13 usa (texto, icono)
      .setDescription(
        `**•  __Producto__:** Rockstar Account\n\n` +
        `**•  Account(s):** ||${account}||\n` +
        `**•  Login:** [Haz Click Aqui](https://signin.rockstargames.com/signin/user-form?cid=rsg&returnUrl=%2F)\n\n` +
        `Déjanos por favor una para poder seguir creciendo!`
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