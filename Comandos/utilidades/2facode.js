const Discord = require("discord.js");
const config = require('../../config.json');
const { totp } = require('otplib');

module.exports = {
  name: "2facode",
  description: "🔐 | Generador de Código 2FA",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const allowedRoleId = "1469618981781373042";

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ No tienes permiso para usar este comando.",
        ephemeral: true
      });
    }

    // Enviar mensaje efímero primero
    await interaction.reply({
      content: "✅ Sistema 2FA enviado exitosamente.",
      ephemeral: true
    });

    // Crear el embed después del mensaje de confirmación
    const embed = new Discord.EmbedBuilder()
      .setTitle("🔐 **__Rockstar Código 2FA__**")
      .setDescription("Obtén tu código de verificación Rockstar para acceder a tu cuenta sin complicaciones.\n\n**📧 ¿Cómo funciona?**\nHaz clic en el botón de abajo para introducir tus credenciales de 2FA y obtener el último código enviado por Rockstar.\n\n**🔒 Seguridad**\nTus credenciales son procesadas de forma segura y no se almacenan.")
      .setColor("#DE9D45")
      .setThumbnail("https://cdn.discordapp.com/attachments/1470928427199631412/1471283748715757713/WhatsApp_Image_2026-02-11_at_7.41.50_PM.jpeg?ex=69964844&is=6994f6c4&hm=f4a94815148d6cb4de6c863f461f9f271536175f1057d6d59f952134db9877aa&")
      .setFooter({
        text: "Host | Sistema de 2FA Code",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      });

    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("ingresar_clave_2fa")
        .setLabel("Obtener Código 2FA")
        .setStyle(Discord.ButtonStyle.Secondary)
        .setEmoji("🔑")
    );

    // Enviar el embed con el botón en el canal
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
