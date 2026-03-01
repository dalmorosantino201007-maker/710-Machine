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

const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const transcript = require('discord-html-transcripts'); 
const config = require('./DataBaseJson/config.json');
const { authenticator } = require('otplib');
const sqlite3 = require('sqlite3').verbose();

moment.locale('es');

// --- 🗄️ BASE DE DATOS ---
const db = new sqlite3.Database('./DataBaseJson/tickets.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, creatorId TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS conteo_tickets (total INTEGER)`);
    db.get(`SELECT total FROM conteo_tickets`, (err, row) => {
        if (!row) db.run(`INSERT INTO conteo_tickets (total) VALUES (0)`);
    });
});

const estadoTickets = {}; 

const client = new Client({
    intents: [
        "GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", 
        "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS", "DIRECT_MESSAGES"
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

// --- 📂 HANDLER ---
client.slashCommands = new Collection();
try {
    require('./handler')(client);
} catch (error) {
    console.error("❌ Error en Handler:", error);
}

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalVozId = "1475258262692827354";
const canalTranscriptsId = "1473454832567320768"; 
const canalLogsId = "1470928427199631412"; 
const canalWelcomeId = "1469953972197654570"; 
const ID_SERVIDOR = '1469618754282586154';

const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// ==========================================
// 👋 EVENTO: BIENVENIDAS (ESTILO SOLICITADO)
// ==========================================
client.on('guildMemberAdd', async (member) => {
    const canal = member.guild.channels.cache.get(canalWelcomeId) || await member.guild.channels.fetch(canalWelcomeId).catch(() => null);
    
    if (canal) {
        const createdDate = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`; 
        const createdRelative = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`; 
        const joinedDate = `<t:${Math.floor(Date.now() / 1000)}:f>`; 

        const embedWelcome = new MessageEmbed()
            .setAuthor({ name: `${member.guild.name} | Sistema de Ingresos`, iconURL: member.guild.iconURL({ dynamic: true }) })
            .setTitle(`🎉 ¡Bienvenido/a al servidor!`)
            .setDescription(`¡Hola ${member}, estamos muy emocionados de tenerte aquí! Pásala genial en **${member.guild.name}**. 💬`)
            .setColor("#2f3136")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: "📛 Usuario:", value: `**${member.user.tag}**`, inline: true },
                { name: "🆔 ID:", value: `\`${member.id}\``, inline: true },
                { name: "📅 Cuenta creada:", value: `${createdDate} (${createdRelative})`, inline: false },
                { name: "📥 Se unió el:", value: `${joinedDate}`, inline: false },
                { name: "👥 Total miembros:", value: `**${member.guild.memberCount}**`, inline: true },
                { name: "🔢 Eres el número:", value: `**#${member.guild.memberCount}**`, inline: true },
                { name: "📜 Reglas:", value: `No olvides leer las normas en <#1469950357785546853>`, inline: false }
            )
            .setFooter({ text: `710 Bot Shop • Disfruta tu estadía`, iconURL: member.guild.iconURL() })
            .setTimestamp();
        
        canal.send({ content: `👋 **¡Bienvenido ${member}!**`, embeds: [embedWelcome] }).catch(console.error);
    }
});

// ==========================================
// 🕹️ EVENTO: INTERACTION CREATE (TICKETS + 2FA)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    try {
        const ticketId = interaction.channel?.id;

        if (interaction.isCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (command) return await command.run(client, interaction);

            if (interaction.commandName === "renvembed") {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                const embedPanel = new MessageEmbed()
                    .setTitle("📩 CENTRO DE ATENCIÓN")
                    .setDescription("Selecciona una opción para abrir un ticket.")
                    .setColor("#2f3136");
                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("opc1").setLabel("Compras").setStyle("PRIMARY").setEmoji("🛒"),
                    new MessageButton().setCustomId("opc2").setLabel("Soporte").setStyle("SECONDARY").setEmoji("🛠"),
                    new MessageButton().setCustomId("opc3").setLabel("Partner").setStyle("SUCCESS").setEmoji("🤝")
                );
                await interaction.channel.send({ embeds: [embedPanel], components: [row] });
                return interaction.reply({ content: "✅ Panel enviado.", ephemeral: true });
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_auth_2fa') {
                const secret = interaction.fields.getTextInputValue('secret_input').replace(/\s+/g, '');
                try {
                    const token = authenticator.generate(secret);
                    return interaction.reply({ content: `🔑 Código: \`${token}\``, ephemeral: true });
                } catch (e) { return interaction.reply({ content: "❌ Key inválida.", ephemeral: true }); }
            }

            if (interaction.customId.startsWith("modal_")) {
                const opc = interaction.customId;
                let nome, categoria, ticketKey, respuestas = [];

                if (opc === "modal_opc1") {
                    nome = `🛒・compra-${interaction.user.username}`;
                    categoria = CATEGORIAS.COMPRA;
                    ticketKey = "ticket1";
                    respuestas = [
                        { name: "🛒 Producto:", value: interaction.fields.getTextInputValue("producto") },
                        { name: "💳 Método de pago:", value: interaction.fields.getTextInputValue("metodo_pago") },
                        { name: "📄 Cantidad:", value: interaction.fields.getTextInputValue("cantidad_compra") }
                    ];
                } else if (opc === "modal_opc2") {
                    nome = `🛠・soporte-${interaction.user.username}`;
                    categoria = CATEGORIAS.SOPORTE;
                    ticketKey = "ticket2";
                    respuestas = [
                        { name: "🔨 Producto:", value: interaction.fields.getTextInputValue("producto") },
                        { name: "⚠️ Problema:", value: interaction.fields.getTextInputValue("problema") },
                        { name: "📄 Info adicional:", value: interaction.fields.getTextInputValue("informacion_extra") || "Ninguna" }
                    ];
                } else if (opc === "modal_opc3") {
                    nome = `🤝・partner-${interaction.user.username}`;
                    categoria = CATEGORIAS.PARTNER;
                    ticketKey = "ticket3";
                    respuestas = [
                        { name: "🌐 Servidor:", value: interaction.fields.getTextInputValue("servidor") },
                        { name: "👥 ¿+250 Miembros?:", value: interaction.fields.getTextInputValue("miembros") },
                        { name: "🎯 Ya envio nuestro ad:", value: interaction.fields.getTextInputValue("nuestroad") }
                    ];
                }

                const existing = interaction.guild.channels.cache.find(c => estadoTickets[c.id]?.creadorId === interaction.user.id);
                if (existing) return interaction.reply({ content: `⚠️ Ya tienes un ticket: ${existing}`, ephemeral: true });

                const ch = await interaction.guild.channels.create(nome, {
                    parent: categoria,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: interaction.user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ]
                });

                db.run(`INSERT INTO tickets (creatorId) VALUES (?)`, [interaction.user.id], function(err) {
                    const ticketDbId = this.lastID;
                    estadoTickets[ch.id] = { creadorId: interaction.user.id, reclamado: false, fechaCreacion: new Date(), ticketId: ticketDbId };
                    
                    const embedTicket = new MessageEmbed()
                        .setTitle("SISTEMA DE TICKETS").setColor("#2f3136")
                        .addFields(
                            { name: '👤 Usuario', value: `${interaction.user}`, inline: true },
                            { name: '🎟️ Ticket N°', value: `${ticketDbId}`, inline: true },
                            { name: '🏷️ Categoría', value: `${ticketKey}`, inline: true }
                        ).setTimestamp();

                    const controlButtons = new MessageActionRow().addComponents(
                        new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setEmoji("🔒").setStyle("DANGER"),
                        new MessageButton().setCustomId("claim_ticket").setLabel("Reclamar").setEmoji("✅").setStyle("SUCCESS"),
                        new MessageButton().setCustomId("notify_ticket").setLabel("Notificar").setEmoji("📩").setStyle("PRIMARY")
                    );

                    ch.send({ content: `<@${interaction.user.id}>`, embeds: [embedTicket], components: [controlButtons] });
                    ch.send({ embeds: [new MessageEmbed().setTitle("📋 Respuestas").setColor("#2f3136").addFields(respuestas)] }).then(m => m.pin());
                    interaction.reply({ content: `✅ Ticket creado: ${ch}`, ephemeral: true });
                });
            }
        }

        if (interaction.isButton()) {
            const opc = interaction.customId;
            const ticket = estadoTickets[ticketId];

            if (opc === "opc1") {
                const m1 = new Modal().setCustomId("modal_opc1").setTitle("Compras");
                m1.addComponents(
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("producto").setLabel("Producto").setStyle("SHORT")),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("metodo_pago").setLabel("Método de pago").setStyle("SHORT")),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("cantidad_compra").setLabel("Cantidad").setStyle("SHORT"))
                );
                return await interaction.showModal(m1);
            }
            if (opc === "opc2") {
                const m2 = new Modal().setCustomId("modal_opc2").setTitle("Soporte");
                m2.addComponents(
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("producto").setLabel("Producto").setStyle("SHORT")),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("problema").setLabel("Problema").setStyle("SHORT")),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("informacion_extra").setLabel("Info adicional").setStyle("PARAGRAPH").setRequired(false))
                );
                return await interaction.showModal(m2);
            }
            if (opc === "opc3") {
                const m3 = new Modal().setCustomId("modal_opc3").setTitle("Partner");
                m3.addComponents(
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("servidor").setLabel("Link").setStyle("SHORT")),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("miembros").setLabel("¿+250 Miembros?").setStyle("SHORT")),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("nuestroad").setLabel("¿Enviaste el Ad?").setStyle("SHORT"))
                );
                return await interaction.showModal(m3);
            }

            if (!ticket) return;

            if (opc === "claim_ticket") {
                ticket.reclamado = true; ticket.reclamadorId = interaction.user.id;
                return interaction.reply({ content: `✅ Ticket reclamado por ${interaction.user}` });
            }
            if (opc === "notify_ticket") {
                const creador = await interaction.guild.members.fetch(ticket.creadorId).catch(() => null);
                if (creador) creador.send(`🔔 Te esperan en tu ticket: ${interaction.channel}`).catch(() => {});
                return interaction.reply({ content: "✅ Notificado", ephemeral: true });
            }
            if (opc === "fechar_ticket") {
                await interaction.deferUpdate();
                cerrarTicketFinal(interaction, ticket, "Cerrado");
            }
        }
    } catch (err) { console.error(err); }
});

