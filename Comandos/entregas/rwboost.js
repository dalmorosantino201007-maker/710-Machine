const Discord = require("discord.js")

const config = require('../../config.json')

module.exports = {
  name: "rwboost", // Coloque o nome do comando
  description: "📦 | Recompensas por Boostear", // Coloque a descrição do comando
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
      .setTitle("¡Gracias por tus boosts! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://media.discordapp.net/attachments/1387582521662771363/1411738364142420069/2184-heart-boost.png?ex=68b5bf4e&is=68b46dce&hm=4900279f72b37eaf3d014567c57f311218a93618e5a6f7ddcdb0d26d66c84acd&=&format=webp&quality=lossless")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Reward Boost 🔮\n\n` +
        `**•  Link:** ||https://gofile.io/d/g0W8UD||\n\n` +
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