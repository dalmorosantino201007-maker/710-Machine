const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "feedback",
  description: "🔨 | Mensaje Feedback",

  run: async (client, interaction) => {
    const requiredRoleId = "1475299077544480891";
    const member = interaction.member;

    if (!member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    const botName = client.user.username;
    const botAvatar = client.user.displayAvatarURL({ dynamic: true });
    const guildIcon = interaction.guild.iconURL({ dynamic: true });

    const feedbackChannelId = "1475299529908682822";
    const feedbackChannelLink = `https://discord.com/channels/${interaction.guild.id}/${feedbackChannelId}`;

    // Cambiado a MessageEmbed (v13)
    const embed = new Discord.MessageEmbed()
      .setColor(`${config.colorpredeterminado}`)
      .setTitle("**__Feedback__**")
      .setThumbnail(guildIcon)
      .setDescription(
        `**📢 ¡Gracias por tu compra!**\n` +
        `Tu compra ha sido completada correctamente.\n\n` +

        `**💬 Deja tu opinión**\n` +
        `> Si disfrutaste de tu experiencia, te invitamos a dejar una reacción positiva en <#1475299529908682822>.\n` +
        `> Tu opinión nos ayuda a seguir mejorando nuestros servicios.\n\n` +

        `**🛠️ Soporte**\n` +
        `> Si necesitas ayuda o tienes alguna duda, no dudes en contactar a nuestro equipo. ¡Estamos aquí para ti!\n\n` +

        `─────────────────────────\n\n` +

        `**📢 Thank you for your purchase!**\n` +
        `Your purchase has been successfully processed.\n\n` +

        `**💬 Leave your feedback**\n` +
        `> If you enjoyed your experience, feel free to leave a positive reaction in <#1475299529908682822>.\n` +
        `> Your feedback helps us grow and improve.\n\n` +

        `**🛠️ Support**\n` +
        `> If you have any questions or need assistance, don’t hesitate to reach out — we're here to help!`
      )
      .setFooter({ text: botName, iconURL: botAvatar })
      .setTimestamp();

    // Cambiado a MessageActionRow y MessageButton (v13)
    const button = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setLabel("💌 Dejar Feedback")
        .setStyle('LINK') // En v13 el estilo es un string en mayúsculas
        .setURL(feedbackChannelLink)
    );

    await interaction.reply({ embeds: [embed], components: [button] });
  }
}