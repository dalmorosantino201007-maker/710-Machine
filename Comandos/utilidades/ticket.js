const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "ticket",
  description: "🔨 | Abre el panel de tickets.",

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has("MANAGE_GUILD")) {
      return interaction.reply({ 
        content: `❌ | No tienes permiso para usar este comando.`, 
        ephemeral: true 
      });
    }

    let embed = new Discord.MessageEmbed()
      .setColor(config.colorpredeterminado || "#000001")
      .setTitle(`Tickets System`)
      .setDescription(
        `🇪🇸 · **Hola!** para abrir un ticket, debes presionar uno de los siguientes botones.\n\n` +
        `🇺🇸 · **Hello!** To open a ticket, you must press one of the following buttons.\n\n` +
        `🇧🇷 · **Olá!** Para abrir um ticket, você deve pressionar um dos botões abaixo.`
      )
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() }) 
      .setFooter({ text: '710 Shop - Todos los derechos reservados.' });

    let painel = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setCustomId("opc1")
        .setLabel("Compra")
        .setEmoji("🛒")
        .setStyle("SECONDARY"),

      new Discord.MessageButton()
        .setCustomId("opc2")
        .setLabel("Soporte")
        .setEmoji("🛠️")
        .setStyle("SECONDARY"),

      new Discord.MessageButton()
        .setCustomId("opc3")
        .setLabel("Partner")
        .setEmoji("🤝")
        .setStyle("SECONDARY")
    );

    // Confirmación al usuario que tiró el comando
    await interaction.reply({ content: `✅ ¡Panel de tickets enviado!`, ephemeral: true });
    
    // Envío del panel al canal
    await interaction.channel.send({ embeds: [embed], components: [painel] });
  }
}