const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "ipvanish", // Nombre del comando
  description: "📦​ | Entrega Ip Vanish", // Descripción
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
      .setThumbnail("https://cdn.discordapp.com/attachments/1294464739006480385/1295097668946890813/ipvanish.png?ex=69960b32&is=6994b9b2&hm=81628297c5ea3d6cc5eb2e53525435c5b1419f936bba5fae07685e5f75237295&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Ip Vanish Account\n\n` +
        `**•  Account(s):** ||${account}||\n` +
        `**•  Login:** [Haz Click Aqui](https://www.ipvanish.com/)\n\n` +
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