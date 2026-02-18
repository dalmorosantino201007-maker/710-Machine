const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "nixware", // Nombre del comando
  description: "📦​ | Entrega Nixware", // Descripción
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
      .setThumbnail("https://media.discordapp.net/attachments/1294464739006480385/1336544441317724281/rage-1.png?ex=6995dfc2&is=69948e42&hm=06de903ba7cbb99a229770ac8159f20ec9dd6108357b03ec2f476a5ac4f3b256&format=webp&quality=lossless&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Nixware CS2 <:nixware:1411738983515553793>\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Website:** [Haz Click Aqui](https://nixware.cc/)\n\n` +
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