require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const cron = require('node-cron');
const transcripts = require('discord-html-transcripts'); 
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS", "DIRECT_MESSAGES"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

// --- 🛠️ SISTEMA DE CONTADOR ---
const contadorPath = './DataBaseJson/contador.json';
if (!fs.existsSync(contadorPath)) {
    fs.writeFileSync(contadorPath, JSON.stringify({ count: 0 }, null, 2));
}

cron.schedule('0 0 * * *', () => {
    fs.writeFileSync(contadorPath, JSON.stringify({ count: 0 }, null, 2));
    console.log("✅ Contador diario reiniciado.");
}, { timezone: "America/Argentina/Buenos_Aires" });

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
    console.log("✅ welcome.js cargado correctamente");
}

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// ==========================================
// 🕹️ LÓGICA DE INTERACCIONES (TICKETS)
// ==========================================

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    if (interaction.isSelectMenu() && interaction.customId.startsWith("calificar_staff_")) {
        const staffId = interaction.customId.split('_')[2];
        const nota = interaction.values[0];
        const estrellas = "⭐".repeat(parseInt(nota));
        const embedReview = new MessageEmbed()
            .setAuthor({ name: 'Host | Machine', iconURL: client.user.displayAvatarURL() })
            .setTitle("🌟 Nueva Calificación de Servicio")
            .setColor("GOLD")
            .addFields(
                { name: "👤 Usuario", value: `${interaction.user.tag}`, inline: true },
                { name: "👷 Staff Evaluado", value: `<@${staffId}>`, inline: true },
                { name: "📊 Puntuación", value: `${estrellas} (${nota}/5)`, inline: false }
            )
            .setTimestamp();
        const canalReviews = client.channels.cache.get(canalReviewsId);
        if (canalReviews) canalReviews.send({ embeds: [embedReview] });
        return interaction.reply({ content: `✅ ¡Gracias! Has calificado la atención con ${nota} estrellas.`, ephemeral: true });
    }

    if (interaction.isButton()) {
        const { customId, member, user, channel } = interaction;
        if (customId === "copiar_cvu") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias") return interaction.reply({ content: "710shop", ephemeral: true });

        if (customId === "asumir") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            await channel.setName(`atendido-${user.username}`).catch(() => {});
            enviarLog(new MessageEmbed().setTitle("📌 Ticket Asumido").setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel}`).setColor("PURPLE").setTimestamp());
        }

        // --- FUNCIÓN NOTIFICAR ---
        if (customId === "notificar") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            
            // Buscamos al usuario que tiene permisos de ver el canal (que no sea bot ni staff)
            const targetId = channel.permissionOverwrites.cache.filter(p => p.type === 'member' && p.id !== client.user.id).first()?.id;
            
            if (targetId) {
                return interaction.reply({ content: `🔔 <@${targetId}>, el Staff está esperando tu respuesta para continuar con el proceso.` });
            } else {
                return interaction.reply({ content: "📢 ¡Atención! El Staff solicita tu presencia en este ticket." });
            }
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            const modalNota = new Modal().setCustomId('modal_nota_cierre').setTitle('Finalizar Ticket');
            const inputNota = new TextInputComponent().setCustomId('nota_staff').setLabel("Deja una nota para el usuario").setPlaceholder("Ej: Gracias por tu compra!").setStyle('PARAGRAPH').setRequired(false);
            modalNota.addComponents(new MessageActionRow().addComponents(inputNota));
            return await interaction.showModal(modalNota);
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
        // --- 🔥 LÓGICA PARA RECIBIR EL MODAL DEL EMBED ---
        if (interaction.customId === 'modal_embed_personalizado') {
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('desc');
            const thumb = interaction.fields.getTextInputValue('thumbnail');
            const banner = interaction.fields.getTextInputValue('banner');
            const color = interaction.fields.getTextInputValue('cor');

            const embedFinal = new MessageEmbed()
                .setDescription(desc)
                .setColor(color.startsWith('#') ? color : `#${color}`);

            if (titulo) embedFinal.setTitle(titulo);
            if (thumb && thumb.startsWith('http')) embedFinal.setThumbnail(thumb);
            if (banner && banner.startsWith('http')) embedFinal.setImage(banner);

            // BOTÓN DE COMPRA (He puesto el link de tu canal de compras según tus IDs anteriores)
            const rowCompra = new MessageActionRow().addComponents(
                new MessageButton()
                    .setLabel('🛒 Compra Aqui / Buy Here')
                    .setStyle('LINK')
                    .setURL('https://discord.com/channels/1469595804598501396/1469941913703350352') 
            );

            await interaction.channel.send({ embeds: [embedFinal], components: [rowCompra] });
            return interaction.reply({ content: "✅ Embed enviado correctamente.", ephemeral: true });
        }

        if (interaction.customId === 'modal_nota_cierre') {
            await interaction.deferReply({ ephemeral: true });
            const notaStaff = interaction.fields.getTextInputValue('nota_staff') || "No se proporcionaron notas adicionales.";
            const { channel, user, guild } = interaction;
            try {
                const targetId = channel.permissionOverwrites.cache.filter(p => p.type === 'member' && p.id !== client.user.id).first()?.id;
                const targetUser = targetId ? await client.users.fetch(targetId) : null;
                const attachment = await transcripts.createTranscript(channel, { limit: -1, fileName: `transcript-${channel.name}.html`, poweredBy: false });

                if (targetUser) {
                    const embedInfo = new MessageEmbed()
                        .setAuthor({ name: 'Host | Machine', iconURL: client.user.displayAvatarURL() })
                        .setTitle(`📑 Ticket Cerrado`)
                        .setColor("#2f3136")
                        .setDescription("Este ticket ha sido cerrado correctamente y su transcripción fue enviada.")
                        .addFields(
                            { name: "👤 Ticket Abierto Por", value: `<@${targetUser.id}>`, inline: true },
                            { name: "🛠️ Ticket Cerrado Por", value: `<@${user.id}>`, inline: true },
                            { name: "🕒 Fecha de cierre", value: `\`${moment().format('dddd, D [de] MMMM [de] YYYY, HH:mm')}\``, inline: true },
                            { name: "📄 Nota", value: `\`\`\`${notaStaff}\`\`\`` }
                        )
                        .setFooter({ text: 'Host | Sistema de Tickets', iconURL: client.user.displayAvatarURL() });

                    const embedEncuesta = new MessageEmbed()
                        .setAuthor({ name: 'Host | Machine', iconURL: client.user.displayAvatarURL() })
                        .setTitle("📝 Encuesta de Satisfacción - Soporte Automático")
                        .setColor("#2f3136")
                        .setDescription(`Tu ticket fue cerrado correctamente. Agradecemos tu tiempo, por favor califica tu experiencia.`)
                        .addFields(
                            { name: "🎫 Ticket", value: `\`${channel.name}\``, inline: true },
                            { name: "📁 Canal", value: `\`#${channel.name}\``, inline: true },
                            { name: "👷 Staff", value: `<@${user.id}>`, inline: true }
                        )
                        .setFooter({ text: 'Host | Sistema de Tickets', iconURL: client.user.displayAvatarURL() });

                    const rowEncuesta = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId(`calificar_staff_${user.id}`)
                            .setPlaceholder('Selecciona tu calificación (1-5)')
                            .addOptions([
                                { label: '5 Estrellas', value: '5', emoji: '⭐' },
                                { label: '4 Estrellas', value: '4', emoji: '⭐' },
                                { label: '3 Estrellas', value: '3', emoji: '⭐' },
                                { label: '2 Estrellas', value: '2', emoji: '⭐' },
                                { label: '1 Estrella', value: '1', emoji: '⭐' }
                            ])
                    );

                    await targetUser.send({ 
                        content: `Tu ticket (\`${channel.name}\`) ha sido cerrado. Aquí tienes la transcripción:`, 
                        embeds: [embedInfo, embedEncuesta], 
                        files: [attachment], 
                        components: [rowEncuesta] 
                    }).catch(() => {});
                }

                const canalTrans = guild.channels.cache.get(canalTranscriptsId);
                if (canalTrans) await canalTrans.send({ content: `Transcripción: **${channel.name}**`, files: [attachment] });

                await interaction.editReply("✅ Ticket finalizado y reporte enviado al usuario.");
                setTimeout(() => channel.delete().catch(() => {}), 3000);
            } catch (e) { console.error(e); }
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        let cateId, tipoTicket, nombreCanal, camposExtra = [];
        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA; tipoTicket = "Compra"; nombreCanal = `🛒-buy-${interaction.user.username}`;
            camposExtra = [
                { name: '📦 Producto', value: `\`${interaction.fields.getTextInputValue('p_prod')}\``, inline: true },
                { name: '💳 Método', value: `\`${interaction.fields.getTextInputValue('p_metodo')}\``, inline: true }
            ];
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE; tipoTicket = "Soporte"; nombreCanal = `🛠️-soporte-${interaction.user.username}`;
            camposExtra = [{ name: '❓ Ayuda', value: `\`${interaction.fields.getTextInputValue('p_duda')}\``, inline: false }];
        } else if (interaction.customId === 'modal_partner') {
            cateId = CATEGORIAS.PARTNER; tipoTicket = "Partner"; nombreCanal = `🤝-partner-${interaction.user.username}`;
            camposExtra = [{ name: '🔗 Link', value: `\`${interaction.fields.getTextInputValue('p_link')}\``, inline: false }];
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

            const ticketID = Math.floor(Math.random() * 9000000000) + 1000000000;
            const embedTicket = new MessageEmbed()
                .setColor('#3b5998')
                .setAuthor({ name: '710 Bot Shop', iconURL: interaction.guild.iconURL() })
                .setTitle('SISTEMA DE TICKETS')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(`¡Bienvenido/a ${interaction.user}! El Staff te atenderá pronto. Por favor, danos los detalles necesarios.`)
                .addFields(
                    { name: 'Categoría', value: `\`${tipoTicket}\``, inline: true },
                    { name: 'ID del Ticket', value: `\`${ticketID}\``, inline: true },
                    { name: 'Fecha', value: `\`${moment().format('D/MM/YYYY HH:mm')}\``, inline: true },
                    { name: 'Usuario', value: `\`${interaction.user.username}\` (${interaction.user.id})`, inline: false }
                )
                .addFields(camposExtra)
                .setFooter({ text: '710 Shop - Gestión de Tickets' })
                .setTimestamp();

            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                new MessageButton().setCustomId("notificar").setLabel("Notificar").setStyle("SECONDARY").setEmoji("📢")
            );

            await canal.send({ content: `${interaction.user} | <@&${rolPermitidoId}> Staff 👥`, embeds: [embedTicket], components: [row] });
            await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });
            enviarLog(new MessageEmbed().setTitle("🎫 Ticket Creado").setColor("BLUE").setDescription(`**Usuario:** ${interaction.user.tag}\n**Canal:** ${canal}\n**Tipo:** ${tipoTicket}`).setTimestamp());
        } catch (e) { console.error(e); }
    }
});

