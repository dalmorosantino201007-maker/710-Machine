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
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS", "DIRECT_MESSAGES"],
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

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalTranscriptsId = "1473454832567320768"; 
const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- 💾 FUNCIONES DE BASE DE DATOS ---
const rankingPath = './DataBaseJson/ranking.json';
const contadorPath = './DataBaseJson/contador.json';

function updateRanking(userId, userTag) {
    if (!fs.existsSync(rankingPath)) fs.writeFileSync(rankingPath, JSON.stringify({}));
    let ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
    if (!ranking[userId]) ranking[userId] = { tag: userTag, tickets: 0 };
    ranking[userId].tickets += 1;
    fs.writeFileSync(rankingPath, JSON.stringify(ranking, null, 2));
}

// ==========================================
// 🕹️ EVENTO: INTERACTION CREATE
// ==========================================

client.on('interactionCreate', async (interaction) => {
    try {
        // --- 1. COMANDOS SLASH ---
        if (interaction.isCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (command) {
                return await command.run(client, interaction);
            } else if (interaction.commandName === "mp") {
                // Comando /mp de emergencia si no está en carpeta commands
                const embedPagos = new MessageEmbed()
                    .setTitle("💳 MÉTODOS DE PAGO")
                    .setColor("#5865F2")
                    .setDescription("💙 **PayPal:** `la710storeshop@gmail.com` \n💳 **Mercado Pago:** `710shop` (Santino Dal Moro)")
                    .setTimestamp();
                return await interaction.reply({ embeds: [embedPagos] });
            }
        }

        // --- 2. BOTONES ---
        if (interaction.isButton()) {
            const { customId, guild, channel, user, member } = interaction;

            if (customId === "asumir") {
                if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No eres Staff.", ephemeral: true });
                updateRanking(user.id, user.tag);
                return await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            }

            if (customId === "fechar_ticket") {
                if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                const modalCierre = new Modal().setCustomId('modal_nota_cierre').setTitle('Cerrar Ticket');
                modalCierre.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('nota_staff').setLabel("Nota final").setStyle('PARAGRAPH')));
                return await interaction.showModal(modalCierre);
            }

            if (customId === "notificar") {
                if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                return await interaction.reply({ content: `🔔 ${user} solicita tu atención.` });
            }

            // Apertura de tickets desde panel
            if (customId.startsWith("ticket_")) {
                const tipo = customId.split('_')[1];
                const modalT = new Modal().setCustomId(`modal_${tipo}`).setTitle('Abrir Ticket');
                modalT.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_duda').setLabel("¿Cómo podemos ayudarte?").setStyle('PARAGRAPH').setRequired(true)));
                return await interaction.showModal(modalT);
            }
        }

        // --- 3. MODALES (SUBMIT) ---
        if (interaction.isModalSubmit()) {
            const { customId, fields, guild, channel, user } = interaction;

            if (customId === 'modal_nota_cierre') {
                await interaction.deferReply();
                const transcript = await transcripts.createTranscript(channel);
                await client.channels.cache.get(canalTranscriptsId).send({ content: `Transcript: ${channel.name}`, files: [transcript] });
                await interaction.editReply("🔒 Cerrando...");
                return setTimeout(() => channel.delete().catch(() => {}), 3000);
            }

            if (customId.startsWith('modal_')) {
                await interaction.deferReply({ ephemeral: true });
                
                // Contador
                if (!fs.existsSync(contadorPath)) fs.writeFileSync(contadorPath, JSON.stringify({ count: 0 }));
                let cData = JSON.parse(fs.readFileSync(contadorPath));
                cData.count++;
                fs.writeFileSync(contadorPath, JSON.stringify(cData));

                const tipo = customId.split('_')[1].toUpperCase();
                const nChannel = await guild.channels.create(`ticket-${user.username}`, {
                    parent: CATEGORIAS[tipo] || CATEGORIAS.SOPORTE,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ]
                });

                // DISEÑO PROFESIONAL
                const embedT = new MessageEmbed()
                    .setAuthor({ name: "710 Bot Shop", iconURL: client.user.displayAvatarURL() })
                    .setTitle("SISTEMA DE TICKETS")
                    .setColor("#2f3136")
                    .addFields(
                        { name: "Categoría", value: `\`${tipo}\``, inline: true },
                        { name: "ID del Ticket", value: `\`${cData.count}${user.id.slice(-4)}\``, inline: true },
                        { name: "Fecha", value: `\`${moment().format('DD/MM/YYYY HH:mm')}\``, inline: true },
                        { name: "Usuario", value: `\`${user.tag}\` (${user.id})` },
                        { name: "❓ Ayuda", value: `\`${fields.getTextInputValue('p_duda')}\`` }
                    )
                    .setFooter({ text: "710 Shop - Gestión de Tickets" });

                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                    new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                    new MessageButton().setCustomId("notificar").setLabel("Notificar").setStyle("SECONDARY").setEmoji("🔔")
                );

                await nChannel.send({ content: `<@${user.id}> | <@&${rolPermitidoId}>`, embeds: [embedT], components: [row] });
                return await interaction.editReply(`✅ Ticket abierto: ${nChannel}`);
            }
        }
    } catch (err) {
        console.error("Interaction Error:", err);
    }
});


client.login(process.env.TOKEN || config.token);
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