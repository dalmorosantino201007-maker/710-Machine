require('dotenv').config(); 
// Nueva forma de importar Mercado Pago (SDK v2)
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configuración del cliente de Mercado Pago
const clientMP = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN_MP 
});

const { 
    Client, 
    Collection, 
    MessageEmbed, 
    MessageActionRow, 
    MessageButton, 
    Modal, 
    TextInputComponent, 
    MessageSelectMenu 
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const cron = require('node-cron');
const transcripts = require('discord-html-transcripts'); 
const otplib = require('otplib'); 

// Carga de configuración
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

// --- 🏆 SISTEMA DE RANKING STAFF (NUEVO) ---
const rankingPath = './DataBaseJson/ranking.json';
if (!fs.existsSync(rankingPath)) {
    fs.writeFileSync(rankingPath, JSON.stringify({}, null, 2));
}

function updateRanking(userId, userTag) {
    let ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
    if (!ranking[userId]) {
        ranking[userId] = { tag: userTag, tickets: 0 };
    }
    ranking[userId].tickets += 1;
    ranking[userId].tag = userTag; // Mantener tag actualizado
    fs.writeFileSync(rankingPath, JSON.stringify(ranking, null, 2));
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
const rolAdminReenvio = "1469618981781373042"; // Rol para /renvembed

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
// 🕹️ LÓGICA DE INTERACCIONES (TICKETS Y COMANDOS)
// ==========================================

client.on('interactionCreate', async (interaction) => {
    // --- LÓGICA DE COMANDOS ---
    if (interaction.isCommand()) {
        if (interaction.commandName === "renvembed") {
            if (!interaction.member.roles.cache.has(rolAdminReenvio)) {
                return interaction.reply({ content: "❌ No tienes el rango necesario para usar este comando.", ephemeral: true });
            }

            const mensajes = await interaction.channel.messages.fetch({ limit: 50 });
            const ultimoEmbed = mensajes.find(m => m.author.id === client.user.id && m.embeds.length > 0);

            if (!ultimoEmbed) {
                return interaction.reply({ content: "❌ No se encontró ningún embed reciente enviado por el bot.", ephemeral: true });
            }

            try {
                await interaction.channel.send({
                    embeds: ultimoEmbed.embeds,
                    components: ultimoEmbed.components
                });
                await ultimoEmbed.delete().catch(() => {});
                return interaction.reply({ content: "✅ Embed reenviado y anterior eliminado.", ephemeral: true });
            } catch (error) {
                return interaction.reply({ content: "❌ Error al intentar reenviar el embed.", ephemeral: true });
            }
        }

        // --- NUEVO: COMANDO /CLEARPANEL ---
        if (interaction.commandName === "clearpanel") {
            const embedClear = new MessageEmbed()
                .setTitle("🧹 Limpieza de Mensajes Directos")
                .setColor("#f39c12")
                .setDescription("¿Quieres limpiar todos los mensajes del bot en tus DMs?\n\n⚠️ **IMPORTANTE:** El bot solo puede borrar sus propios mensajes, no los tuyos.")
                .addFields({ name: "Acción", value: "Presiona el botón de abajo para empezar la limpieza automática." })
                .setFooter({ text: " 710 | Machine Services" });

            const rowClear = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("limpiar_dm_proceso")
                    .setLabel("Limpiar DM")
                    .setStyle("DANGER")
                    .setEmoji("🧹")
            );

            return interaction.reply({ embeds: [embedClear], components: [rowClear] });
        }

        // --- NUEVO: COMANDO /COMANDLIST ---
        if (interaction.commandName === "comandlist") {
            const embedList = new MessageEmbed()
                .setTitle("📜 Lista de Comandos - 710 | Machine")
                .setColor("#2f3136")
                .setDescription("Aquí tienes la lista completa de comandos y sus permisos:")
                .addFields(
                    { name: "`/renvembed`", value: `Reenvía el último mensaje del bot.\nPermiso: <@&${rolAdminReenvio}>`, inline: false },
                    { name: "`/clearpanel`", value: "Abre el panel de limpieza de DM.\nPermiso: `@everyone`", inline: false },
                    { name: "`/comandlist`", value: "Muestra esta lista de ayuda.\nPermiso: `@everyone`", inline: false },
                    { name: "`/rankingstaff`", value: "Muestra el top de Staff con más tickets asumidos.\nPermiso: `@everyone` Explorar", inline: false }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embedList], ephemeral: true });
        }

        // --- NUEVO: COMANDO /RANKINGSTAFF ---
        if (interaction.commandName === "rankingstaff") {
            const ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
            const sorted = Object.entries(ranking)
                .sort(([, a], [, b]) => b.tickets - a.tickets)
                .slice(0, 10);

            if (sorted.length === 0) {
                return interaction.reply({ content: "📭 Aún no hay registros en el ranking.", ephemeral: true });
            }

            const description = sorted.map(([id, data], index) => {
                return `**${index + 1}.** <@${id}> — \`${data.tickets}\` tickets`;
            }).join('\n');

            const embedRank = new MessageEmbed()
                .setTitle("🏆 Ranking de Staff - Tickets Asumidos")
                .setColor("GOLD")
                .setDescription(description)
                .setTimestamp()
                .setFooter({ text: "710 | Machine Ranking" });

            return interaction.reply({ embeds: [embedRank] });
        }

        // --- NUEVO: COMANDO /RANKINGRESET ---
        if (interaction.commandName === "rankingreset") {
            if (!interaction.member.roles.cache.has(rolAdminReenvio)) {
                return interaction.reply({ content: "❌ No tienes el rango necesario para resetear el ranking.", ephemeral: true });
            }
            fs.writeFileSync(rankingPath, JSON.stringify({}, null, 2));
            return interaction.reply({ content: "✅ El ranking de Staff ha sido reseteado a 0 correctamente." });
        }

        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    // --- LÓGICA DE MENÚS ---
    if (interaction.isSelectMenu() && interaction.customId.startsWith("calificar_staff_")) {
        const staffId = interaction.customId.split('_')[2];
        const nota = interaction.values[0];
        const estrellas = "⭐".repeat(parseInt(nota));
        const embedReview = new MessageEmbed()
            .setAuthor({ name: '710 | Machine', iconURL: client.user.displayAvatarURL() })
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

    // --- LÓGICA DE BOTONES ---
    if (interaction.isButton()) {
        const { customId, member, user, channel } = interaction;
        
// --- LÓGICA DE MERCADO PAGO (Versión Nueva SDK v2) ---
// --- LÓGICA DE PAGO MANUAL (REEMPLAZO DE QR) ---
if (interaction.customId === "boton_pago_mp") {
    // No usamos deferReply aquí para evitar el error de "Interaction already acknowledged"
    
    const embedPago = new MessageEmbed()
        .setTitle("💳 Información de Pago - Mercado Pago")
        .setDescription("Mercado Pago es uno de nuestros métodos de pago, a continuación se le otorgará los datos para enviar el dinero.")
        .addFields(
            { name: "• CVU:", value: "```0000003100072461415651```", inline: false },
            { name: "• Alias:", value: "```710shop```", inline: false },
            { name: "¿Cuál es el titular del CVU?", value: "\u200B", inline: false },
            { name: "• Titular:", value: "```Santino Bautista Dal Moro Urbani```", inline: false },
            { name: "• Banco:", value: "```Mercado Pago```", inline: false }
        )
        .setFooter({ text: "Una vez enviado el dinero, recordá enviar comprobante, esto nos ayudará a comprobar tu pago de manera más rápida.", iconURL: client.user.displayAvatarURL() })
        .setColor("#009EE3")
        .setTimestamp();

    return await interaction.reply({ embeds: [embedPago], ephemeral: false });
}

        // --- NUEVO: LÓGICA DE LIMPIEZA DE DM ---
        if (customId === "limpiar_dm_proceso") {
            await interaction.reply({ content: "⏳ Iniciando limpieza de mis mensajes en tus DMs...", ephemeral: true });
            try {
                const dmChannel = await user.createDM();
                const mensajes = await dmChannel.messages.fetch({ limit: 100 });
                const mensajesBot = mensajes.filter(m => m.author.id === client.user.id);
                
                if (mensajesBot.size === 0) return interaction.editReply({ content: "✅ No encontré mensajes míos para borrar." });

                for (const msg of mensajesBot.values()) {
                    await msg.delete().catch(() => {});
                }
                return interaction.editReply({ content: `✅ Limpieza completada. Se han eliminado ${mensajesBot.size} mensajes.` });
            } catch (error) {
                return interaction.editReply({ content: "❌ No pude acceder a tus DMs. Asegúrate de tenerlos abiertos para miembros del servidor." });
            }
        }

        // --- LÓGICA 2FA (BOTÓN) ---
        if (customId === "ingresar_clave_2fa") {
            const modal2fa = new Modal().setCustomId('modal_generar_2fa').setTitle('Generador de Código 2FA');
            const inputClave = new TextInputComponent()
                .setCustomId('clave_secreta')
                .setLabel("Introduce tu Clave Secreta (Secret Key)")
                .setPlaceholder("Ej: JBSWY3DPEHPK3PXP")
                .setStyle('SHORT')
                .setRequired(true);
            modal2fa.addComponents(new MessageActionRow().addComponents(inputClave));
            return await interaction.showModal(modal2fa);
        }

        if (customId === "partner_rol") {
            const rolPartnerId = "1470862847671140412"; 
            const rol = interaction.guild.roles.cache.get(rolPartnerId);
            if (!rol) return interaction.reply({ content: "❌ El rol de partner no existe.", ephemeral: true });

            if (member.roles.cache.has(rolPartnerId)) {
                await member.roles.remove(rolPartnerId);
                return interaction.reply({ content: "✅ Se te ha quitado el rol de **Partner**.", ephemeral: true });
            } else {
                await member.roles.add(rolPartnerId);
                return interaction.reply({ content: "✅ ¡Perfecto! Ahora tienes el rol de **Partner**.", ephemeral: true });
            }
        }

        if (customId === "copiar_cvu") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias") return interaction.reply({ content: "710shop", ephemeral: true });

        // --- LÓGICA ASUMIR TICKET CON LOGS ---
        if (customId === "asumir") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            
            updateRanking(user.id, user.tag);

            await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            await channel.setName(`atendido-${user.username}`).catch(() => {});
            
            const embedAsumir = new MessageEmbed()
                .setTitle("📌 Ticket Asumido")
                .setColor("PURPLE")
                .setDescription(`Un miembro del staff ha tomado el control de un ticket.`)
                .addFields(
                    { name: "👷 Staff", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "🎫 Ticket", value: `${channel.name}`, inline: true },
                    { name: "🔗 Canal", value: `${channel}`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: "710 | Machine Logs" });

            enviarLog(embedAsumir);
        }

        if (customId === "notificar") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
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

    // --- LÓGICA DE MODALES ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_generar_2fa') {
            const secret = interaction.fields.getTextInputValue('clave_secreta').replace(/\s/g, '');
            try {
                const token = otplib.authenticator.generate(secret);
                return interaction.reply({ 
                    content: `🔑 Tu código Rockstar 2FA actual es: **${token}**\n*(Expira en 30 segundos)*`, 
                    ephemeral: true 
                });
            } catch (err) {
                return interaction.reply({ 
                    content: "❌ La clave secreta introducida no es válida. Asegúrate de que sea una clave base32 correcta.", 
                    ephemeral: true 
                });
            }
        }

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
                        .setAuthor({ name: '710 | Machine', iconURL: client.user.displayAvatarURL() })
                        .setTitle(`📑 Ticket Cerrado`)
                        .setColor("#2f3136")
                        .setDescription("Este ticket ha sido cerrado correctamente y su transcripción fue enviada.")
                        .addFields(
                            { name: "👤 Ticket Abierto Por", value: `<@${targetUser.id}>`, inline: true },
                            { name: "🛠️ Ticket Cerrado Por", value: `<@${user.id}>`, inline: true },
                            { name: "🕒 Fecha de cierre", value: `\`${moment().format('dddd, D [de] MMMM [de] YYYY, HH:mm')}\``, inline: true },
                            { name: "📄 Nota", value: `\`\`\`${notaStaff}\`\`\`` }
                        )
                        .setFooter({ text: '710 | Sistema de Tickets', iconURL: client.user.displayAvatarURL() });

                    const embedEncuesta = new MessageEmbed()
                        .setAuthor({ name: '710 | Machine', iconURL: client.user.displayAvatarURL() })
                        .setTitle("📝 Encuesta de Satisfacción - Soporte Automático")
                        .setColor("#2f3136")
                        .setDescription(`Tu ticket fue cerrado correctamente. Agradecemos tu tiempo, por favor califica tu experiencia.`)
                        .addFields(
                            { name: "🎫 Ticket", value: `\`${channel.name}\``, inline: true },
                            { name: "📁 Canal", value: `\`#${channel.name}\``, inline: true },
                            { name: "👷 Staff", value: `<@${user.id}>`, inline: true }
                        )
                        .setFooter({ text: '710 | Sistema de Tickets', iconURL: client.user.displayAvatarURL() });

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

        if (['modal_compra', 'modal_soporte', 'modal_partner'].includes(interaction.customId)) {
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
                    new MessageButton().setCustomId("boton_pago_mp").setLabel("Mercado Pago").setStyle("PRIMARY").setEmoji("💳"),
                    new MessageButton().setCustomId("notificar").setLabel("Notificar").setStyle("SECONDARY").setEmoji("📢")
                );

                await canal.send({ content: `${interaction.user} | <@&${rolPermitidoId}> Staff 👥`, embeds: [embedTicket], components: [row] });
                await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });
                enviarLog(new MessageEmbed().setTitle("🎫 Ticket Creado").setColor("BLUE").setDescription(`**Usuario:** ${interaction.user.tag}\n**Canal:** ${canal}\n**Tipo:** ${tipoTicket}`).setTimestamp());
            } catch (e) { console.error(e); }
        }
    }
});

