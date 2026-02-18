const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "sharkmenu", // Nombre del comando
  description: "📦​ | Entrega Shark Menu", // Descripción
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "key",
      description: "Ingrese la/s key(s).",
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
    const key = interaction.options.getString("key");

    // Embed de entrega
    const embed = new Discord.EmbedBuilder()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://cdn.discordapp.com/attachments/1399443054535901235/1408192920254677022/image.png?ex=68b55f9b&is=68b40e1b&hm=f45be20d62dbb53c825e7d49c952ff039440897553cdcd27d77c4a273b8b6cda&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Shark Menu <:sharkmenu:1375470745622155314>\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Download:** ||https://cdn.sharksoftwares.com.br/download||\n` +
        `**•  Discord:** ||https://discord.gg/E3wxkxBpNH||\n\n` +
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