// ==========================================
// 🔥 SISTEMA DE VIGILANCIA (FULL LOGS)
// ==========================================

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

client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setColor("GREEN").setDescription(`**Nombre:** ${c.name}\n**Tipo:** ${c.type}`).setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🗑️ Canal Eliminado").setColor("RED").setDescription(`**Nombre:** ${c.name}`).setTimestamp()));
client.on('channelUpdate', (o, n) => {
    if (o.name !== n.name) enviarLog(new MessageEmbed().setTitle("✏️ Canal Editado (Nombre)").setColor("ORANGE").setDescription(`**Antes:** ${o.name}\n**Después:** ${n.name}`).setTimestamp());
});

client.on('roleCreate', r => enviarLog(new MessageEmbed().setTitle("🆕 Rol Creado").setColor("GREEN").setDescription(`**Rol:** ${r.name}\n**ID:** ${r.id}`).setTimestamp()));
client.on('roleDelete', r => enviarLog(new MessageEmbed().setTitle("🗑️ Rol Eliminado").setColor("RED").setDescription(`**Rol:** ${r.name}`).setTimestamp()));
client.on('roleUpdate', (o, n) => {
    if (o.name !== n.name) enviarLog(new MessageEmbed().setTitle("✏️ Rol Editado").setColor("ORANGE").setDescription(`**Antes:** ${o.name}\n**Después:** ${n.name}`).setTimestamp());
});

