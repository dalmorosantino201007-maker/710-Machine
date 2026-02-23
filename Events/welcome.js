const { MessageEmbed, MessageActionRow, MessageButton, Client } = require("discord.js");
const config = require('../DataBaseJson/config.json');

module.exports = (client) => {
  console.log('Módulo welcome.js cargado para v13.');

  if (!(client instanceof Client)) {
    console.error('El cliente no es una instancia válida');
    return;
  }

  client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    console.log(`Nuevo miembro detectado: ${member.user.username}`);

    // --- 1. EMBED PARA EL CANAL PÚBLICO ---
    const embedwelcome = new MessageEmbed()
      .setColor("#000001")
      .setTitle(`¡Bienvenido a ${guild.name}™!`)
      .setDescription(`¡Hola ${member}, estamos emocionados de tenerte aquí! 💬`)
      .addFields(
        { name: '👤 Usuario:', value: `${member.user.username}`, inline: false },
        { name: '📅 Cuenta creada el:', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: false },
        { name: '🕒 Se unió al servidor el:', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: '⏳ Miembro desde hace:', value: `${Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24))} días`, inline: false },
        { name: '👥 Total de miembros:', value: `${guild.memberCount}`, inline: false },
        { name: '📖 Términos del servidor:', value: `Asegúrate de revisar nuestras términos en <#1475299469141475368>` }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter(`¡Ahora somos ${guild.memberCount} miembros!`, guild.iconURL({ dynamic: true }))
      .setTimestamp();

    const welcomeChannel = client.channels.cache.get("1475299459091927161");
    if (welcomeChannel) {
      await welcomeChannel.send({
        content: `👋 ¡Bienvenido/a ${member}! Esperamos que disfrutes tu estadía en **${guild.name}™**.`,
        embeds: [embedwelcome]
      }).catch(err => console.error('Error enviando bienvenida al canal:', err));
    }

    // --- 2. MENSAJE DIRECTO (DM) ---
    const dmEmbed = new MessageEmbed()
      .setColor('#000001')
      .setTitle(`¡Bienvenido/a a ${guild.name}!`)
      .setDescription(`¡Hola ${member}! Estamos encantados de tenerte en **${guild.name}**. :wave:\n\n:mag: ¡**Atención**! Para asegurar una experiencia fluida, visita:\n\n:one: **Información Importante**: [Haz clic aquí](https://discord.com/channels/1469618754282586154/1469950357785546853)\n:two: **Comunidad y Confianza**: [Haz clic aquí](https://discord.com/channels/1469618754282586154/1469950357785546853)\n\n:pushpin: **Características**:\n- Soporte 24/7 disponible :tools:`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setFooter(`Bienvenid@ a ${guild.name}`, guild.iconURL({ dynamic: true }))
      .setTimestamp();

    // Botones con estilo v13
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('Discord del Developer')
        .setStyle('LINK')
        .setURL('https://discord.gg/r6yP9CPKSt')
        .setEmoji(guild.emojis.cache.find(e => e.name === 'discord')?.id || '🚀'),
      new MessageButton()
        .setLabel('Youtube de Host')
        .setStyle('LINK')
        .setURL('https://www.youtube.com/@HostStore1')
        .setEmoji(guild.emojis.cache.find(e => e.name === 'youtube')?.id || '📺')
    );

    await member.send({ embeds: [dmEmbed], components: [buttonRow] }).catch(() => {
      console.log(`No se pudo enviar bienvenida por DM a ${member.user.tag} (MDs cerrados).`);
    });
  });
};