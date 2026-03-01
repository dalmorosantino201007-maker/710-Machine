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
// Asegúrate de que la carpeta DataBaseJson exista manualmente
const db = new sqlite3.Database('./DataBaseJson/tickets.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        creatorId TEXT, 
        channelId TEXT,
        claimedBy TEXT
    )`);
});

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
// 👋 EVENTO: BIENVENIDAS
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
// 🕹️ EVENTO: INTERACTION CREATE
// ==========================================
client.on('interactionCreate', async (interaction) => {
    try {
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
            if (interaction.customId.startsWith("modal_")) {
                const opc = interaction.customId;
                let nome, categoria, ticketKey, respuestas = [];

                if (opc === "modal_opc1") {
                    nome = `🛒・${interaction.user.username}`;
                    categoria = CATEGORIAS.COMPRA;
                    ticketKey = "Compra";
                    respuestas = [
                        { name: "🛒 Producto:", value: interaction.fields.getTextInputValue("producto") },
                        { name: "💳 Método de pago:", value: interaction.fields.getTextInputValue("metodo_pago") },
                        { name: "📄 Cantidad:", value: interaction.fields.getTextInputValue("cantidad_compra") }
                    ];
                } else if (opc === "modal_opc2") {
                    nome = `🛠・${interaction.user.username}`;
                    categoria = CATEGORIAS.SOPORTE;
                    ticketKey = "Soporte";
                    respuestas = [
                        { name: "🔨 Producto:", value: interaction.fields.getTextInputValue("producto") },
                        { name: "⚠️ Problema:", value: interaction.fields.getTextInputValue("problema") },
                        { name: "📄 Info adicional:", value: interaction.fields.getTextInputValue("informacion_extra") || "Ninguna" }
                    ];
                } else if (opc === "modal_opc3") {
                    nome = `🤝・${interaction.user.username}`;
                    categoria = CATEGORIAS.PARTNER;
                    ticketKey = "Partner";
                    respuestas = [
                        { name: "🌐 Servidor:", value: interaction.fields.getTextInputValue("servidor") },
                        { name: "👥 ¿+250 Miembros?:", value: interaction.fields.getTextInputValue("miembros") },
                        { name: "🎯 Ya envio nuestro ad:", value: interaction.fields.getTextInputValue("nuestroad") }
                    ];
                }

                db.get(`SELECT channelId FROM tickets WHERE creatorId = ?`, [interaction.user.id], async (err, row) => {
                    if (row && interaction.guild.channels.cache.has(row.channelId)) {
                        return interaction.reply({ content: `⚠️ Ya tienes un ticket abierto: <#${row.channelId}>`, ephemeral: true });
                    }

                    const ch = await interaction.guild.channels.create(nome, {
                        type: 'GUILD_TEXT',
                        parent: categoria,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: ['VIEW_CHANNEL'] },
                            { id: interaction.user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'] },
                            { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                        ]
                    });

                    db.run(`INSERT INTO tickets (creatorId, channelId) VALUES (?, ?)`, [interaction.user.id, ch.id], function(err) {
                        const ticketDbId = this.lastID;
                        
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

                        ch.send({ content: `<@${interaction.user.id}> | <@&${rolPermitidoId}>`, embeds: [embedTicket], components: [controlButtons] });
                        ch.send({ embeds: [new MessageEmbed().setTitle("📋 Datos del Formulario").setColor("#2f3136").addFields(respuestas)] }).then(m => m.pin());
                        interaction.reply({ content: `✅ Ticket creado con éxito: ${ch}`, ephemeral: true });
                    });
                });
            }
        }

        if (interaction.isButton()) {
            const opc = interaction.customId;

            // --- MOVIDO FUERA DE LA DB PARA QUE RESPONDA RÁPIDO ---
            if (opc === "opc1") {
                const m1 = new Modal().setCustomId("modal_opc1").setTitle("Formulario de Compra");
                m1.addComponents(
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("producto").setLabel("¿Qué deseas comprar?").setStyle("SHORT").setRequired(true)),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("metodo_pago").setLabel("Método de pago").setStyle("SHORT").setRequired(true)),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("cantidad_compra").setLabel("Cantidad").setStyle("SHORT").setRequired(true))
                );
                return await interaction.showModal(m1);
            }
            if (opc === "opc2") {
                const m2 = new Modal().setCustomId("modal_opc2").setTitle("Formulario de Soporte");
                m2.addComponents(
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("producto").setLabel("Producto/Servicio").setStyle("SHORT").setRequired(true)),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("problema").setLabel("Describe el problema").setStyle("SHORT").setRequired(true)),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("informacion_extra").setLabel("Información adicional").setStyle("PARAGRAPH").setRequired(false))
                );
                return await interaction.showModal(m2);
            }
            if (opc === "opc3") {
                const m3 = new Modal().setCustomId("modal_opc3").setTitle("Formulario de Partner");
                m3.addComponents(
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("servidor").setLabel("Link del Servidor").setStyle("SHORT").setRequired(true)),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("miembros").setLabel("¿Cuántos miembros reales tiene?").setStyle("SHORT").setRequired(true)),
                    new MessageActionRow().addComponents(new TextInputComponent().setCustomId("nuestroad").setLabel("¿Publicaste nuestro Ad?").setStyle("SHORT").setRequired(true))
                );
                return await interaction.showModal(m3);
            }

            // Lógica de botones DENTRO del ticket
            db.get(`SELECT * FROM tickets WHERE channelId = ?`, [interaction.channel.id], async (err, ticket) => {
                if (!ticket) return;

                if (opc === "claim_ticket") {
                    if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ Solo el personal puede reclamar tickets.", ephemeral: true });
                    if (ticket.claimedBy) return interaction.reply({ content: `⚠️ Este ticket ya fue reclamado por <@${ticket.claimedBy}>`, ephemeral: true });

                    db.run(`UPDATE tickets SET claimedBy = ? WHERE channelId = ?`, [interaction.user.id, interaction.channel.id]);
                    return interaction.reply({ content: `✅ Ticket reclamado por ${interaction.user}` });
                }

                if (opc === "notify_ticket") {
                    const creador = await interaction.guild.members.fetch(ticket.creatorId).catch(() => null);
                    if (creador) {
                        creador.send(`🔔 **Atención:** El staff te está esperando en tu ticket: ${interaction.channel}`).catch(() => {});
                        return interaction.reply({ content: "✅ Se ha enviado un MD al creador del ticket.", ephemeral: true });
                    }
                    return interaction.reply({ content: "❌ No pude enviar el mensaje.", ephemeral: true });
                }

                if (opc === "fechar_ticket") {
                    if (!interaction.member.roles.cache.has(rolPermitidoId) && interaction.user.id !== ticket.creatorId) {
                        return interaction.reply({ content: "❌ No tienes permiso para cerrar este ticket.", ephemeral: true });
                    }
                    await interaction.reply("🔒 Cerrando ticket en 5 segundos...");
                    setTimeout(() => cerrarTicketFinal(interaction, ticket), 5000);
                }
            });
        }
    } catch (err) { console.error(err); }
});

