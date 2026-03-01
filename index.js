require('dotenv').config(); 

const { 
    Client, 
    Collection, 
    MessageEmbed, 
    MessageActionRow, 
    MessageButton, 
    Modal, 
    TextInputComponent 
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const transcripts = require('discord-html-transcripts'); 
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: [
        "GUILDS", 
        "GUILD_MEMBERS", 
        "GUILD_MESSAGES", 
        "GUILD_MESSAGE_REACTIONS", 
        "GUILD_VOICE_STATES", 
        "GUILD_PRESENCES", 
        "GUILD_BANS", 
        "DIRECT_MESSAGES"
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

// --- 📂 MANEJO DE COMANDOS (HANDLER) ---
client.slashCommands = new Collection();
try {
    require('./handler')(client);
    console.log("✅ Handler cargado correctamente.");
} catch (error) {
    console.error("❌ Error cargando el Handler:", error);
}

// --- 🛠️ CONFIGURACIÓN DE IDs (Mantenidas) ---
const rolPermitidoId = "1469967630365622403"; 
const canalTranscriptsId = "1473454832567320768"; 
const canalLogsId = "1470928427199631412"; 
const canalWelcomeId = "1469618755037429792"; 
const rolPartnerAutoId = "1470862847671140412"; 
const ID_SERVIDOR = '1469618754282586154';
const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- 💾 FUNCIONES DE BASE DE DATOS ---
const rankingPath = './DataBaseJson/ranking.json';

function updateRanking(userId, userTag) {
    if (!fs.existsSync(rankingPath)) fs.writeFileSync(rankingPath, JSON.stringify({}));
    let ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
    if (!ranking[userId]) ranking[userId] = { tag: userTag, tickets: 0 };
    ranking[userId].tickets += 1;
    fs.writeFileSync(rankingPath, JSON.stringify(ranking, null, 2));
}

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch((e) => console.error("Error enviando log:", e));
};

// ==========================================
// 👋 EVENTOS DE MIEMBROS
// ==========================================
client.on('guildMemberAdd', async (member) => {
    const canal = member.guild.channels.cache.get(canalWelcomeId) || await member.guild.channels.fetch(canalWelcomeId).catch(() => null);
    if (canal) {
        const embedWelcome = new MessageEmbed()
            .setTitle("👋 ¡Bienvenido a 710 Bot Shop!")
            .setDescription(`Hola ${member}, gracias por unirte a **${member.guild.name}**.\n\n> No olvides leer las normas y abrir un ticket si deseas comprar algo.`)
            .setColor("#2f3136")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage("https://i.imgur.com/Tu7vI7h.png")
            .setFooter({ text: `Eres el miembro número ${member.guild.memberCount}` })
            .setTimestamp();
        canal.send({ content: `Bienvenido/a ${member}! 🚀`, embeds: [embedWelcome] }).catch(console.error);
    }
});

// ==========================================
// 🕹️ EVENTO: INTERACTION CREATE (MEJORADO)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    try {
        // --- BOTONES ---
        if (interaction.isButton()) {
            const { customId, member, user, guild } = interaction;
            
            // Reparación de Auto-Partner (Evita Interacción Fallida)
            if (customId === "verificar_partner") {
                await interaction.deferReply({ ephemeral: true });
                if (member.roles.cache.has(rolPartnerAutoId)) return interaction.editReply({ content: "✅ Ya eres Partner." });
                
                try {
                    await member.roles.add(rolPartnerAutoId);
                    return interaction.editReply({ content: "🎉 ¡Rol asignado correctamente! Ya puedes ver la sección de partners." });
                } catch (e) {
                    return interaction.editReply({ content: "❌ Error de jerarquía. Sube mi rol por encima del rol de Partner." });
                }
            }

            if (customId === "asumir") {
                if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No eres Staff.", ephemeral: true });
                updateRanking(user.id, user.tag);
                return await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            }

            if (customId === "fechar_ticket") {
                const modalCierre = new Modal().setCustomId('modal_nota_cierre').setTitle('Cerrar Ticket');
                modalCierre.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('nota_staff').setLabel("Nota final").setStyle('PARAGRAPH')));
                return await interaction.showModal(modalCierre);
            }

            // Abrir Modales de Tickets con múltiples campos
            if (customId.startsWith("ticket_")) {
                const tipo = customId.split('_')[1];
                const modal = new Modal().setCustomId(`modal_${tipo}`).setTitle(`Formulario de ${tipo.toUpperCase()}`);
                
                if (tipo === "compra") {
                    modal.addComponents(
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_1').setLabel("¿Qué producto deseas?").setStyle('SHORT').setRequired(true)),
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_2').setLabel("¿Qué método de pago usarás?").setStyle('SHORT').setRequired(true))
                    );
                } else {
                    modal.addComponents(
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_1').setLabel("Escribe tu duda o motivo").setStyle('PARAGRAPH').setRequired(true))
                    );
                }
                return await interaction.showModal(modal);
            }
        }

        // --- SUBMIT DE MODALES (DISEÑO DE TICKET MEJORADO) ---
        if (interaction.isModalSubmit()) {
            const { customId, user, guild, channel, fields } = interaction;
            
            if (customId.startsWith('modal_') && customId !== 'modal_nota_cierre') {
                await interaction.deferReply({ ephemeral: true });
                const tipo = customId.split('_')[1];
                const nombreLimpio = user.username.replace(/[^a-zA-Z0-9]/g, "") || user.id;

                const nChannel = await guild.channels.create(`${tipo}-${nombreLimpio}`, {
                    parent: CATEGORIAS[tipo.toUpperCase()],
                    permissionOverwrites: [
                        { id: guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ]
                });

                // DISEÑO DE EMBED TICKET (Similar a la imagen proporcionada)
                const embedTicket = new MessageEmbed()
                    .setAuthor({ name: "710 Bot Shop", iconURL: client.user.displayAvatarURL() })
                    .setTitle("SISTEMA DE TICKETS")
                    .setDescription(`¡Bienvenido/a ${user}! El Staff te atenderá pronto.\nPor favor, danos los detalles necesarios.`)
                    .setColor("#2f3136")
                    .setThumbnail("https://i.imgur.com/Tu7vI7h.png") // Icono de discord amarillo como en tu imagen
                    .addFields(
                        { name: "Categoría", value: `\`${tipo.toUpperCase()}\``, inline: true },
                        { name: "ID del Ticket", value: `\`${Math.floor(Math.random() * 900000000)}\``, inline: true },
                        { name: "Fecha", value: `\`${moment().format('DD/MM/YYYY HH:mm')}\``, inline: true },
                        { name: "Usuario", value: `${user.tag} (${user.id})`, inline: false }
                    );

                // Agregar campos personalizados según el tipo
                if (tipo === "compra") {
                    embedTicket.addFields(
                        { name: "📦 Producto", value: `\`${fields.getTextInputValue('p_1')}\``, inline: true },
                        { name: "💳 Método", value: `\`${fields.getTextInputValue('p_2')}\``, inline: true }
                    );
                } else {
                    embedTicket.addFields({ name: "📝 Detalles", value: fields.getTextInputValue('p_1'), inline: false });
                }

                embedTicket.setFooter({ text: "710 Shop - Gestión de Tickets" }).setTimestamp();

                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                    new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅")
                );

                await nChannel.send({ content: `${user} | <@&${rolPermitidoId}>`, embeds: [embedTicket], components: [row] });
                return interaction.editReply(`✅ Ticket creado correctamente: ${nChannel}`);
            }

            if (customId === 'modal_nota_cierre') {
                await interaction.deferReply();
                const transcript = await transcripts.createTranscript(channel);
                await client.channels.cache.get(canalTranscriptsId).send({ 
                    content: `Transcript de ${channel.name} | Cerrado por ${user.tag}`,
                    files: [transcript] 
                });
                await interaction.editReply("🔒 Cerrando ticket...");
                setTimeout(() => channel.delete().catch(() => {}), 3000);
            }
        }
    } catch (err) { console.error("Interaction Error:", err); }
});

