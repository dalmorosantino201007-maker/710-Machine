const Discord = require("discord.js");
const config = require('../DataBaseJson/config.json');

module.exports = (client) => {
  console.log('Módulo messageCreate.js cargado para v13.');

  // Mapa para controlar cooldowns por usuario y canal
  const mensajesEnviados = new Map();

  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    const guild = message.guild;

    // --- 1. LÓGICA DE REACCIONES AUTOMÁTICAS ---
    const targetChannelId = '1333392708554985526';
    if (message.channel.id === targetChannelId) {
      const firstEmoji = guild.emojis.cache.find(e => e.name === 'blackverify');
      const secondEmoji = guild.emojis.cache.find(e => e.name === 'rayo');

      if (firstEmoji) await message.react(firstEmoji).catch(() => null);
      if (secondEmoji) await message.react(secondEmoji).catch(() => null);
    }

    // --- 2. VERIFICACIÓN DE ROL DEL STAFF ---
    const requiredRoleId = '1469967630365622403';
    const hasRole = message.member.roles.cache.has(requiredRoleId);

    // --- 3. MENCIÓN AL BOT ---
    const mencoes = [`<@${client.user.id}>`, `<@!${client.user.id}>`];
    if (mencoes.includes(message.content.trim())) {
      const embed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`${message.author}, ¡Gracias por mencionar al bot! ¿En qué puedo ayudarte?`);
      
      return message.reply({ embeds: [embed] });
    }

    // --- 4. COMANDO !customer ---
    if (message.content.startsWith('!customer')) {
      if (!hasRole) return message.reply('No tienes permiso para usar este comando.');

      const targetMember = message.mentions.members.first();
      if (!targetMember) return message.reply('Por favor, menciona al usuario.');

      try {
        const newNickname = `Customer | ${targetMember.user.username}`;
        await targetMember.setNickname(newNickname).catch(() => null);
        
        const roleToAdd = guild.roles.cache.get('1333390401502969931');
        if (roleToAdd) await targetMember.roles.add(roleToAdd);
        
        return message.reply(`✅ | Customer seteado exitosamente.`);
      } catch (e) {
        return message.reply(`❌ | Hubo un error al procesar el customer.`);
      }
    }

    // --- 5. COMANDO !rename ---
    if (message.content.startsWith('!rename')) {
      if (!hasRole) return message.reply('No tienes permiso.');
      const newName = message.content.split(' ').slice(1).join(' ');
      if (!newName) return message.reply('Nombre faltante.');

      await message.channel.setName(newName);
      const embed = new Discord.MessageEmbed()
        .setColor(config.colorpredeterminado)
        .setTitle(`✏️ Canal Renombrado`)
        .setDescription(`El canal ahora es: **\`${newName}\`**`);
      
      return message.reply({ embeds: [embed] });
    }

    // --- 6. COMANDO !reglas / !verification / !payments (ADMINS) ---
    if (['!reglas', '!verification', '!payments'].includes(message.content)) {
      if (!message.member.permissions.has("ADMINISTRATOR")) {
        return message.reply('❌ Solo administradores.');
      }

      const embed = new Discord.MessageEmbed().setColor(config.colorpredeterminado);
      const row = new Discord.MessageActionRow();

      if (message.content === '!reglas') {
        embed.setTitle('Términos y Condiciones - Host')
             .setDescription('**🇪🇸 Español**\nLos T&C describen tus responsabilidades...\n\n**🇺🇸 English**\nThe T&C outline your responsibilities...');
        row.addComponents(
          new Discord.MessageButton().setStyle('LINK').setEmoji('🇪🇸').setURL('https://docs.google.com/...'),
          new Discord.MessageButton().setStyle('LINK').setEmoji('🇺🇸').setURL('https://docs.google.com/...')
        );
      }

      if (message.content === '!verification') {
        embed.setTitle('Verification - Host')
             .setDescription('**🇪🇸 Español**\nHaz clic abajo para verificarte.\n\n**🇺🇸 English**\nClick below to verify.')
             .setFooter(`Host | Verification`, guild.iconURL());
        row.addComponents(
          new Discord.MessageButton().setStyle('LINK').setLabel('Verify').setURL('https://discord.com/oauth2/...')
        );
      }

      if (message.content === '!payments') {
        embed.setTitle('**__Métodos de Pago__**')
             .setDescription('**🇪🇸 Comisión por envío...\n\n🇺🇸 Fee for remittance...**\n\n<:mp:1364463939617951795> Mercado Pago\n<:belo:1404660470656405524> Belo\n<:binance:1403109740573233174> Binance');
        return message.channel.send({ embeds: [embed] });
      }

      return message.channel.send({ embeds: [embed], components: [row] });
    }

    // --- 7. AUTO-RESPUESTA EN TICKETS ---
    if (message.channel.name.startsWith("🛒・buyasd-")) {
      const rolRestringido = "1341948975024046090";
      if (message.member.roles.cache.has(rolRestringido)) return;

      const contenido = message.content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const canalID = message.channel.id;
      const uid = message.author.id;

      // Lógica simplificada de respuestas únicas
      if (/(hola|buenas|hello)/i.test(contenido) && !mensajesEnviados.has(`s_${uid}_${canalID}`)) {
        mensajesEnviados.set(`s_${uid}_${canalID}`, true);
        return message.reply(`👋 ¡Hola! Escribe el nombre del producto que te interesa.`);
      }

      if (/(mercado pago|mp)/i.test(contenido) && !mensajesEnviados.has(`mp_${uid}_${canalID}`)) {
        mensajesEnviados.set(`mp_${uid}_${canalID}`, true);
        const embedMP = new Discord.MessageEmbed()
          .setTitle("**__Mercado Pago__**")
          .setColor(config.colorpredeterminado)
          .setThumbnail("https://media.discordapp.net/attachments/1089761197722710116/1194005532646846576/4757-mercadopago.png")
          .setDescription(`**CVU:** \`0000003100072461415651\`\n**Alias:** \`710shop\`\n**Titular:** Santino Dal Moro`);
        
        const buttons = new Discord.MessageActionRow().addComponents(
          new Discord.MessageButton().setCustomId("copiar_cvu").setLabel("Copiar CVU").setStyle("PRIMARY"),
          new Discord.MessageButton().setCustomId("copiar_alias").setLabel("Copiar ALIAS").setStyle("SECONDARY")
        );

        return message.channel.send({ embeds: [embedMP], components: [buttons] });
      }
    }
  });
};