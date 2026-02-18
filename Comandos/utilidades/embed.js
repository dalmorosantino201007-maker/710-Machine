const { EmbedBuilder, ModalBuilder, TextInputBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config.json");
const { General, emoji } = require("../../DataBaseJson");

module.exports = {
   name: "embed",
   description: "[🔨 | Envie un embed.",

   run: async (client, interaction) => {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
         return interaction.reply({ content: `<:warninghost:1383935369275379874> | ¡No tienes permiso para usar este comando!`, ephemeral: true });
      }

      const modal = new ModalBuilder()
         .setCustomId('modalanuncio')
         .setTitle('🎉 | Embed');

      const text1 = new TextInputBuilder()
         .setCustomId('titulo')
         .setLabel('Titulo:')
         .setPlaceholder('Titulo del Embed.')
         .setRequired(false)
         .setStyle(1);

      const text2 = new TextInputBuilder()
         .setCustomId('desc')
         .setLabel('Descripcion:')
         .setPlaceholder('Descripcion del Embed')
         .setRequired(true)
         .setStyle(2);

      const text3 = new TextInputBuilder()
         .setCustomId('thumbnail')
         .setLabel('Thumbnail: (opcional)')
         .setPlaceholder('URL de la imagen para thumbnail.')
         .setRequired(false)
         .setStyle(1);

      const text4 = new TextInputBuilder()
         .setCustomId('banner')
         .setLabel('Banner: (opcional)')
         .setPlaceholder('Link de la imagen para el Embed.')
         .setRequired(false)
         .setStyle(1);

      const text5 = new TextInputBuilder()
         .setCustomId('cor')
         .setLabel('Color(hex):')
         .setPlaceholder('Color del Embed.')
         .setRequired(true)
         .setStyle(1);

      modal.addComponents(
         new ActionRowBuilder().addComponents(text1),
         new ActionRowBuilder().addComponents(text2),
         new ActionRowBuilder().addComponents(text3),
         new ActionRowBuilder().addComponents(text4),
         new ActionRowBuilder().addComponents(text5)
      );

      await interaction.showModal(modal);
   }
};

function registerInteractionHandler(client) {
   client.on('interactionCreate', async (modalInteraction) => {
      if (modalInteraction.isModalSubmit() && modalInteraction.customId === 'modalanuncio') {
         const titulo = modalInteraction.fields.getTextInputValue("titulo");
         const desc = modalInteraction.fields.getTextInputValue("desc");
         const thumbnail = modalInteraction.fields.getTextInputValue("thumbnail");
         const banner = modalInteraction.fields.getTextInputValue("banner");
         const cor = modalInteraction.fields.getTextInputValue("cor") || General.get(color.padrao);

         if (banner && !link(banner)) {
            return modalInteraction.reply({ content: `${emoji.get(emojix)} | ¡Has insertado un banner no válido!`, ephemeral: true });
         }

         if (thumbnail && !link(thumbnail)) {
            return modalInteraction.reply({ content: `${emoji.get(emojix)} | ¡Has insertado una miniatura no válida!`, ephemeral: true });
         }

         if (cor && !corregex(cor)) {
            return modalInteraction.reply({ content: `${emoji.get(emojix)} | ¡Has introducido un color no válido!`, ephemeral: true });
         }

         const embedanun = new EmbedBuilder()
            .setDescription(desc)
            .setColor(cor);

         if (titulo && titulo.trim().length > 0) {
            embedanun.setTitle(titulo.trim());
         }
         if (banner) embedanun.setImage(banner);
         if (thumbnail) embedanun.setThumbnail(thumbnail);

         // Agregar footer y botón
         const { embed, buttonRow } = agregarFooterYBoton(embedanun, modalInteraction.guild);

         try {
            await modalInteraction.channel.send({
               embeds: [embed],
               components: [buttonRow]
            });

            await modalInteraction.reply({ content: `<:checkwhite:1374234754366570576> | ¡Embed enviado Exitosamente!`, ephemeral: true });
         } catch (error) {
            await modalInteraction.reply({ content: `<:warninghost:1383935369275379874> | ¡Error al enviar el Embed!\n${emoji.get(emojix)} | Error: ${error.message}`, ephemeral: true });
         }
      }
   });
}

function agregarFooterYBoton(embed, guild) {
   embed.setFooter({
      text: `${guild.name}`,
      iconURL: guild.iconURL({ dynamic: true })
   });

   embed.setTimestamp(); // Agrega automáticamente la fecha y hora actual

   const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setLabel("Compra Aqui / Buy Here")
         .setEmoji("1404006081826390138")
         .setStyle(ButtonStyle.Link)
         .setURL("https://discord.com/channels/1469618754282586154/1469950823474659409")
   );

   return { embed, buttonRow };
}

module.exports.registerInteractionHandler = registerInteractionHandler;

function link(n) {
   const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
   return urlRegex.test(n);
}

function corregex(cor) {
   const corRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
   return corRegex.test(cor);
}

