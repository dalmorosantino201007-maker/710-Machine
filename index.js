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
const canalLogsId = "1470928427199631412"; 
const canalWelcomeId = "1469618755037429792"; // 👈 ASEGÚRATE QUE ESTE ID SEA EL DE BIENVENIDAS
const rolPartnerAutoId = "1470862847671140412"; 
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

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch((e) => console.error("Error enviando log:", e));
};

// ==========================================
// 👋 EVENTO: WELCOME (BIENVENIDAS)
// ==========================================
client.on('guildMemberAdd', async (member) => {
    const canal = member.guild.channels.cache.get(canalWelcomeId);
    if (!canal) return;

    const embedWelcome = new MessageEmbed()
        .setTitle("👋 ¡Bienvenido a 710 Bot Shop!")
        .setDescription(`Hola ${member}, gracias por unirte a **${member.guild.name}**.\n\n> No olvides leer las normas y abrir un ticket si deseas comprar algo.`)
        .setColor("#2f3136")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage("https://i.imgur.com/Tu7vI7h.png") // Puedes cambiar esta URL por un banner
        .setFooter({ text: `Eres el miembro número ${member.guild.memberCount}` })
        .setTimestamp();

    canal.send({ content: `Bienvenido/a ${member}! 🚀`, embeds: [embedWelcome] });
});

