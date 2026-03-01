const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    const channelId = "1469953972197654570"; 
    const contadorPath = path.join(__dirname, '../DataBaseJson/contador.json'); // Ruta segura
    
    // Intentar obtener el canal
    let welcomeChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);

    if (welcomeChannel) {
      // --- 🛠️ LÓGICA DEL CONTADOR (CORREGIDA) ---
      let data = { count: 0 };

      // Si el archivo no existe, lo creamos
      if (!fs.existsSync(contadorPath)) {
          fs.writeFileSync(contadorPath, JSON.stringify({ count: 1 }, null, 2));
          data.count = 1;
      } else {
          // Si existe, leemos, sumamos 1 y guardamos
          data = JSON.parse(fs.readFileSync(contadorPath, 'utf8'));
          data.count += 1;
          fs.writeFileSync(contadorPath, JSON.stringify(data, null, 2));
      }
      // ------------------------------------------

      const embedwelcome = new MessageEmbed()
        .setColor("#2f3136")
        .setAuthor({ 
            name: `${guild.name} | .gg/710shop`, 
            iconURL: guild.iconURL({ dynamic: true }) 
        })
        .setTitle(`🎉 ¡Bienvenido a ${guild.name}!`)
        .setDescription(`¡Hola ${member}, estamos emocionados de tenerte aquí! 💬`)
        .addFields(
          { name: '📛 Usuario:', value: `**${member.user.tag}**`, inline: true },
          { name: '📅 Cuenta creada:', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Se unió el:', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
          { name: '🕒 Antigüedad:', value: `\`${Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24))}\` días`, inline: true },
          { name: '👥 Total miembros:', value: `**${guild.memberCount}**`, inline: true },
          { name: '🔢 Miembros hoy:', value: `**${data.count}**`, inline: true },
          { name: '📜 Reglas:', value: `No olvides leer las reglas en <#1469950357785546853>`, inline: false }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setImage("https://i.imgur.com/Tu7vI7h.png") // Imagen banner opcional
        .setFooter({ text: `710 Shop • Eres el miembro #${guild.memberCount}`, iconURL: member.user.displayAvatarURL({dynamic: true}) })
        .setTimestamp();

      // Botones opcionales para que se vea más profesional
      const row = new MessageActionRow().addComponents(
          new MessageButton().setLabel('Tienda').setStyle('LINK').setURL('https://discord.com/channels/1469618754282586154/1469945642909438114'),
          new MessageButton().setLabel('Soporte').setStyle('LINK').setURL('https://discord.com/channels/1469618754282586154/1469621686155346042')
      );

      await welcomeChannel.send({
        content: `👋 **¡Bienvenido ${member}!**`,
        embeds: [embedwelcome],
        components: [row]
      }).catch(err => console.error('Error enviando bienvenida:', err));
    }
  });
};