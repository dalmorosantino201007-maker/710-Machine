const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');
// Nota: Asegúrate de tener instalada la librería 'otplib' (npm install otplib)

module.exports = {
  name: "2facode",
  description: "🔐 | Generador de Código 2FA",

  run: async (client, interaction) => {
    // Nota: Eliminé la "v" al final del ID que tenías en el original por si era un error de dedo
    const allowedRoleId = "1469618981781373042"; 

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    // Respuesta efímera de confirmación
    await interaction.reply({
      content: "✅ Sistema 2FA enviado exitosamente.",
      ephemeral: true
    });

    // Crear el MessageEmbed (v13)
    const embed = new Discord.MessageEmbed()
      .setTitle("🔐 **__Rockstar Código 2FA__**")
      .setDescription("Obtén tu código de verificación Rockstar para acceder a tu cuenta sin complicaciones.\n\n**📧 ¿Cómo funciona?**\nHaz clic en el botón de abajo para introducir tus credenciales de 2FA y obtener el último código enviado por Rockstar.\n\n**🔒 Seguridad**\nTus credenciales son procesadas de forma segura y no se almacenan.")
      .setColor("#DE9D45")
      .setThumbnail("https://cdn.discordapp.com/attachments/1470928427199631412/1471283748715757713/WhatsApp_Image_2026-02-11_at_7.41.50_PM.jpeg")
      .setFooter({
        text: "Host | Sistema de 2FA Code",
        iconURL: interaction.guild.iconURL({ dynamic: true })
      });

    // Crear ActionRow y Button (v13)
    const row = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setCustomId("ingresar_clave_2fa")
        .setLabel("Obtener Código 2FA")
        .setStyle("SECONDARY") // En v13 es un string en mayúsculas
        .setEmoji("🔑")
    );

    // Enviar el mensaje al canal
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};