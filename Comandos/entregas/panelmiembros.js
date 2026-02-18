const Discord = require("discord.js")

const config = require('../../config.json')

module.exports = {
  name: "panelmiembros", // Coloque o nome do comando
  description: "📦 | Entregar Panel Miembros", // Coloque a descrição do comando
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
      .setThumbnail("https://cdn.discordapp.com/attachments/1357892619262361841/1370550788325113907/discord-logo-icon-editorial-free-vector.png?ex=681fe863&is=681e96e3&hm=43e7b9206a6989a5b3bf349ad01250935457d83a23c4ab8a9b12a9698281aa53&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Panel Miembros\n\n` +
        `**•  Link:** ||https://members-hub.store/||\n\n` +
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