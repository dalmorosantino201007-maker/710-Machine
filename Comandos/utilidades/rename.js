const Discord = require("discord.js");

module.exports = {
  name: "rename",
  description: "📝 | Cambia el nombre del canal actual.",
  options: [
    {
      name: "nombre",
      description: "Nuevo nombre para el canal.",
      type: "STRING",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    const ID_ROL_STAFF = "1469967630365622403";

    // 1. Verificar rol
    if (!interaction.member.roles.cache.has(ID_ROL_STAFF)) {
      return interaction.reply({ 
        content: "❌ No tienes permiso para renombrar este canal.", 
        ephemeral: true 
      });
    }

    const nuevoNombre = interaction.options.getString("nombre").replace(/\s+/g, '-');

    try {
      await interaction.channel.setName(nuevoNombre);
      
      const embed = new Discord.MessageEmbed()
        .setDescription(`✅ Canal renombrado a: **${nuevoNombre}**`)
        .setColor("BLUE");

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: "❌ Error: Discord tiene un límite de tiempo para cambiar nombres. Intenta de nuevo en unos minutos.", 
        ephemeral: true 
      });
    }
  },
};