client.on('guildMemberUpdate', (o, n) => {
    const addedRoles = n.roles.cache.filter(r => !o.roles.cache.has(r.id));
    const removedRoles = o.roles.cache.filter(r => !n.roles.cache.has(r.id));
    if (addedRoles.size > 0) addedRoles.forEach(r => enviarLog(new MessageEmbed().setTitle("➕ Rol Agregado").setColor("BLUE").setDescription(`**Usuario:** ${n.user.tag}\n**Rol:** ${r.name}`).setTimestamp()));
    if (removedRoles.size > 0) removedRoles.forEach(r => enviarLog(new MessageEmbed().setTitle("➖ Rol Quitado").setColor("PURPLE").setDescription(`**Usuario:** ${n.user.tag}\n**Rol:** ${r.name}`).setTimestamp()));
});

client.on('guildMemberAdd', m => {
    const data = JSON.parse(fs.readFileSync(contadorPath, 'utf8'));
    data.count += 1;
    fs.writeFileSync(contadorPath, JSON.stringify(data, null, 2));
    enviarLog(new MessageEmbed().setTitle("📥 Miembro Nuevo").setColor("#00ff00").setDescription(`**${m.user.tag}** entró al servidor.`).setTimestamp());
});

client.on('guildMemberRemove', m => {
    enviarLog(new MessageEmbed().setTitle("📤 Miembro Salió").setColor("#ff0000").setDescription(`**${m.user.tag}** abandonó el servidor.`).setTimestamp());
});

// --- 🚀 EVENTO READY (INICIO) ---
client.on('ready', async () => { 
    console.log(`🔥 ${client.user.username} - VIGILANCIA TOTAL ACTIVADA`); 
    
    // Mensaje de Encendido en Logs
    const embedReady = new MessageEmbed()
        .setTitle("✅ Bot Encendido Correctamente")
        .setColor("GREEN")
        .setDescription(`El bot **${client.user.tag}** ya está operativo.`)
        .addFields(
            { name: "📡 Estado", value: "En línea", inline: true },
            { name: "⏰ Hora", value: moment().format('HH:mm:ss'), inline: true }
        )
        .setTimestamp();
    
    enviarLog(embedReady);
});

client.login(process.env.TOKEN || config.token);