// ==========================================
// 🕹️ EVENTO: INTERACTION CREATE
// ==========================================

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (command) return await command.run(client, interaction);

            // COMANDO RENVEMBED (PARA ENVIAR LOS PANELES)
            if (interaction.commandName === "renvembed") {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });

                const embedPanel = new MessageEmbed()
                    .setTitle("📩 CENTRO DE ATENCIÓN Y PARTNERS")
                    .setDescription("Selecciona una categoría para abrir un ticket o verificar tu partner.\n\n🛒 **Compras:** Para adquirir productos.\n🛠 **Soporte:** Dudas generales.\n🤝 **Partner:** Si cumples los requisitos.\n✅ **Verificar Partner:** Si ya tienes el canal del AD puesto.")
                    .setColor("#2f3136")
                    .setFooter({ text: "710 Bot Shop" });

                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("ticket_compra").setLabel("Compras").setStyle("PRIMARY").setEmoji("🛒"),
                    new MessageButton().setCustomId("ticket_soporte").setLabel("Soporte").setStyle("SECONDARY").setEmoji("🛠"),
                    new MessageButton().setCustomId("ticket_partner").setLabel("Solicitar Partner").setStyle("SUCCESS").setEmoji("🤝"),
                    new MessageButton().setCustomId("verificar_partner").setLabel("Auto-Partner").setStyle("DANGER").setEmoji("✅")
                );

                await interaction.channel.send({ embeds: [embedPanel], components: [row] });
                return interaction.reply({ content: "✅ Panel enviado correctamente.", ephemeral: true });
            }

            // COMANDO EMBED (SIMPLE)
            if (interaction.commandName === "embed") {
                const embedSimple = new MessageEmbed()
                    .setTitle("710 Bot Shop")
                    .setDescription("Comando de embed funcionando correctamente.")
                    .setColor("#2f3136");
                return interaction.reply({ embeds: [embedSimple] });
            }

            if (["reseller", "customer", "ultra"].includes(interaction.commandName)) {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) {
                    return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                }

                const targetUser = interaction.options.getMember('usuario');
                let rolId = "";
                let prefijo = "";
                let titulo = "";
                let mensajeExtra = "";

                if (interaction.commandName === "reseller") {
                    rolId = "1473471902810112062";
                    prefijo = "Reseller";
                    titulo = "¡Bienvenido al equipo de Reseller!";
                    mensajeExtra = "**En todos nuestros productos cuentas con un gran descuento para poder hacer las mejores ventas en tu shop.**";
                } else if (interaction.commandName === "customer") {
                    rolId = "1470894748041482416"; 
                    prefijo = "Customer";
                    titulo = "¡Gracias por tu compra! (Customer)";
                    mensajeExtra = "Gracias por confiar en **710 Bot Shop**. Ahora tienes acceso a beneficios exclusivos para clientes.";
                } else if (interaction.commandName === "ultra") {
                    rolId = "1470865175866507394"; 
                    prefijo = "Ultra Customer";
                    titulo = "¡Eres un miembro VIP (Ultra Customer)!";
                    mensajeExtra = "Has alcanzado el rango **Ultra**. Disfruta de la máxima prioridad y los mejores descuentos de la tienda.";
                }

                try {
                    await targetUser.roles.add(rolId);
                    await targetUser.setNickname(`${prefijo} | ${targetUser.user.username}`);

                    const embedRango = new MessageEmbed()
                        .setAuthor({ name: "710 Bot Shop", iconURL: client.user.displayAvatarURL() })
                        .setTitle(`🎉 ${titulo}`)
                        .setColor("#2f3136")
                        .setThumbnail(targetUser.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`¡Hola ${targetUser}! 🎉\n\n${mensajeExtra}`)
                        .setFooter({ text: `710 Shop • ${moment().format('DD/MM/YYYY HH:mm')}` });

                    return await interaction.reply({ embeds: [embedRango] });
                } catch (e) {
                    return interaction.reply({ content: "❌ Error: Revisa mis permisos o jerarquía de roles.", ephemeral: true });
                }
            }

            if (interaction.commandName === "mp") {
                const embedPagos = new MessageEmbed()
                    .setTitle("💳 MÉTODOS DE PAGO")
                    .setColor("#5865F2")
                    .setDescription("💙 **PayPal:** `la710storeshop@gmail.com` \n💳 **Mercado Pago:** `710shop` (Santino Dal Moro)")
                    .setTimestamp();
                return await interaction.reply({ embeds: [embedPagos] });
            }
        }

        if (interaction.isButton()) {
            const { customId, member, user, guild } = interaction;
            
            if (customId === "verificar_partner") {
                try {
                    if (member.roles.cache.has(rolPartnerAutoId)) {
                        return interaction.reply({ content: "✅ Ya tienes el rol de Partner.", ephemeral: true });
                    }
                    await member.roles.add(rolPartnerAutoId);
                    
                    const embedLogPartner = new MessageEmbed()
                        .setTitle("🤝 Nuevo Partner Auto-Asignado")
                        .setColor("BLUE")
                        .setDescription(`El usuario ${user} se ha verificado como Partner.`)
                        .setTimestamp();
                    enviarLog(embedLogPartner);

                    return interaction.reply({ content: "🎉 ¡Se te ha asignado el rol de Partner correctamente!", ephemeral: true });
                } catch (e) {
                    console.error(e);
                    return interaction.reply({ content: "❌ No pude asignarte el rol. Revisa que mi rol esté por encima del de Partner.", ephemeral: true });
                }
            }

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

            if (customId.startsWith("ticket_")) {
                const tipo = customId.split('_')[1]; 
                const modal = new Modal().setCustomId(`modal_${tipo}`).setTitle(`Ticket de ${tipo.toUpperCase()}`);

                if (tipo === "compra") {
                    modal.addComponents(
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_producto').setLabel("¿Qué producto deseas comprar?").setStyle('SHORT').setRequired(true)),
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_metodo').setLabel("¿Qué método de pago usarás?").setStyle('SHORT').setRequired(true))
                    );
                } else if (tipo === "soporte") {
                    modal.addComponents(
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_duda').setLabel("¿En qué necesitas ayuda?").setStyle('PARAGRAPH').setRequired(true))
                    );
                } else if (tipo === "partner") {
                    modal.addComponents(
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_link').setLabel("Link de tu servidor de Discord").setStyle('SHORT').setRequired(true)),
                        new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_add').setLabel("¿Ya pusiste nuestro ad?").setStyle('SHORT').setPlaceholder("Sí / No").setRequired(true))
                    );
                }
                return await interaction.showModal(modal);
            }
        }

        if (interaction.isModalSubmit()) {
            const { customId, fields, guild, channel, user } = interaction;

            if (customId === 'modal_nota_cierre') {
                await interaction.deferReply();
                const transcript = await transcripts.createTranscript(channel);
                await client.channels.cache.get(canalTranscriptsId).send({ content: `Transcript: ${channel.name}`, files: [transcript] });
                
                const embedCierreLog = new MessageEmbed()
                    .setTitle("🔒 Ticket Cerrado")
                    .setColor("RED")
                    .addFields(
                        { name: "Canal", value: `${channel.name}`, inline: true },
                        { name: "Cerrado por", value: `${user.tag}`, inline: true }
                    )
                    .setTimestamp();
                enviarLog(embedCierreLog);

                await interaction.editReply("🔒 Cerrando...");
                return setTimeout(() => channel.delete().catch(() => {}), 3000);
            }

            if (customId.startsWith('modal_')) {
                await interaction.deferReply({ ephemeral: true });
                const tipo = customId.split('_')[1];
                let nombreCanal = "";
                const ticketID = Math.floor(Math.random() * 9000000000) + 1000000000;

                const embedT = new MessageEmbed()
                    .setAuthor({ name: "710 Bot Shop", iconURL: client.user.displayAvatarURL() })
                    .setTitle("SISTEMA DE TICKETS")
                    .setColor("#2f3136")
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`¡Bienvenido/a ${user}! El Staff te atenderá pronto.\nPor favor, danos los detalles necesarios.`)
                    .addFields(
                        { name: "Categoría", value: `\`${tipo.toUpperCase()}\``, inline: true },
                        { name: "ID del Ticket", value: `\`${ticketID}\``, inline: true },
                        { name: "Fecha", value: `\`${moment().format('DD/MM/YYYY HH:mm')}\``, inline: true },
                        { name: "Usuario", value: `${user} (${user.id})` }
                    );

                if (tipo === "compra") {
                    nombreCanal = `🛒buy-${user.username}`;
                    const producto = fields.getTextInputValue('p_producto');
                    const metodo = fields.getTextInputValue('p_metodo');
                    embedT.addFields(
                        { name: "📦 Producto", value: `\`${producto}\``, inline: true },
                        { name: "💳 Método", value: `\`${metodo}\``, inline: true }
                    );
                } else if (tipo === "soporte") {
                    nombreCanal = `🛠soporte-${user.username}`;
                    const duda = fields.getTextInputValue('p_duda');
                    embedT.addFields({ name: "❓ Ayuda", value: `\`\`\`${duda}\`\`\`` });
                } else if (tipo === "partner") {
                    nombreCanal = `🤝partner-${user.username}`;
                    const link = fields.getTextInputValue('p_link');
                    const add = fields.getTextInputValue('p_add');
                    embedT.addFields(
                        { name: "🔗 Link", value: `\`${link}\``, inline: true },
                        { name: "📢 Ad Puesto", value: `\`${add}\``, inline: true }
                    );
                }

                embedT.setFooter({ text: `710 Shop - Gestión de Tickets • ${moment().format('DD/MM/YYYY HH:mm')}` });

                const nChannel = await guild.channels.create(nombreCanal, {
                    parent: CATEGORIAS[tipo.toUpperCase()],
                    permissionOverwrites: [
                        { id: guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ]
                });

                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                    new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                    new MessageButton().setCustomId("notificar").setLabel("Notificar").setStyle("SECONDARY").setEmoji("🔔")
                );

                await nChannel.send({ content: `<@${user.id}> | <@&${rolPermitidoId}>`, embeds: [embedT], components: [row] });
                
                const embedLogApertura = new MessageEmbed()
                    .setTitle("📂 Nuevo Ticket Abierto")
                    .setColor("GREEN")
                    .setDescription(`Se ha creado un nuevo ticket en ${nChannel}`)
                    .addFields(
                        { name: "Usuario", value: `${user.tag}`, inline: true },
                        { name: "ID Ticket", value: `${ticketID}`, inline: true }
                    )
                    .setTimestamp();
                enviarLog(embedLogApertura);

                return await interaction.editReply(`✅ Ticket abierto: ${nChannel}`);
            }
        }
    } catch (err) {
        console.error("Interaction Error:", err);
    }
});

