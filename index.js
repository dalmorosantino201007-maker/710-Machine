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



// --- 🛠️ CONFIGURACIÓN DE IDs ---

const rolPermitidoId = "1469967630365622403"; 

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

        

        canal.send({ content: `¡Bienvenido/a ${member}! 🚀`, embeds: [embedWelcome] }).catch(console.error);

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

                return interaction.reply({ content: "✅ Panel enviado correctamente.", ephemeral: true });

            }

            return; 

        }



        if (interaction.isButton()) {

            const { customId, member, user, guild } = interaction;

            

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



        if (interaction.isModalSubmit()) {

            const { customId, user, guild, channel, fields } = interaction;

            

            if (customId.startsWith('modal_') && customId !== 'modal_nota_cierre') {

                await interaction.deferReply({ ephemeral: true });

                const tipo = customId.split('_')[1];

                const nombreLimpio = user.username.replace(/[^a-zA-Z0-9]/g, "") || user.id;

                const idTicketAleatorio = Math.floor(1000000000 + Math.random() * 9000000000);



                let emojiPrefix = "";

                if (tipo === "compra") emojiPrefix = "🛒buy-";

                else if (tipo === "soporte") emojiPrefix = "🛠support-";

                else if (tipo === "partner") emojiPrefix = "🤝partner-";

                else emojiPrefix = `${tipo}-`;



                const nChannel = await guild.channels.create(`${emojiPrefix}${nombreLimpio}`, {

                    parent: CATEGORIAS[tipo.toUpperCase()],

                    topic: user.id, // Guardamos el ID del usuario aquí para el botón notificar

                    permissionOverwrites: [

                        { id: guild.id, deny: ['VIEW_CHANNEL'] },

                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },

                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }

                    ]

                });



                // --- EMBED ESTILO IMAGEN (CORREGIDO) ---

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
    if (guild) {
        await guild.commands.set([
            { name: 'reseller', description: 'Asignar rango Reseller', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario' }] },
            { name: 'customer', description: 'Asignar rango Customer', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario' }] },
            { name: 'ultra', description: 'Asignar rango Ultra', options: [{ name: 'usuario', type: 'USER', required: true, description: 'Usuario' }] },
            { name: 'renvembed', description: 'Re-enviar el panel de tickets' },
            { name: 'mp', description: 'Ver métodos de pago' }
        ]);
    }
});

client.login(process.env.TOKEN || config.token);