const Discord = require("discord.js");
const config = require("../../DataBaseJson/config.json");

module.exports = {
  name: "reseller", // Cambia esto por "customer" o "ultra" en sus respectivos archivos
  description: "💎 | Asigna el rango de Reseller a un usuario.",
  options: [
    {
      name: "usuario",
      description: "Usuario al que dar el rango.",
      type: "USER",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // 1. Esto evita el error de "La aplicación no ha respondido"
    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Verificar permisos
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        return interaction.editReply({ content: "❌ No tienes permisos." });
      }

      const targetUser = interaction.options.getMember("usuario");
      
      // 3. ID del Rol (Cámbialo según el comando)
      const roleId = config.roles.reseller; // Asegúrate de tener esto en tu config.json
      const role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.editReply({ content: "❌ No encontré el rol configurado." });
      }

      // 4. Asignar rol
      await targetUser.roles.add(role);

      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Rango Actualizado")
        .setDescription(`Se ha asignado el rango **${role.name}** a ${targetUser}.`)
        .setColor("BLUE")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.editReply({ content: "❌ Error: Verifica que mi rol esté arriba de los demás." });
    }
  },
};