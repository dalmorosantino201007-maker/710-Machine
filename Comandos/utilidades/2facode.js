const Discord = require("discord.js");

module.exports = {
  name: "2facode",
  description: "🔐 | Generador de Código 2FA",

  run: async (client, interaction) => {
    const allowedRoleId = "1469618981781373042"; 

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    const embed = new Discord.MessageEmbed()
      .setTitle("🔐 **__Rockstar Código 2FA__**")
      .setDescription("Obtén tu código de verificación Rockstar para acceder a tu cuenta sin complicaciones.\n\n**📧 ¿Cómo funciona?**\nHaz clic en el botón de abajo para introducir tus credenciales de 2FA.\n\n**🔒 Seguridad**\nTus credenciales son procesadas de forma segura.")
      .setColor("#DE9D45")
      .setThumbnail("https://cdn.discordapp.com/attachments/1470928427199631412/1471283748715757713/WhatsApp_Image_2026-02-11_at_7.41.50_PM.jpeg")
      .setFooter({
        text: "Host | Sistema de 2FA Code",
        iconURL: interaction.guild.iconURL({ dynamic: true })
      });

    const row = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setCustomId("ingresar_clave_2fa") // ESTE ID DEBE ESTAR EN EL INDEX
        .setLabel("Obtener Código 2FA")
        .setStyle("SECONDARY")
        .setEmoji("🔑")
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    
    return interaction.reply({
      content: "✅ Sistema 2FA enviado exitosamente.",
      ephemeral: true
    });
  }
};