// --- LOGS DE MENSAJES ---
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
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("#ffff00").addFields({ name: "Autor", value: `${o.author.tag}`, inline: true }, { name: "Antes", value: `\`\`\`${o.content.slice(0, 1000) || "Sin contenido previo"}\`\`\`` }, { name: "Después", value: `\`\`\`${n.content.slice(0, 1000) || "Sin contenido"}\`\`\`` }).setTimestamp());
});

client.on('ready', async () => {
    console.log(`🔥 ${client.user.username} - OPERATIVO`);

    const { joinVoiceChannel } = require('@discordjs/voice');
    const ID_CANAL_VOZ = '1475258262692827354'; 
    const ID_SERVIDOR = '1469618754282586154'; 

    try {
        const canal = client.channels.cache.get(ID_CANAL_VOZ);
        if (canal) joinVoiceChannel({ channelId: canal.id, guildId: ID_SERVIDOR, adapterCreator: canal.guild.voiceAdapterCreator, selfDeaf: true, selfMute: false });
    } catch (error) {}

    try {
        // --- 📋 REGISTRO DE COMANDOS ---
        const comandosManuales = [
            { name: 'reseller', description: 'Rango Reseller', options: [{ name: 'usuario', type: 'USER', description: 'Usuario', required: true }] },
            { name: 'customer', description: 'Rango Customer', options: [{ name: 'usuario', type: 'USER', description: 'Usuario', required: true }] },
            { name: 'ultra', description: 'Rango Ultra Customer', options: [{ name: 'usuario', type: 'USER', description: 'Usuario', required: true }] },
            { name: 'mp', description: 'Métodos de pago' },
            { name: 'renvembed', description: 'Re-enviar el panel de tickets y partner' }, // 👈 AGREGADO
            { name: 'embed', description: 'Prueba de embed' } // 👈 AGREGADO
        ];

        const guild = client.guilds.cache.get(ID_SERVIDOR);
        if (guild) {
            await guild.commands.set(comandosManuales);
            console.log("🚀 Comandos registrados con éxito.");
        }
    } catch (error) {
        console.error("Error comandos:", error);
    }
    enviarLog(new MessageEmbed().setTitle("✅ Bot Online").setColor("GREEN").setTimestamp());
});

client.login(process.env.TOKEN || config.token);