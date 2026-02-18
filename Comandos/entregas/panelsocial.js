const Discord = require("discord.js")

const config = require('../../config.json')

module.exports = {
  name: "panelsocial", // Coloque o nome do comando
  description: "📦 | Entregar Panel Social", // Coloque a descrição do comando
  type: Discord.ApplicationCommandType.ChatInput,

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

    let embed = new Discord.EmbedBuilder()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://images-ext-2.discordapp.net/external/Ndb5q9FpubDdNQBWkgptoI03DowYUAnsDsizmoLI5oc/https/upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/768px-Instagram_logo_2016.svg.png?format=webp&quality=lossless&width=473&height=473")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Panel Social\n\n` +
        `**•  Link:** ||https://smmsat.com/||\n\n` +
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