// --- LÓGICA DE LOGS Y EVENTOS SIGUE IGUAL ---

client.on('messageCreate', m => {
    if (!m.guild || m.author.bot || m.channel.id === canalLogsId) return;
    enviarLog(new MessageEmbed().setAuthor({ name: `Mensaje: ${m.author.tag}`, iconURL: m.author.displayAvatarURL() }).setColor("#2f3136").setDescription(`**Canal:** ${m.channel}\n**Contenido:**\n${m.content || "*[Archivo/Embed]*"}`).setTimestamp());
});

client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("#ff0000").addFields({ name: "Autor", value: `${m.author?.tag || "Desconocido"}`, inline: true }, { name: "Canal", value: `${m.channel}`, inline: true }, { name: "Contenido", value: `\`\`\`${m.content || "Sin texto"}\`\`\`` }).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (!o || !o.author || o.author.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed()
        .setTitle("✏️ Mensaje Editado")
        .setColor("#ffff00")
        .addFields(
            { name: "Autor", value: `${o.author.tag}`, inline: true }, 
            { name: "Antes", value: `\`\`\`${o.content.slice(0, 1000) || "Sin contenido previo"}\`\`\`` }, 
            { name: "Después", value: `\`\`\`${n.content.slice(0, 1000) || "Sin contenido"}\`\`\`` }
        )
        .setTimestamp()
    );
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

    try {
        const comandosParaRegistrar = client.slashCommands
            .filter(cmd => cmd.data) 
            .map(cmd => cmd.data.toJSON());
        
        const comandosManuales = [
            { name: 'renvembed', description: 'Reenvía el último mensaje del bot y borra el viejo', type: 'CHAT_INPUT' },
            { name: 'clearpanel', description: 'Muestra el panel para limpiar tus mensajes directos', type: 'CHAT_INPUT' },
            { name: 'comandlist', description: 'Muestra la lista de comandos y sus permisos', type: 'CHAT_INPUT' },
            { name: 'rankingstaff', description: 'Muestra el top de Staff con más tickets asumidos', type: 'CHAT_INPUT' },
            { name: 'rankingreset', description: 'Resetea el ranking de Staff (Solo Admins)', type: 'CHAT_INPUT' }
        ];

        const listaFinal = [...comandosParaRegistrar, ...comandosManuales];
        const guildId = '1469618754282586154';
        const guild = client.guilds.cache.get(guildId);
        
        if (guild) {
            await guild.commands.set(listaFinal);
            console.log(`✅ Comandos Slash registrados en el servidor: ${guild.name}`);
        }
        
    } catch (error) {
        console.error("❌ Error al registrar comandos:", error);
    }
    
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