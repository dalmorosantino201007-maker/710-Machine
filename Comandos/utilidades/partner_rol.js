const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "partnersrol",
  description: "🔨 | Sistema para añadir el rol de partner por botón",
  
  run: async (client, interaction) => {
    // Verificación de permisos
    if (!interaction.member.permissions.has("MANAGE_ROLES")) {
      return interaction.reply({ 
        content: `❌ No tienes permiso para utilizar este comando.`, 
        ephemeral: true 
      });
    }

    // ID del rol de Partner (Actualizado según tus mensajes anteriores)
    const rolId = "1470862847671140412"; 
    
    await interaction.reply({ content: `✅ Sistema de partners generado correctamente.`, ephemeral: true });

    const embed = new MessageEmbed()
      .setTitle("Partner Access")
      .setColor("#2b2d31") // Color oscuro estético
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription(
        "🇪🇸 **Hola! Te damos la bienvenida a la sección de partner de 710.**\n\n" +
        "• Presiona el botón de abajo para verificar y poder ver los partners de 710.\n" +
        "• Si encuentras algún problema durante el proceso, por favor, contacta a un miembro del staff para obtener ayuda.\n\n" +
        "🇺🇸 **Hello! We welcome you to the 710 partner section.**\n\n" +
        "• Press the button below to verify and see the 710 partners.\n" +
        "• If you encounter any problems during the process, please contact a staff member for help."
      );

    const botao = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("partner_rol") 
        .setEmoji("✅")
        .setStyle("SUCCESS") 
    );

    // Enviar el mensaje al canal donde se usó el comando
    await interaction.channel.send({ embeds: [embed], components: [botao] });
  }
};