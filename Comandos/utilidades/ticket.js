const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "ticket",
  description: "🔨 | Abre el panel de tickets.",

  run: async (client, interaction) => {

    // En v13 se usa el string de permiso directamente
    if (!interaction.member.permissions.has("MANAGE_GUILD")) {
      return interaction.reply({ 
        content: `❌ | No tienes permiso para usar este comando.`, 
        ephemeral: true 
      });
    }

    // MessageEmbed v13: No usa objetos en Author ni Footer
    let embed = new Discord.MessageEmbed()
      .setColor(config.colorpredeterminado || "#000001")
      .setTitle(`Tickets System`)
      .setDescription(
        `🇪🇸 · **Hola!** para abrir un ticket, debes presionar uno de los siguientes botones.\n\n` +
        `🇺🇸 · **Hello!** To open a ticket, you must press one of the following buttons.\n\n` +
        `🇧🇷 · **Olá!** Para abrir um ticket, você deve pressionar um dos botões abaixo.`
      )
      .setAuthor(client.user.username, client.user.displayAvatarURL()) 
      .setFooter('©️ Host - Todos los derechos reservados.');

    // MessageActionRow y MessageButton v13
    let painel = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setCustomId("ticket_compra") // Cambiado para identificar el tipo
        .setLabel("Compra")
        .setEmoji("1415071860131102841")
        .setStyle("SECONDARY"),

      new Discord.MessageButton()
        .setCustomId("ticket_soporte")
        .setLabel("Soporte")
        .setEmoji("1415072399942090883")
        .setStyle("SECONDARY"),

      new Discord.MessageButton()
        .setCustomId("ticket_partner")
        .setLabel("Partner")
        .setEmoji("1415072383517196318")
        .setStyle("SECONDARY")
    );

    // Respuesta efímera de confirmación
    await interaction.reply({ content: `✅ ¡Mensaje enviado!`, ephemeral: true });
    
    // Envío del panel al canal
    await interaction.channel.send({ embeds: [embed], components: [painel] });
  }
}