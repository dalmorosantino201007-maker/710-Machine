require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const cron = require('node-cron'); // NUEVO: Para reinicio automático
const transcripts = require('discord-html-transcripts'); 
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS", "DIRECT_MESSAGES"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

// --- 🛠️ SISTEMA DE CONTADOR (AGREGADO) ---
const contadorPath = './DataBaseJson/contador.json';
if (!fs.existsSync(contadorPath)) {
    fs.writeFileSync(contadorPath, JSON.stringify({ count: 0 }, null, 2));
}

// Reinicio automático a las 00:00
cron.schedule('0 0 * * *', () => {
    fs.writeFileSync(contadorPath, JSON.stringify({ count: 0 }, null, 2));
    console.log("✅ Contador diario reiniciado.");
}, { timezone: "America/Argentina/Buenos_Aires" }); // Cambia a tu zona horaria si es necesario

client.slashCommands = new Collection();
require('./handler')(client);

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalLogsId = "1470928427199631412"; 
const canalTranscriptsId = "1473454832567320768"; 
const canalReviewsId = "1475613791252119684";     

const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- IMPORTAR BIENVENIDAS ---
const welcomePath = path.join(__dirname, 'Events', 'welcome.js');
if (fs.existsSync(welcomePath)) {
    require('./Events/welcome')(client);
    console.log("✅ welcome.js cargado correctamente desde /Events/");
} else {
    console.log("⚠️ No se encontró welcome.js en ./Events/welcome.js");
}

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// ==========================================
// 🕹️ LÓGICA DE INTERACCIONES
// ==========================================

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    if (interaction.isSelectMenu() && interaction.customId === "calificar_staff") {
        const nota = interaction.values[0];
        const estrellas = "⭐".repeat(parseInt(nota));
        const embedReview = new MessageEmbed()
            .setTitle("🌟 Nueva Calificación de Usuario")
            .setColor("YELLOW")
            .addFields(
                { name: "Usuario", value: `${interaction.user.tag}`, inline: true },
                { name: "Puntuación", value: `${nota}/5 ${estrellas}`, inline: true }
            )
            .setTimestamp();
        const canalReviews = interaction.guild ? interaction.guild.channels.cache.get(canalReviewsId) : client.channels.cache.get(canalReviewsId);
        if (canalReviews) canalReviews.send({ embeds: [embedReview] });
        return interaction.reply({ content: `✅ ¡Gracias! Has calificado el servicio con ${nota} estrellas.`, ephemeral: true });
    }

    if (interaction.isButton()) {
        const { customId, member, user, channel, guild } = interaction;
        if (customId === "copiar_cvu") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias") return interaction.reply({ content: "710shop", ephemeral: true });

        if (customId === "partner_rol") {
            const rolId = "1470862847671140412"; 
            const rol = guild.roles.cache.get(rolId);
            if (!rol) return interaction.reply({ content: "❌ Error: El rol de Partner no existe.", ephemeral: true });
            try {
                if (member.roles.cache.has(rolId)) {
                    await member.roles.remove(rolId);
                    return interaction.reply({ content: "✅ Se te ha quitado el rol de **Partner**.", ephemeral: true });
                } else {
                    await member.roles.add(rolId);
                    return interaction.reply({ content: "✅ ¡Verificado! Ahora tienes el rol de **Partner**.", ephemeral: true });
                }
            } catch (error) {
                return interaction.reply({ content: "❌ Error de permisos.", ephemeral: true });
            }
        }

        if (customId === "asumir") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            await channel.setName(`atendido-${user.username}`).catch(() => {});
            enviarLog(new MessageEmbed().setTitle("📌 Ticket Asumido").setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel}`).setColor("PURPLE").setTimestamp());
        }

        if (customId === "notificar") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            return interaction.reply({ content: `🔔 ${user} ha enviado una notificación de atención.` });
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            await interaction.reply({ content: "⏳ Generando transcripción...", ephemeral: true });
            try {
                const ticketOwnerPerms = channel.permissionOverwrites.cache.find(p => p.type === 'member' && p.id !== client.user.id);
                const attachment = await transcripts.createTranscript(channel, { limit: -1, fileName: `transcript-${channel.name}.html`, poweredBy: false });
                const canalTrans = guild.channels.cache.get(canalTranscriptsId);
                if (canalTrans) {
                    const logEmbed = new MessageEmbed().setTitle("📄 Transcripción").setColor("#2f3136").addFields({ name: "Dueño", value: ticketOwnerPerms ? `<@${ticketOwnerPerms.id}>` : "Desconocido" }).setTimestamp();
                    await canalTrans.send({ embeds: [logEmbed], files: [attachment] });
                }
                setTimeout(() => channel.delete().catch(() => {}), 5000);
            } catch (error) { console.error(error); }
        }

        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_prod').setLabel("¿Que deseas comprar?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_metodo').setLabel("¿Que metodos de pagos usaras?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_cant').setLabel("¿Cantidad que deseas comprar?").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }
        if (customId === "ticket_soporte") {
            const modal = new Modal().setCustomId('modal_soporte').setTitle('Centro de Soporte');
            modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_duda').setLabel("¿En que necesitas Ayuda?").setStyle('PARAGRAPH').setRequired(true)));
            return await interaction.showModal(modal);
        }
        if (customId === "ticket_partner") {
            const modal = new Modal().setCustomId('modal_partner').setTitle('Solicitud de Partner');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_add').setLabel("Ya añadiste nuestro add?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_link').setLabel("Manda aqui el link de tu server").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modalanuncio_v2') {
            await interaction.deferReply({ ephemeral: true });
            const titulo = interaction.fields.getTextInputValue('titulo');
            const descripcion = interaction.fields.getTextInputValue('desc');
            const color = interaction.fields.getTextInputValue('cor');
            try {
                const embedPersonalizado = new MessageEmbed().setDescription(descripcion).setColor(color.startsWith('#') ? color : `#${color}`);
                if (titulo) embedPersonalizado.setTitle(titulo);
                await interaction.channel.send({ embeds: [embedPersonalizado] });
                return interaction.editReply({ content: "✅ Embed enviado." });
            } catch (e) { return interaction.editReply({ content: "❌ Error." }); }
        }

        await interaction.deferReply({ ephemeral: true });
        let cateId, tipoTicket, nombreCanal, camposPersonalizados = [];
        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA; tipoTicket = "Compras"; nombreCanal = `🛒-compra-${interaction.user.username}`;
            camposPersonalizados = [{ name: "📦 Producto", value: interaction.fields.getTextInputValue('p_prod'), inline: true }];
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE; tipoTicket = "Soporte"; nombreCanal = `🛠️-soporte-${interaction.user.username}`;
            camposPersonalizados = [{ name: "❓ Ayuda", value: interaction.fields.getTextInputValue('p_duda') }];
        } else if (interaction.customId === 'modal_partner') {
            cateId = CATEGORIAS.PARTNER; tipoTicket = "Partner"; nombreCanal = `🤝-partner-${interaction.user.username}`;
            camposPersonalizados = [{ name: "🔗 Link", value: interaction.fields.getTextInputValue('p_link'), inline: true }];
        }
        try {
            const canal = await interaction.guild.channels.create(nombreCanal, {
                type: 'GUILD_TEXT', parent: cateId,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['VIEW_CHANNEL'] },
                    { id: interaction.user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                    { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                ]
            });
            const ticketID = Math.floor(Math.random() * 900000) + 100000;
            const embedTicket = new MessageEmbed().setTitle("SISTEMA DE TICKETS").setColor("#2f3136").setDescription(`¡Bienvenido/a ${interaction.user}!`).addFields({ name: "Categoría", value: tipoTicket, inline: true }, { name: "ID", value: `\`${ticketID}\``, inline: true }).addFields(camposPersonalizados).setTimestamp();
            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅")
            );
            await canal.send({ content: `${interaction.user} | <@&${rolPermitidoId}>`, embeds: [embedTicket], components: [row] });
            await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });
        } catch (e) { console.error(e); }
    }
});

