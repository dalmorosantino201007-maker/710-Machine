const Discord = require("discord.js");
const path = require('path');
// Ruta infalible
const config = require(path.join(process.cwd(), 'DataBaseJson', 'config.json'));

module.exports = {
  name: "embed",
  description: "🔨 | Envía un embed personalizado.",

  run: async (client, interaction) => {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ 
        content: `<:warninghost:1383935369275379874> | ¡No tienes permiso para usar este comando!`, 
        ephemeral: true 
      });
    }

    // Estructura de Modal compatible con v13
    const modal = new Discord.Modal()
      .setCustomId('modalanuncio')
      .setTitle('🎉 | Crear Embed');

    const tituloInput = new Discord.TextInputComponent()
      .setCustomId('titulo').setLabel('Título:').setStyle('SHORT').setPlaceholder('Título del Embed.').setRequired(false);

    const descInput = new Discord.TextInputComponent()
      .setCustomId('desc').setLabel('Descripción:').setStyle('PARAGRAPH').setPlaceholder('Descripción del Embed').setRequired(true);

    const thumbInput = new Discord.TextInputComponent()
      .setCustomId('thumbnail').setLabel('Thumbnail: (opcional)').setStyle('SHORT').setPlaceholder('URL de la imagen miniatura.').setRequired(false);

    const bannerInput = new Discord.TextInputComponent()
      .setCustomId('banner').setLabel('Banner: (opcional)').setStyle('SHORT').setPlaceholder('Link de la imagen grande.').setRequired(false);

    const colorInput = new Discord.TextInputComponent()
      .setCustomId('cor').setLabel('Color(hex):').setStyle('SHORT').setPlaceholder('#000000').setRequired(true);

    // Añadir inputs al modal
    modal.addComponents(
      new Discord.MessageActionRow().addComponents(tituloInput),
      new Discord.MessageActionRow().addComponents(descInput),
      new Discord.MessageActionRow().addComponents(thumbInput),
      new Discord.MessageActionRow().addComponents(bannerInput),
      new Discord.MessageActionRow().addComponents(colorInput)
    );

    await interaction.showModal(modal);
  }
};