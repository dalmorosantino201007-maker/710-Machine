const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "partnersrol",
  description: "🔨 | Sistema para añadir el rol de partner por botón",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: `No tienes permiso para utilizar este comando.`, ephemeral: true });
    }

    const rolId = "1368948532295368764"; // ID del rol
    const cargo = interaction.guild.roles.cache.get(rolId);

    // Enviar un mensaje efímero que será visible solo para el usuario
    await interaction.reply({ content: `Por favor, espera un momento...`, ephemeral: true });

    const embed = new Discord.EmbedBuilder()
      .setColor(`${config.colorpredeterminado}`)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTitle("**__Partner Access__**")
      .setDescription("**🇪🇸 Hola! Te damos la bienvenida a la sección de partner de Host.**\n\n• Presiona el botón de abajo para verificar y poder ver los partners de Host.\n• Si encuentras algún problema durante el proceso, por favor, contacta a un miembro del staff para obtener ayuda.\n\n**🇺🇸 Hello! We welcome you to the Host partner section.**\n\n• Press the button below to verify and see the Host partners.\n• If you encounter any problems during the process, please contact a staff member for help.");

    const botao = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("partner_rol") // 👈 ahora un ID fijo
        .setLabel("✅")
        .setStyle(Discord.ButtonStyle.Success)
    );

    // Enviar el embed y los botones como un nuevo mensaje
    await interaction.channel.send({ embeds: [embed], components: [botao] });
  }
};
