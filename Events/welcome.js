const { MessageEmbed, MessageActionRow, MessageButton, Client } = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    const channelId = "1469953972197654570"; // Tu ID de canal
    
    // Buscar canal
    let welcomeChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);

    if (welcomeChannel) {
      const embedwelcome = new MessageEmbed()
        .setColor("#2f3136") // Color oscuro similar al de la imagen
        .setAuthor({ 
            name: `${guild.name} | .gg/710shop | Bot`, 
            iconURL: guild.iconURL({ dynamic: true }) 
        })
        .setTitle(`🎉 ¡Bienvenido a ${guild.name} ™!`)
        .setDescription(`¡Hola ${member}, estamos emocionados de tenerte aquí! 💬`)
        .addFields(
          { 
            name: '📛 Usuario:', 
            value: `${member.user.username}`, 
            inline: true 
          },
          { 
            name: '📅 Cuenta creada el:', 
            value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`, 
            inline: true 
          },
          { 
            name: '📥 Se unió al servidor el:', 
            value: `<t:${Math.floor(Date.now() / 1000)}:f>`, 
            inline: true 
          },
          { 
            name: '🕒 Miembro desde hace:', 
            value: `${Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24))} días`, 
            inline: true 
          },
          { 
            name: '👥 Total de miembros:', 
            value: `${guild.memberCount}`, 
            inline: true 
          },
          { 
            name: '🔢 Miembros hoy:', 
            value: `1`, // Opcional, puedes poner un contador real si tienes base de datos
            inline: true 
          },
          { 
            name: '📜 Reglas del servidor:', 
            value: `Revisa nuestras reglas en <#1469950357785546853>`, 
            inline: false 
          }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({ 
            text: `¡Ahora somos ${guild.memberCount} miembros!`, 
            iconURL: guild.iconURL({ dynamic: true }) 
        })
        .setTimestamp();

      await welcomeChannel.send({
        content: `👋 **¡Bienvenido ${member.user.username}!**`,
        embeds: [embedwelcome]
      }).catch(err => console.error('Error enviando bienvenida:', err));
    }
  });
};