// --- FUNCIÓN CIERRE ---
async function cerrarTicketFinal(interaction, ticket, nota) {
    const transcriptFile = await transcript.createTranscript(interaction.channel, { limit: -1, returnType: 'attachment' });
    const embedCierre = new MessageEmbed()
        .setTitle("📝 Ticket Cerrado").setColor("RED")
        .addFields(
            { name: '🎟️ Ticket', value: `\`${interaction.channel.name}\`` },
            { name: '👤 Abierto por', value: `<@${ticket.creadorId}>` },
            { name: '🔒 Cerrado por', value: `<@${interaction.user.id}>` }
        ).setTimestamp();

    const logChan = interaction.guild.channels.cache.get(canalTranscriptsId);
    if (logChan) logChan.send({ embeds: [embedCierre], files: [transcriptFile] });

    db.run(`DELETE FROM tickets WHERE id = ?`, [ticket.ticketId]);
    delete estadoTickets[interaction.channel.id];
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

// ==========================================
// 📡 AUDITORÍA / LOGS
// ==========================================
client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;
    const embed = new MessageEmbed()
        .setAuthor({ name: `Mensaje Eliminado`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(`**Autor:** ${message.author} (${message.author.id})\n**Canal:** ${message.channel}\n\n**Contenido:**\n${message.content || "_Sin contenido de texto_"}`)
        .setColor("RED")
        .setTimestamp();
    enviarLog(embed);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    const embed = new MessageEmbed()
        .setAuthor({ name: `Mensaje Editado`, iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(`**Autor:** ${oldMessage.author}\n**Canal:** ${oldMessage.channel}\n\n**Antes:**\n${oldMessage.content}\n\n**Después:**\n${newMessage.content}`)
        .setColor("YELLOW")
        .setTimestamp();
    enviarLog(embed);
});

client.on('guildMemberRemove', async (member) => {
    const embed = new MessageEmbed()
        .setAuthor({ name: `Usuario salió`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`${member.user.tag} ha abandonado el servidor.`)
        .setColor("ORANGE")
        .setTimestamp();
    enviarLog(embed);
});

// --- READY ---
client.on('ready', async () => {
    console.log(`🔥 ${client.user.username} - ONLINE`);
    const guild = client.guilds.cache.get(ID_SERVIDOR);
    if (guild) {
        const voiceChannel = guild.channels.cache.get(canalVozId);
        if (voiceChannel) {
            const { joinVoiceChannel } = require('@discordjs/voice');
            joinVoiceChannel({ channelId: voiceChannel.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator, selfDeaf: true, selfMute: true });
        }
    }
});

client.login(process.env.TOKEN || config.token);