// ==========================================
// 🔥 SISTEMA DE VIGILANCIA (MODIFICADO)
// ==========================================

// --- MENSAJES ---
client.on('messageCreate', m => {
    if (!m.guild || m.author.bot || m.channel.id === canalLogsId) return;
    enviarLog(new MessageEmbed().setAuthor({ name: `Mensaje: ${m.author.tag}`, iconURL: m.author.displayAvatarURL() }).setColor("#2f3136").setDescription(`**Canal:** ${m.channel}\n**Contenido:**\n${m.content || "*[Archivo/Embed]*"}`).setTimestamp());
});

client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("#ff0000").addFields({ name: "Autor", value: `${m.author.tag}`, inline: true }, { name: "Canal", value: `${m.channel}`, inline: true }, { name: "Contenido", value: `\`\`\`${m.content || "Sin texto"}\`\`\`` }).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("#ffff00").addFields({ name: "Autor", value: `${o.author.tag}`, inline: true }, { name: "Antes", value: `\`\`\`${o.content}\`\`\`` }, { name: "Después", value: `\`\`\`${n.content}\`\`\`` }).setTimestamp());
});

// --- CANALES (NUEVO) ---
client.on('channelCreate', c => {
    enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setColor("GREEN").setDescription(`**Nombre:** ${c.name}\n**Tipo:** ${c.type}`).setTimestamp());
});
client.on('channelDelete', c => {
    enviarLog(new MessageEmbed().setTitle("🛑 Canal Eliminado").setColor("RED").setDescription(`**Nombre:** ${c.name}`).setTimestamp());
});
client.on('channelUpdate', (o, n) => {
    if (o.name !== n.name) {
        enviarLog(new MessageEmbed().setTitle("📝 Canal Renombrado").setColor("BLUE").setDescription(`**Antes:** ${o.name}\n**Después:** ${n.name}`).setTimestamp());
    }
});

