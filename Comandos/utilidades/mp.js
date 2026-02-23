const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "mp",
  description: "🔨 | Mensaje Mercado Pago",

  run: async (client, interaction) => {
    const requiredRoleId = "1475299082250489968";
    const member = interaction.member;
    const hasRole = member.roles.cache.has(requiredRoleId);

    if (!hasRole) {
      return interaction.reply({
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    let bot = client.user.username;
    let avatar_bot = client.user.displayAvatarURL({ dynamic: true });

    let embed = new Discord.MessageEmbed()
      .setTitle("**__Mercado Pago__**")
      .setColor(`${config.colorpredeterminado}`)
      .setTimestamp()
      .setThumbnail("https://logospng.org/download/mercado-pago/logo-mercado-pago-2048.png") 
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(`Mercado Pago es uno de nuestros métodos de pago, a continuación se le otorgara los datos para enviar el dinero.\n\n**- CVU:** \`0000003100072461415651\`\n- **Alias:** \`710shop\`\n\n**¿Cuál es el titular del CVU?**\n**- Titular:** \`Santino Bautista Dal Moro Urbani\`\n- **Banco:** \`Mercado Pago\`\n\nUna vez enviado el dinero, recordá enviar comprobante, esto nos ayudará a comprobar tu pago de manera más rápida.`);

    const buttons = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setCustomId("copiar_cvu")
        .setLabel("Copiar CVU")
        .setEmoji("1364463939617951795")
        .setStyle("PRIMARY"), 
      new Discord.MessageButton()
        .setCustomId("copiar_alias")
        .setLabel("Copiar ALIAS")
        .setEmoji("1364463939617951795")
        .setStyle("SECONDARY")
    );

    await interaction.reply({ embeds: [embed], components: [buttons] });
  }
};