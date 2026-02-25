const Discord = require("discord.js");
const path = require('path');
const config = require(path.join(process.cwd(), 'DataBaseJson', 'config.json'));

module.exports = {
  name: "embed",
  description: "🔨 | Envía un embed personalizado.",

  run: async (client, interaction) => {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ 
        content: `<:warninghost:1383935369275379874> | ¡No tienes permiso!`, 
        ephemeral: true 
      });
    }

    const modal = new Discord.Modal()
      .setCustomId('modal_embed_personalizado')
      .setTitle('🎉 | Crear Embed');

    const tituloInput = new Discord.TextInputComponent()
      .setCustomId('titulo').setLabel('Título:').setStyle('SHORT').setRequired(false);

    const descInput = new Discord.TextInputComponent()
      .setCustomId('desc').setLabel('Descripción:').setStyle('PARAGRAPH').setRequired(true);

    const thumbInput = new Discord.TextInputComponent()
      .setCustomId('thumbnail').setLabel('Thumbnail: (opcional)').setStyle('SHORT').setRequired(false);

    const bannerInput = new Discord.TextInputComponent()
      .setCustomId('banner').setLabel('Banner: (opcional)').setStyle('SHORT').setRequired(false);

    const colorInput = new Discord.TextInputComponent()
      .setCustomId('cor').setLabel('Color(hex):').setStyle('SHORT').setPlaceholder('#000001').setRequired(true);

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