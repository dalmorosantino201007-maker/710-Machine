const Discord = require("discord.js");

module.exports = {
  name: "setrole",
  description: "👤 | Añade un rol a un usuario rápidamente.",
  options: [
    {
      name: "usuario",
      description: "Selecciona al usuario.",
      type: "USER",
      required: true,
    },
    {
      name: "rol",
      description: "Selecciona el rol que quieres añadir.",
      type: "ROLE",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // 1. Verificar permisos (Solo administradores)
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content: "❌ No tienes permisos para usar este comando.",
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getMember("usuario");
    const role = interaction.options.getRole("rol");

    try {
      // 2. Verificar si el usuario ya tiene el rol
      if (targetUser.roles.cache.has(role.id)) {
        return interaction.reply({
          content: `⚠️ El usuario ${targetUser} ya tiene el rol **${role.name}**.`,
          ephemeral: true,
        });
      }

      // 3. Añadir el rol
      await targetUser.roles.add(role);

      // 4. Confirmación
      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Rol Asignado")
        .setDescription(`Se ha añadido correctamente el rol ${role} a ${targetUser}.`)
        .setColor("GREEN")
        .setFooter({ text: `Acción realizada por ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "❌ No pude añadir el rol. Asegúrate de que mi rol esté **por encima** del rol que intentas dar.",
        ephemeral: true,
      });
    }
  },
};