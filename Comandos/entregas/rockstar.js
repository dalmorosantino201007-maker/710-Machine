const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "rockstar", // Nombre del comando
  description: "📦​ | Entrega Rockstar", // Descripción
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "account",
      description: "Ingrese la/s account(s).",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // Verificar si el usuario tiene el rol requerido
    const requiredRoleId = `${config.eventas}`;"1469968666425823274"
    const member = interaction.member;
    const hasRole = member.roles.cache.has(requiredRoleId);"1469968666425823274"

    if (!hasRole) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    // Datos
    const bot = client.user.username;
    const avatar_bot = client.user.displayAvatarURL({ dynamic: true });
    const account = interaction.options.getString("account");

    // Embed de entrega
    const embed = new Discord.EmbedBuilder()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://cdn.discordapp.com/attachments/1357892619262361841/1360791033683771564/Rockstar_logo_for_tweets.png?ex=68b5a1a8&is=68b45028&hm=7ac24d309e35a641ded8a7ef4949b922d56b87a827631193eb19cb67546841a5&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Rockstar Account\n\n` +
        `**•  Account(s):** ||${account}||\n` +
        `**•  Login:** [Haz Click Aqui](https://signin.rockstargames.com/signin/user-form?cid=rsg&returnUrl=%2F)\n\n` +
        `Déjanos por favor un ${config.feedback} para poder seguir creciendo! <a:blackverify:1360058374456348846><:coramanos:1387181348069838942>`
      );

    // 1. Enviar mensaje ephemeral al usuario
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Enviar embed públicamente al canal
    await interaction.channel.send({ embeds: [embed] });
  }
}