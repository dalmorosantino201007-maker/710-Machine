const { EmbedBuilder, Client, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require("discord.js");
const fs = require('fs');
const discordArts = require('discord-arts');
const path = require('path');
const { Profile } = require('discord-arts');
const Canvas = require('canvas');
const config = require("../config.json");
const { emoji } = require("../DataBaseJson");

const eventsDir = path.join(__dirname, 'Events');

module.exports = (client) => {
  console.log('Módulo welcome.js cargado.');

  if (!(client instanceof Client)) {
    console.error('El cliente no es una instancia válida');
    return;
  }

  client.on("guildMemberAdd", async (member) => {
    console.log(`Nuevo miembro en el servidor: ${member.user.username}`);
    
    const guild = member.guild;

    // Embed estilo de la imagen que me enviaste
    const embedwelcome = new EmbedBuilder()
.setColor("#000001")
.setTitle(`¡Bienvenido a ${guild.name}™!`)
.setDescription(`¡Hola ${member}, estamos emocionados de tenerte aquí! 💬`)
.addFields(
  { name: '👤 Usuario:', value: `${member.user.username}`, inline: false },
  { name: '📅 Cuenta creada el:', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: false },
  { name: '🕒 Se unió al servidor el:', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
  { name: '⏳ Miembro desde hace:', value: `${Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24))} días`, inline: false },
  { name: '👥 Total de miembros:', value: `${guild.memberCount}`, inline: false },
  { name: '📖 Términos del servidor:', value: `Asegúrate de revisar nuestras términos en <#1333383614951329802>` }
)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter({ 
  text: `¡Ahora somos ${guild.memberCount} miembros!`, 
  iconURL: guild.iconURL({ dynamic: true, size: 1024 }) 
})
      .setTimestamp();

    const welcomeChannel = client.channels.cache.get("1341973475354476554");
    if (welcomeChannel) {
      await welcomeChannel.send({
        content: `👋 ¡Bienvenido/a ${member}! Esperamos que disfrutes tu estadía en **${guild.name}™**.`,
        embeds: [embedwelcome]
      }).catch(err => console.error('Error al enviar el mensaje de bienvenida:', err));
    }

    // ---- DM al nuevo miembro (tu parte de antes la dejo igual) ----
    const dmEmbed = new EmbedBuilder()
      .setColor('#000001')
      .setTitle(`¡Bienvenido/a a ${guild.name}!`)
      .setDescription(`¡Hola ${member}! Estamos encantados de tenerte en **${guild.name}**. :wave:\n\n:mag: ¡**Atención**! Para asegurar una experiencia fluida y sin problemas en nuestro servidor, te invitamos a visitar los siguientes canales:\n\n:one: **Información Importante**: [Haz clic aquí](https://discord.com/channels/1469618754282586154/1469950357785546853) para estar al día con las últimas novedades.\n:two: **Comunidad y Confianza**: [Haz clic aquí](https://discord.com/channels/1469618754282586154/1469950357785546853) para conocer nuestras ventas positivas y fortalecer la confianza dentro de nuestro servidor.\n\n:pushpin: **Características del Servidor**:\n- Soporte 24/7 disponible :tools:`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter({
        text: `Bienvenid@ a ${guild.name}`,
        iconURL: guild.iconURL({ dynamic: true, size: 1024 }),
      })
      .setTimestamp();

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Discord del Developer')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/r6yP9CPKSt')
        .setEmoji(guild.emojis.cache.find(emoji => emoji.name === 'discord')?.id),
      new ButtonBuilder()
        .setLabel('Youtube de Host')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.youtube.com/@HostStore1')
        .setEmoji(guild.emojis.cache.find(emoji => emoji.name === 'youtube')?.id)
    );

    await member.send({ embeds: [dmEmbed], components: [buttonRow] }).catch(err => {
      console.error('Error al enviar el mensaje directo:', err);
    });
  });
};