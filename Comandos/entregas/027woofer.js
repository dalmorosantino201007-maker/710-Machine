const Discord = require("discord.js")

const config = require('../../config.json')

module.exports = {
  name: "027woofer", // Coloque o nome do comando
  description: "📦​ | Entrega 027 Woofer", // Coloque a descrição do comando
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

                // ID del rol requerido
                const requiredRoleId = `${config.eventas}`;"1469968666425823274"

                // Verificar si el usuario tiene el rol
        const member = interaction.member;
        const hasRole = member.roles.cache.has(requiredRoleId);"1469968666425823274"
    
        if (!hasRole) {
          return interaction.reply({ content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", ephemeral: true });
        }

    let bot = client.user.username;
    let avatar_bot = client.user.displayAvatarURL({ dynamic: true });
    let key = interaction.options.getString("key");

    let embed = new Discord.EmbedBuilder()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://media.discordapp.net/attachments/1359569148614541532/1382624268830900285/image.png?ex=69961471&is=6994c2f1&hm=84e635a21fa86949e8fd2c61b365e030b10de99dd0696f0888c4470d44d1b303&format=webp&quality=lossless&width=837&height=514&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** 027 Woofer\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Download:** ||||\n\n` +
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