// ==========================================
// 📡 AUDITORÍA COMPLETA (LOGS)
// ==========================================
client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("RED").addFields({ name: "Autor", value: `${m.author.tag}`, inline: true }, { name: "Canal", value: `${m.channel}`, inline: true }, { name: "Contenido", value: m.content || "Sin texto" }).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (!o.guild || o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("YELLOW").addFields({ name: "Autor", value: `${o.author.tag}` }, { name: "Antes", value: o.content || "Vacío" }, { name: "Después", value: n.content || "Vacío" }).setTimestamp());
});

client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setDescription(`Nombre: **${c.name}**\nTipo: ${c.type}`).setColor("GREEN").setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🚫 Canal Eliminado").setDescription(`Nombre: **${c.name}**`).setColor("RED").setTimestamp()));

client.on('roleCreate', r => enviarLog(new MessageEmbed().setTitle("🎭 Rol Creado").setDescription(`Nombre: ${r.name}`).setColor("GREEN").setTimestamp()));
client.on('roleDelete', r => enviarLog(new MessageEmbed().setTitle("🔥 Rol Eliminado").setDescription(`Nombre: ${r.name}`).setColor("RED").setTimestamp()));

client.on('guildMemberUpdate', (o, n) => {
    const addedRoles = n.roles.cache.filter(r => !o.roles.cache.has(r.id));
    const removedRoles = o.roles.cache.filter(r => !n.roles.cache.has(r.id));
    addedRoles.forEach(r => enviarLog(new MessageEmbed().setTitle("✅ Rol Añadido").setDescription(`A: ${n.user.tag}\nRol: ${r.name}`).setColor("BLUE").setTimestamp()));
    removedRoles.forEach(r => enviarLog(new MessageEmbed().setTitle("❌ Rol Quitado").setDescription(`A: ${n.user.tag}\nRol: ${r.name}`).setColor("DARK_RED").setTimestamp()));
});

client.on('voiceStateUpdate', (o, n) => {
    if (!o.channelId && n.channelId) enviarLog(new MessageEmbed().setTitle("🔊 Entró a Voz").setDescription(`${n.member.user.tag} entró a ${n.channel.name}`).setColor("AQUA").setTimestamp());
    if (o.channelId && !n.channelId) enviarLog(new MessageEmbed().setTitle("🔇 Salió de Voz").setDescription(`${o.member.user.tag} salió de ${o.channel.name}`).setColor("GREY").setTimestamp());
});

// ==========================================
// 🚀 INICIO
// ==========================================
client.on('ready', async () => {
    console.log(`🔥 ${client.user.username} - OPERATIVO`);
    const guild = client.guilds.cache.get(ID_SERVIDOR);
    if (guild) {
        // Registro de comandos para evitar el "está pensando"
        await guild.commands.set([
            { name: 'reseller', description: 'Asignar rango Reseller', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario a asignar' }] },
            { name: 'customer', description: 'Asignar rango Customer', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario a asignar' }] },
            { name: 'ultra', description: 'Asignar rango Ultra', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario a asignar' }] },
            { name: 'renvembed', description: 'Re-enviar el panel de tickets' },
            { name: 'embed', description: 'Comando de prueba embed' },
            { name: 'mp', description: 'Ver métodos de pago' }
        ]);
    }
});

client.login(process.env.TOKEN || config.token);