// --- FUNCIÓN CIERRE ---
async function cerrarTicketFinal(interaction, ticket) {
    try {
        const attachment = await transcript.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `transcript-${interaction.channel.name}.html`,
            returnBuffer: false
        });

        const embedCierre = new MessageEmbed()
            .setTitle("📝 Ticket Finalizado")
            .setColor("RED")
            .addFields(
                { name: '🎟️ Canal', value: `\`${interaction.channel.name}\``, inline: true },
                { name: '👤 Creador', value: `<@${ticket.creatorId}>`, inline: true },
                { name: '🔒 Cerrado por', value: `${interaction.user.tag}`, inline: true }
            ).setTimestamp();

        const logChan = interaction.guild.channels.cache.get(canalTranscriptsId);
        if (logChan) await logChan.send({ embeds: [embedCierre], files: [attachment] });

        db.run(`DELETE FROM tickets WHERE channelId = ?`, [interaction.channel.id]);
        await interaction.channel.delete();
    } catch (e) { console.error(e); }
}

// ==========================================
// 📡 AUDITORÍA / LOGS
// ==========================================
client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;
    const embed = new MessageEmbed()
        .setAuthor({ name: `Mensaje Eliminado`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(`**Autor:** ${message.author} (${message.author.id})\n**Canal:** ${message.channel}\n\n**Contenido:**\n${message.content || "_Sin contenido de texto_"}`)
        .setColor("RED").setTimestamp();
    enviarLog(embed);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    const embed = new MessageEmbed()
        .setAuthor({ name: `Mensaje Editado`, iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(`**Autor:** ${oldMessage.author}\n**Canal:** ${oldMessage.channel}\n\n**Antes:**\n${oldMessage.content}\n\n**Después:**\n${newMessage.content}`)
        .setColor("YELLOW").setTimestamp();
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
            try {
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true,
                    selfMute: true 
                });
            } catch (e) { console.error("Error al unirse al canal de voz:", e); }
        }
    }
});

client.login(process.env.TOKEN || config.token);