// --- ROLES (NUEVO) ---
client.on('roleCreate', r => {
    enviarLog(new MessageEmbed().setTitle("🆕 Rol Creado").setColor("GREEN").setDescription(`**Nombre:** ${r.name}`).setTimestamp());
});
client.on('roleDelete', r => {
    enviarLog(new MessageEmbed().setTitle("🛑 Rol Eliminado").setColor("RED").setDescription(`**Nombre:** ${r.name}`).setTimestamp());
});
client.on('guildMemberUpdate', (o, n) => {
    const addedRoles = n.roles.cache.filter(r => !o.roles.cache.has(r.id));
    const removedRoles = o.roles.cache.filter(r => !n.roles.cache.has(r.id));
    if (addedRoles.size > 0) {
        enviarLog(new MessageEmbed().setTitle("➕ Rol Añadido").setColor("GREEN").setDescription(`**Usuario:** ${n.user.tag}\n**Rol:** ${addedRoles.map(r => r.name).join(', ')}`).setTimestamp());
    }
    if (removedRoles.size > 0) {
        enviarLog(new MessageEmbed().setTitle("➖ Rol Quitado").setColor("ORANGE").setDescription(`**Usuario:** ${n.user.tag}\n**Rol:** ${removedRoles.map(r => r.name).join(', ')}`).setTimestamp());
    }
});

// --- VOZ (NUEVO) ---
client.on('voiceStateUpdate', (o, n) => {
    if (!o.channelId && n.channelId) {
        enviarLog(new MessageEmbed().setTitle("🎙️ Conexión de Voz").setColor("GREEN").setDescription(`**${n.member.user.tag}** se unió a ${n.channel.name}`).setTimestamp());
    } else if (o.channelId && !n.channelId) {
        enviarLog(new MessageEmbed().setTitle("🎙️ Desconexión de Voz").setColor("RED").setDescription(`**${o.member.user.tag}** salió de ${o.channel.name}`).setTimestamp());
    }
});

// --- MIEMBROS Y CONTADOR ---
client.on('guildMemberAdd', m => {
    const data = JSON.parse(fs.readFileSync(contadorPath, 'utf8'));
    data.count += 1;
    fs.writeFileSync(contadorPath, JSON.stringify(data, null, 2));
    enviarLog(new MessageEmbed().setTitle("📥 Miembro Nuevo").setColor("#00ff00").setDescription(`**${m.user.tag}** entró al servidor.`).setTimestamp());
});

client.on('guildMemberRemove', m => {
    enviarLog(new MessageEmbed().setTitle("📤 Miembro Salió").setColor("#ff4500").setDescription(`**${m.user.tag}** abandonó el servidor.`).setTimestamp());
});

client.on('ready', async () => { 
    console.log(`🔥 ${client.user.username} - VIGILANCIA Y TICKETS ACTIVADOS`); 
    const canalLogs = client.channels.cache.get(canalLogsId);
    if (canalLogs) canalLogs.send({ content: "710 Bot se ha iniciado correctamente 🔥" }).catch(() => {});
});

client.login(process.env.TOKEN || config.token);