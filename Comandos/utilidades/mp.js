const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "mp",
  description: "🔨 | Mensaje Mercado Pago",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const requiredRoleId = "1469967630365622403";
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

    let embed = new Discord.EmbedBuilder()
      .setTitle("**__Mercado Pago__**")
      .setColor(`${config.colorpredeterminado}`)
      .setTimestamp(new Date())
      .setThumbnail("https://www.google.com/imgres?q=mercado%20pago&imgurl=https%3A%2F%2Fhttp2.mlstatic.com%2FD_NQ_NP_774991-MLA74959264979_032024-F.jpg&imgrefurl=https%3A%2F%2Fwww.mercadolibre.com.ar%2Ftienda%2Fmercado-pago&docid=vCX8Eg38QX8NtM&tbnid=H3eDmbqbUcl2vM&vet=12ahUKEwjvyPr96-GSAxX0qJUCHcJPGTUQnPAOegQIFBAB..i&w=1024&h=747&hcb=2&ved=2ahUKEwjvyPr96-GSAxX0qJUCHcJPGTUQnPAOegQIFBAB")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(`Mercado Pago es uno de nuestros métodos de pago, a continuación se le otorgara los datos para enviar el dinero.\n\n**- CVU:** \`0000003100072461415651\`\n- **Alias:** \`710shop\`\n\n**¿Cuál es el titular del CVU?**\n**- Titular:** \`Santino Bautista Dal Moro Urbani\`\n- **Banco:** \`Mercado Pago\`\n\nUna vez enviado el dinero, recordá enviar comprobante, esto nos ayudará a comprobar tu pago de manera más rápida.`);

    const buttons = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("copiar_cvu")
        .setLabel("Copiar CVU")
        .setEmoji("1364463939617951795")
        .setStyle(Discord.ButtonStyle.Primary),
      new Discord.ButtonBuilder()
        .setCustomId("copiar_alias")
        .setLabel("Copiar ALIAS")
        .setEmoji("1364463939617951795")
        .setStyle(Discord.ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [buttons] });
  }
};
