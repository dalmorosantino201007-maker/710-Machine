const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "partnersrol",
  description: "🔨 | Sistema para añadir el rol de partner por botón",
  // En v13 no se usa ApplicationCommandType.ChatInput aquí, se deja por defecto
  
  run: async (client, interaction) => {
    // Verificación de permisos corregida para v13
    if (!interaction.member.permissions.has("MANAGE_ROLES")) {
      return interaction.reply({ 
        content: `❌ No tienes permiso para utilizar este comando.`, 
        ephemeral: true 
      });
    }

    const rolId = "1470862847671140412"; 
    
    // Respuesta inicial efímera
    await interaction.reply({ content: `✅ Configurando el sistema de partners...`, ephemeral: true });

    const embed = new MessageEmbed()
      .setColor(config.colorpredeterminado || "#2f3136")
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTitle("**__Partner Access__**")
      .setDescription("**🇪🇸 Hola! Te damos la bienvenida a la sección de partner de Host.**\n\n• Presiona el botón de abajo para verificar y poder ver los partners de Host.\n\n**🇺🇸 Hello! We welcome you to the Host partner section.**\n\n• Press the button below to verify and see the Host partners.");

    const botao = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("partner_rol") 
        .setLabel("Verificarse") // Un label queda mejor que solo el emoji
        .setEmoji("✅")
        .setStyle("SUCCESS") // En v13 es un string en mayúsculas
    );

    // Enviar el mensaje al canal
    await interaction.channel.send({ embeds: [embed], components: [botao] });
  }
};