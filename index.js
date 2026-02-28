require('dotenv').config(); 

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

// ... (El resto de tu código)S

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

    // --- 1. LÓGICA DE COMANDOS SLASH ---
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        // Comando /mp MODIFICADO para mostrar todo directo
        // Comando /mp - Sin menús, directo y para todos
        if (commandName === "mp") {
            const embedPagos = new MessageEmbed()
                .setAuthor({ name: '710 | Machine - Métodos de Pago', iconURL: client.user.displayAvatarURL() })
                .setTitle("💳 INFORMACIÓN DE PAGOS")
                .setColor("#5865F2")
                .setDescription("Aquí tienes nuestros datos oficiales para realizar tus compras.")
                .addFields(
                    { name: "💙 PayPal", value: "```la710storeshop@gmail.com```", inline: false },
                    { name: "💳 Mercado Pago", value: "\u200B", inline: false },
                    { name: "📌 CVU:", value: "```0000003100072461415651```", inline: true },
                    { name: "🏷️ Alias:", value: "```710shop```", inline: true },
                    { name: "👤 Titular:", value: "```Santino Dal Moro```", inline: true },
                    { name: "🏦 Banco:", value: "```Mercado Pago```", inline: true }
                )
                .setFooter({ text: "⚠️ Envía el comprobante para validar tu pedido." })
                .setTimestamp();

            return await interaction.reply({ embeds: [embedPagos], ephemeral: false });
        } // <-- Asegúrate de que esta llave cierre el IF

        // ... el resto de tus comandos (renvembed, clearpanel, etc.)

        if (commandName === "renvembed") {
            if (!interaction.member.roles.cache.has(rolAdminReenvio)) return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
            const mensajes = await interaction.channel.messages.fetch({ limit: 50 });
            const ultimoEmbed = mensajes.find(m => m.author.id === client.user.id && m.embeds.length > 0);
            if (!ultimoEmbed) return interaction.reply({ content: "❌ No encontré el embed.", ephemeral: true });
            await interaction.channel.send({ embeds: ultimoEmbed.embeds, components: ultimoEmbed.components });
            await ultimoEmbed.delete().catch(() => {});
            return interaction.reply({ content: "✅ Embed reenviado.", ephemeral: true });
        }

        if (commandName === "clearpanel") {
            const embedClear = new MessageEmbed().setTitle("🧹 Limpieza").setColor("#f39c12").setDescription("Presiona para limpiar tus DMs.");
            const rowClear = new MessageActionRow().addComponents(new MessageButton().setCustomId("limpiar_dm_proceso").setLabel("Limpiar DM").setStyle("DANGER").setEmoji("🧹"));
            return interaction.reply({ embeds: [embedClear], components: [rowClear] });
        }

        if (commandName === "comandlist") {
            const embedList = new MessageEmbed().setTitle("📜 Lista de Comandos").setColor("#2f3136")
                .addFields(
                    { name: "`/renvembed`", value: "Reenvía el último embed." },
                    { name: "`/clearpanel`", value: "Limpia tus mensajes directos." },
                    { name: "`/mp`", value: "Muestra métodos de pago." },
                    { name: "`/rankingstaff`", value: "Top de staff." }
                );
            return interaction.reply({ embeds: [embedList], ephemeral: true });
        }

        if (commandName === "rankingstaff") {
            const ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
            const sorted = Object.entries(ranking).sort(([, a], [, b]) => b.tickets - a.tickets).slice(0, 10);
            if (sorted.length === 0) return interaction.reply({ content: "📭 Ranking vacío.", ephemeral: true });
            const description = sorted.map(([id, data], index) => `**${index + 1}.** <@${id}> — \`${data.tickets}\` tickets`).join('\n');
            return interaction.reply({ embeds: [new MessageEmbed().setTitle("🏆 Ranking Staff").setDescription(description).setColor("GOLD")] });
        }

        if (commandName === "rankingreset") {
            if (!interaction.member.roles.cache.has(rolAdminReenvio)) return interaction.reply({ content: "❌ No puedes hacer esto.", ephemeral: true });
            fs.writeFileSync(rankingPath, JSON.stringify({}, null, 2));
            return interaction.reply({ content: "✅ Ranking reseteado." });
        }

        // Handler para comandos externos
        const cmd = client.slashCommands.get(commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
    }

    // --- 2. LÓGICA DE BOTONES (UNIFICADA) ---
    if (interaction.isButton()) {
        const { customId, member, user, channel } = interaction;

        // Menú de métodos de pago (dentro de tickets o por comando)
        if (customId === 'metodos_pago') {
            const rowMenu = new MessageActionRow().addComponents(
                new MessageSelectMenu().setCustomId('menu_metodos').setPlaceholder('💳 Elige método de pago')
                    .addOptions([
                        { label: 'Mercado Pago', value: 'pago_mp', emoji: '💳' },
                        { label: 'PayPal', value: 'pago_paypal', emoji: '💙' }
                    ])
            );
            return interaction.reply({ content: 'Selecciona una opción:', components: [rowMenu], ephemeral: true });
        }

        // Tickets: Abrir Modales
        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_prod').setLabel("¿Qué deseas comprar?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_metodo').setLabel("¿Método de pago?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_cant').setLabel("¿Cantidad?").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_soporte") {
            const modal = new Modal().setCustomId('modal_soporte').setTitle('Centro de Soporte');
            modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_duda').setLabel("¿En qué necesitas ayuda?").setStyle('PARAGRAPH').setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_partner") {
            const modal = new Modal().setCustomId('modal_partner').setTitle('Solicitud de Partner');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_add').setLabel("¿Ya añadiste nuestro add?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_link').setLabel("Link de tu server").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // Acciones dentro del Ticket
        if (customId === "asumir") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No eres Staff.", ephemeral: true });
            updateRanking(user.id, user.tag);
            await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            return channel.setName(`atendido-${user.username}`).catch(() => {});
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            const modalNota = new Modal().setCustomId('modal_nota_cierre').setTitle('Finalizar Ticket');
            modalNota.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('nota_staff').setLabel("Nota de cierre").setStyle('PARAGRAPH')));
            return await interaction.showModal(modalNota);
        }

        if (customId === "notificar") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            const targetId = channel.permissionOverwrites.cache.filter(p => p.type === 'member' && p.id !== client.user.id).first()?.id;
            return interaction.reply({ content: targetId ? `🔔 <@${targetId}>, el Staff solicita tu atención.` : "📢 ¡Atención! Staff esperando." });
        }

        // Otros (2FA, Limpieza, etc.)
        if (customId === "limpiar_dm_proceso") {
            await interaction.reply({ content: "⏳ Limpiando...", ephemeral: true });
            const dmChannel = await user.createDM();
            const mensajes = await dmChannel.messages.fetch({ limit: 100 });
            const mensajesBot = mensajes.filter(m => m.author.id === client.user.id);
            for (const msg of mensajesBot.values()) { await msg.delete().catch(() => {}); }
            return interaction.editReply({ content: `✅ Limpiado (${mensajesBot.size} mensajes).` });
        }

        if (customId === "ingresar_clave_2fa") {
            const modal2fa = new Modal().setCustomId('modal_generar_2fa').setTitle('Código 2FA');
            modal2fa.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('clave_secreta').setLabel("Clave Secreta").setStyle('SHORT').setRequired(true)));
            return interaction.showModal(modal2fa);
        }
    }

    // --- 3. MENÚS DE SELECCIÓN ---
    if (interaction.isSelectMenu()) {
        const { customId, values, user } = interaction;

        if (customId === 'menu_metodos') {
            const embed = new MessageEmbed().setColor("BLUE");
            if (values[0] === 'pago_mp') {
                embed.setTitle("💳 Mercado Pago").addFields({ name: "CVU", value: "```0000003100072461415651```" }, { name: "Alias", value: "```710shop```" });
            } else {
                embed.setTitle("💙 PayPal").addFields({ name: "Correo", value: "```la710storeshop@gmail.com```" });
            }
            return interaction.update({ content: "Datos de pago:", embeds: [embed], components: [] });
        }

        if (customId.startsWith("calificar_staff_")) {
            const staffId = customId.split('_')[2];
            const nota = values[0];
            const embedReview = new MessageEmbed().setTitle("🌟 Nueva Calificación").setColor("GOLD")
                .addFields({ name: "Usuario", value: user.tag }, { name: "Staff", value: `<@${staffId}>` }, { name: "Puntaje", value: "⭐".repeat(nota) });
            client.channels.cache.get(canalReviewsId)?.send({ embeds: [embedReview] });
            return interaction.reply({ content: "✅ ¡Gracias por calificar!", ephemeral: true });
        }
    }

    // --- 4. MODALES ---
    // --- LÓGICA DE MODALES ---
    if (interaction.isModalSubmit()) {
        const { customId, fields, guild, channel, user } = interaction;

        if (customId === 'modal_generar_2fa') {
            const secret = fields.getTextInputValue('clave_secreta').replace(/\s/g, '');
            try { return interaction.reply({ content: `🔑 Código: **${otplib.authenticator.generate(secret)}**`, ephemeral: true }); }
            catch { return interaction.reply({ content: "❌ Clave inválida.", ephemeral: true }); }
        }

        if (customId === 'modal_nota_cierre') {
            await interaction.deferReply({ ephemeral: true });
            const nota = fields.getTextInputValue('nota_staff') || "Sin nota.";
            const targetId = channel.permissionOverwrites.cache.filter(p => p.type === 'member' && p.id !== client.user.id).first()?.id;
            const transcriptFile = await transcripts.createTranscript(channel, { fileName: `transcript-${channel.name}.html` });
            
            if (targetId) {
                const target = await client.users.fetch(targetId);
                const rowReview = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId(`calificar_staff_${user.id}`).setPlaceholder('Califica').addOptions([{label:'5 Estrellas', value:'5'}]));
                await target.send({ content: `Ticket cerrado. Nota: ${nota}`, files: [transcriptFile], components: [rowReview] }).catch(() => {});
            }
            guild.channels.cache.get(canalTranscriptsId)?.send({ content: `Ticket: ${channel.name}`, files: [transcriptFile] });
            await interaction.editReply("✅ Cerrando...");
            return setTimeout(() => channel.delete().catch(() => {}), 3000);
        }

        // Creación de Tickets (Compra, Soporte, Partner) - MODIFICADO PARA DISEÑO PRO
        if (['modal_compra', 'modal_soporte', 'modal_partner'].includes(customId)) {
            await interaction.deferReply({ ephemeral: true });
            
            let cateId = CATEGORIAS.COMPRA;
            let nombre = `🛒-buy-${user.username}`;
            let tituloEmbed = "🛒 NUEVA ORDEN DE COMPRA";
            let colorEmbed = "#57F287";
            let camposExtra = [];
            
            if (customId === 'modal_compra') {
                camposExtra = [
                    { name: '📦 Producto:', value: `\`${fields.getTextInputValue('p_prod')}\``, inline: true },
                    { name: '💳 Método:', value: `\`${fields.getTextInputValue('p_metodo')}\``, inline: true },
                    { name: '🔢 Cantidad:', value: `\`${fields.getTextInputValue('p_cant')}\``, inline: true }
                ];
            } else if (customId === 'modal_soporte') {
                cateId = CATEGORIAS.SOPORTE; 
                nombre = `🛠️-soporte-${user.username}`; 
                tituloEmbed = "🛠️ CENTRO DE SOPORTE";
                colorEmbed = "#5865F2";
                camposExtra = [{ name: '❓ Consulta:', value: `\`${fields.getTextInputValue('p_duda')}\``, inline: false }];
            }

            const nChannel = await guild.channels.create(nombre, {
                type: 'GUILD_TEXT', 
                parent: cateId,
                permissionOverwrites: [
                    { id: guild.id, deny: ['VIEW_CHANNEL'] },
                    { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                    { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                ]
            });

            const embedTicket = new MessageEmbed()
                .setAuthor({ name: '710 | Machine Services', iconURL: client.user.displayAvatarURL() })
                .setTitle(tituloEmbed)
                .setColor(colorEmbed)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(`Hola ${user}, bienvenido a tu ticket.\n\n> Un miembro del **Staff** te atenderá pronto.`)
                .addFields(
                    { name: "👤 Cliente:", value: `${user}`, inline: true },
                    { name: "🆔 ID Usuario:", value: `\`${user.id}\``, inline: true },
                    ...camposExtra
                )
                .setFooter({ text: "710 | Machine Services" })
                .setTimestamp();

            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                new MessageButton().setCustomId("boton_pago_mp").setLabel("Pagos").setStyle("PRIMARY").setEmoji("💳"),
                new MessageButton().setCustomId("notificar").setLabel("Avisar").setStyle("SECONDARY").setEmoji("🔔"),
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒")
            );

            await nChannel.send({ content: `${user} | <@&${rolPermitidoId}>`, embeds: [embedTicket], components: [row] });
            return await interaction.editReply(`✅ Ticket creado: ${nChannel}`);
        }

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

    // --- BLOQUE DE CONEXIÓN A VOZ ---
    const { joinVoiceChannel } = require('@discordjs/voice');
    const ID_CANAL_VOZ = '1475258262692827354'; 
    const ID_SERVIDOR = '1469618754282586154'; 

    try {
        const canal = client.channels.cache.get(ID_CANAL_VOZ);
        if (canal) {
            joinVoiceChannel({
                channelId: canal.id,
                guildId: ID_SERVIDOR,
                adapterCreator: canal.guild.voiceAdapterCreator,
                selfDeaf: true, // Ensordecido
                selfMute: false,
            });
            console.log(`🎙️ Bot conectado a voz en: ${canal.name}`);
        }
    } catch (error) {
        console.error("❌ Error al conectar a voz:", error);
    }
    // --- FIN BLOQUE VOZ ---

    // --- REGISTRO DE COMANDOS ---
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
        const guild = client.guilds.cache.get(ID_SERVIDOR);
        
        if (guild) {
            await guild.commands.set(listaFinal);
            console.log(`✅ Comandos Slash registrados en el servidor: ${guild.name}`);
        }
        
    } catch (error) {
        console.error("❌ Error al registrar comandos:", error);
    }
    
    // --- LOG DE ENCENDIDO ---
    // Nota: Si usas discord.js v13, asegúrate de tener definida la variable Discord o usa MessageEmbed directamente
    const embedReady = new MessageEmbed()
        .setTitle("✅ Bot Encendido Correctamente")
        .setColor("GREEN")
        .setDescription(`El bot **${client.user.tag}** ya está operativo.`)
        .addFields(
            { name: "📡 Estado", value: "En línea", inline: true },
            { name: "⏰ Hora", value: moment().format('HH:mm:ss'), inline: true }
        )
        .setTimestamp();
    
    // Solo envía el log si la función existe
    if (typeof enviarLog === 'function') {
        enviarLog(embedReady);
    }
});

client.login(process.env.TOKEN || config.token);