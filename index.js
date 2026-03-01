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
const { authenticator } = require('otplib'); // 🔐 NUEVO: Librería para el 2FA

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

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalVozId = "1475258262692827354";
const canalTranscriptsId = "1473454832567320768"; 
const canalLogsId = "1470928427199631412"; 
const canalWelcomeId = "1469953972197654570"; 
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
// 👋 EVENTO: BIENVENIDAS ESTILO PROFESIONAL
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
        // --- 1. GESTIÓN DE SLASH COMMANDS ---
        if (interaction.isCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            
            if (command) {
                await command.run(client, interaction);
                return; 
            }

            if (interaction.commandName === "renvembed") {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                
                const embedPanel = new MessageEmbed()
                    .setTitle("📩 CENTRO DE ATENCIÓN Y PARTNERS")
                    .setDescription("Selecciona una categoría para abrir un ticket o verificar tu partner.\n\n🛒 **Compras:** Para adquirir productos.\n🛠 **Soporte:** Dudas generales.\n🤝 **Partner:** Si cumples los requisitos.\n✅ **Verificar Partner:** Si ya tienes el canal del AD puesto.")
                    .setColor("#2f3136");
                
                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("ticket_compra").setLabel("Compras").setStyle("PRIMARY").setEmoji("🛒"),
                    new MessageButton().setCustomId("ticket_soporte").setLabel("Soporte").setStyle("SECONDARY").setEmoji("🛠"),
                    new MessageButton().setCustomId("ticket_partner").setLabel("Solicitar Partner").setStyle("SUCCESS").setEmoji("🤝"),
                    new MessageButton().setCustomId("verificar_partner").setLabel("Auto-Partner").setStyle("DANGER").setEmoji("✅")
                );
                
                await interaction.channel.send({ embeds: [embedPanel], components: [row] });
                await interaction.reply({ content: "✅ Panel enviado correctamente.", ephemeral: true });
                return; 
            }

            // --- COMANDO PARA EL PANEL 2FA ---
            if (interaction.commandName === "2facode") {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });

                const embed2FA = new MessageEmbed()
                    .setTitle("🔐 GENERADOR DE CÓDIGOS 2FA")
                    .setDescription("Obtén tu código de verificación al instante.\n\nPresiona el botón e introduce tu **Secret Key** para generar el código de 6 dígitos.")
                    .setColor("#f08221")
                    .setFooter({ text: "Sistema de Seguridad 710 Shop" });

                const row2FA = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("btn_2fa_generar").setLabel("Generar Código").setStyle("SUCCESS").setEmoji("🔑")
                );

                await interaction.channel.send({ embeds: [embed2FA], components: [row2FA] });
                return interaction.reply({ content: "✅ Panel 2FA enviado.", ephemeral: true });
            }
            return; 
        }

        // --- 2. GESTIÓN DE BOTONES ---
        if (interaction.isButton()) {
            const { customId, member, user, guild } = interaction;
            
            // Botón del 2FA
            if (customId === "btn_2fa_generar") {
                const modal2FA = new Modal().setCustomId('modal_auth_2fa').setTitle('Generar Código 2FA');
                const inputSecret = new TextInputComponent()
                    .setCustomId('secret_input')
                    .setLabel("Introduce tu Secret Key (Base32)")
                    .setStyle('SHORT')
                    .setPlaceholder('Ejemplo: JBSWY3DPEHPK3PXP')
                    .setRequired(true);

                modal2FA.addComponents(new MessageActionRow().addComponents(inputSecret));
                return await interaction.showModal(modal2FA);
            }

            if (customId === "notificar_usuario") {
                if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ Solo el Staff puede usar esto.", ephemeral: true });
                await interaction.channel.send({ content: `🔔 **Atención:** El Staff solicita tu presencia en este ticket, <@${interaction.channel.topic}>.` });
                return interaction.reply({ content: "✅ Usuario notificado.", ephemeral: true });
            }

            if (customId === "verificar_partner") {
                await interaction.deferReply({ ephemeral: true }); 
                if (member.roles.cache.has(rolPartnerAutoId)) return interaction.editReply({ content: "✅ Ya tienes el rango de Partner." });
                try {
                    await member.roles.add(rolPartnerAutoId);
                    return interaction.editReply({ content: "🎉 ¡Verificado! Ahora tienes acceso a la sección de partners." });
                } catch (e) {
                    return interaction.editReply({ content: "❌ No pude darte el rol. Revisa mi jerarquía." });
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

            if (customId.startsWith("ticket_")) {
                const tipo = customId.split('_')[1];
                const modal = new Modal().setCustomId(`modal_${tipo}`).setTitle(`Formulario de ${tipo.toUpperCase()}`);
                if (tipo === "compra") {
                    modal.addComponents(
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_producto').setLabel("¿Qué producto deseas?").setStyle('SHORT').setRequired(true)),
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_metodo').setLabel("¿Qué método de pago usarás?").setStyle('SHORT').setRequired(true))
                    );
                } else {
                    modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_detalle').setLabel("Escribe tu duda o motivo").setStyle('PARAGRAPH').setRequired(true)));
                }
                return await interaction.showModal(modal);
            }
        }

        // --- 3. GESTIÓN DE MODALES ---
        if (interaction.isModalSubmit()) {
            const { customId, user, guild, channel, fields } = interaction;
            
            // Lógica para procesar la Secret Key y dar el código
            if (customId === 'modal_auth_2fa') {
                const secret = fields.getTextInputValue('secret_input').replace(/\s+/g, ''); // Limpiar espacios
                try {
                    const token = authenticator.generate(secret);
                    const timeLeft = 30 - (Math.floor(Date.now() / 1000) % 30);

                    const embedCode = new MessageEmbed()
                        .setTitle("🔑 CÓDIGO GENERADO")
                        .setDescription(`Tu código de verificación es:\n# \`${token}\``)
                        .addField("⏳ Expira en", `\`${timeLeft} segundos\``)
                        .setColor("GREEN")
                        .setFooter({ text: "Seguridad 710 Shop" });

                    return interaction.reply({ embeds: [embedCode], ephemeral: true });
                } catch (e) {
                    return interaction.reply({ content: "❌ **Error:** La Secret Key es inválida. Asegúrate de copiarla bien.", ephemeral: true });
                }
            }

            // --- NUEVA LÓGICA PARA EMBEDS (SOLO ESTO SE AÑADIÓ) ---
            if (customId === 'modal_embed_custom') {
                const titulo = fields.getTextInputValue('titulo_embed');
                const descripcion = fields.getTextInputValue('desc_embed');
                const color = fields.getTextInputValue('color_embed') || "#2f3136";

                const embedGenerado = new MessageEmbed()
                    .setTitle(titulo)
                    .setDescription(descripcion)
                    .setColor(color)
                    .setTimestamp();

                await channel.send({ embeds: [embedGenerado] });
                return interaction.reply({ content: "✅ Embed enviado correctamente.", ephemeral: true });
            }

            // Lógica para tickets (Se añadió la excepción de modal_embed_custom para que no cree canal)
            if (customId.startsWith('modal_') && customId !== 'modal_nota_cierre' && customId !== 'modal_embed_custom') {
                await interaction.deferReply({ ephemeral: true });
                const tipo = customId.split('_')[1];
                const nombreLimpio = user.username.replace(/[^a-zA-Z0-9]/g, "") || user.id;
                const idTicketAleatorio = Math.floor(1000000000 + Math.random() * 9000000000);

                let emojiPrefix = "";
                if (tipo === "compra") emojiPrefix = "🛒buy-";
                else if (tipo === "soporte") emojiPrefix = "🛠support-" : (tipo === "partner") ? "🤝partner-" : `${tipo}-`;

                const nChannel = await guild.channels.create(`${emojiPrefix}${nombreLimpio}`, {
                    parent: CATEGORIAS[tipo.toUpperCase()],
                    topic: user.id, 
                    permissionOverwrites: [
                        { id: guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ]
                });

                const embedTicket = new MessageEmbed()
                    .setAuthor({ name: "710 Bot Shop", iconURL: guild.iconURL({ dynamic: true }) })
                    .setTitle("SISTEMA DE TICKETS")
                    .setDescription(`¡Bienvenido/a ${user}! El Staff te atenderá pronto.\nPor favor, danos los detalles necesarios.`)
                    .setColor("#2f3136")
                    .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Discord_logo_orange.svg/1200px-Discord_logo_orange.svg.png")
                    .addFields(
                        { name: "Categoría", value: `\`${tipo.charAt(0).toUpperCase() + tipo.slice(1)}\``, inline: true },
                        { name: "ID del Ticket", value: `\`${idTicketAleatorio}\``, inline: true },
                        { name: "Fecha", value: `\`${moment().format('DD/MM/YYYY HH:mm')}\``, inline: true },
                        { name: "Usuario", value: `${user.tag} (${user.id})`, inline: false }
                    );

                if (tipo === "compra") {
                    embedTicket.addFields(
                        { name: "📦 Producto", value: `\`\`\`${fields.getTextInputValue('p_producto')}\`\`\``, inline: true },
                        { name: "💳 Método", value: `\`\`\`${fields.getTextInputValue('p_metodo')}\`\`\``, inline: true }
                    );
                } else {
                    embedTicket.addFields({ name: "📝 Detalles", value: `\`\`\`${fields.getTextInputValue('p_detalle')}\`\`\``, inline: false });
                }

                embedTicket.setFooter({ text: `710 Shop - Gestión de Tickets • ${moment().format('LTS')}` });

                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                    new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                    new MessageButton().setCustomId("notificar_usuario").setLabel("Notificar").setStyle("PRIMARY").setEmoji("🔔")
                );

                await nChannel.send({ content: `${user} | <@&${rolPermitidoId}>`, embeds: [embedTicket], components: [row] });
                return interaction.editReply(`✅ Canal creado: ${nChannel}`);
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
// 📡 AUDITORÍA (LOGS)
// ==========================================
client.on('messageDelete', m => { if (!m.guild || m.author?.bot) return; enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("RED").addFields({ name: "Autor", value: `${m.author.tag}`, inline: true }, { name: "Canal", value: `${m.channel}`, inline: true }, { name: "Contenido", value: m.content || "Sin texto" }).setTimestamp()); });
client.on('messageUpdate', (o, n) => { if (!o.guild || o.author?.bot || o.content === n.content) return; enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("YELLOW").addFields({ name: "Autor", value: `${o.author.tag}` }, { name: "Antes", value: o.content || "Vacío" }, { name: "Después", value: n.content || "Vacío" }).setTimestamp()); });
client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setDescription(`Nombre: **${c.name}**`).setColor("GREEN").setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🚫 Canal Eliminado").setDescription(`Nombre: **${c.name}**`).setColor("RED").setTimestamp()));

// ==========================================
// 🚀 INICIO
// ==========================================
client.on('ready', async () => {
    console.log(`🔥 ${client.user.username} - OPERATIVO`);
    
    const guild = client.guilds.cache.get(ID_SERVIDOR);
    
    // --- CONEXIÓN AUTOMÁTICA AL CANAL DE VOZ ---
    if (guild) {
        const voiceChannel = guild.channels.cache.get(canalVozId);
        
        if (voiceChannel && voiceChannel.type === 'GUILD_VOICE') {
            const { joinVoiceChannel } = require('@discordjs/voice');
            
            try {
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true, // 🎧 ESTO LO ENSORDECE
                    selfMute: true  // 🎤 TAMBIÉN LO SILENCIA
                });
                console.log(`🔊 Conectado y ensordecido en: ${voiceChannel.name}`);
            } catch (error) {
                console.error("❌ Error al conectar al canal de voz:", error);
            }
        }

        // Registro de comandos (Mantenemos los tuyos)
        await guild.commands.set([
            { name: 'reseller', description: 'Asignar rango Reseller', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario' }] },
            { name: 'customer', description: 'Asignar rango Customer', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario' }] },
            { name: 'ultra', description: 'Asignar rango Ultra', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario' }] },
            { name: 'renvembed', description: 'Re-enviar el panel de tickets' },
            { name: 'embed', description: 'Enviar un mensaje personalizado' },
            { name: '2facode', description: 'Enviar el panel generador de 2FA' },
            { name: 'mp', description: 'Ver métodos de pago' }
        ]);
    }
});

client.login(process.env.TOKEN || config.token);