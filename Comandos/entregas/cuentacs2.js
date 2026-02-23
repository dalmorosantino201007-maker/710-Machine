const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "cuentacs2",
  description: "📦 | Entrega Cuenta De CS2",
  options: [
    {
      name: "account",
      description: "Ingrese la/s account(s).",
      type: 3, // STRING en v13
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // ID del rol requerido (limpiado de errores de sintaxis)
    const requiredRoleId = "1469968666425823274";

    // Verificar si el usuario tiene el rol
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: "| No tienes permiso para usar este comando.", 
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
      .setThumbnail("https://cdn.discordapp.com/attachments/1474642509849165824/1474643351700766762/d62aq07xnbpa1.png?ex=699c9264&is=699b40e4&hm=8946ae50d874bac9d03f93773f5d5af6736d615726206e25c9eca7662501c600&")
      .setFooter(botName, botAvatar) // v13 usa (texto, icono)
      .setDescription(
        `**•  __Producto__:** CS2 Account\n\n` +
        `**•  Account(s):** ||${account}||\n` +
        `**•  Login:** [Haz Click Aqui](https://store.steampowered.com/login/)\n\n` +
        `Déjanos por favor una reseña para poder seguir creciendo!`
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