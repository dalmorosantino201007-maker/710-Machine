require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // <--- LA PIEZA QUE FALTABA
const config = require('./DataBaseJson/config.json');

// Luego sigue tu código normal: const client = new Client({ ... });

const someAsyncOperation = async () => {
  // Simulación de una operación asíncrona
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Operación completada');
    }, 1000); // Simula una operación que tarda 1 segundo
  });
};

module.exports = { someAsyncOperation };

const client = new Client({
  intents: [ 
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildPresences,
GatewayIntentBits.GuildMessageReactions,
GatewayIntentBits.GuildMessageTyping,
GatewayIntentBits.GuildVoiceStates
       ],
       partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    const embedCommand = require("./Comandos/utilidades/embed.js");

// Registra el manejador de interacciones
embedCommand.registerInteractionHandler(client);

module.exports = client

client.on("interactionCreate", async (interaction) => {
  try {
    // Slash commands
    if (interaction.type === Discord.InteractionType.ApplicationCommand) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) {
        return interaction.reply({ content: "Error: Comando no encontrado.", ephemeral: true });
      }

      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);
      await cmd.run(client, interaction);
    }

    // Botones
    if (interaction.isButton()) {
      if (interaction.customId === "copiar_cvu") {
        return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
      }

      if (interaction.customId === "copiar_cvu22") {
        return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
      }

     if (interaction.customId === "copiar_alias22") {
        return interaction.reply({ content: "710shop", ephemeral: true });
      }

      if (interaction.customId === "copiar_alias") {
        return interaction.reply({ content: "710shop", ephemeral: true });
      }

      if (interaction.customId === "ingresar_clave_2fa") {
        const modal = new Discord.ModalBuilder()
          .setCustomId("clave_2fa_modal")
          .setTitle("🔐 Clave Secreta 2FA");

        const claveInput = new Discord.TextInputBuilder()
          .setCustomId("clave_2fa_input")
          .setLabel("Ingresa tu clave secreta")
          .setStyle(Discord.TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder("Ej: JBSWY3DPEHPK3PXP");

        const actionRow = new Discord.ActionRowBuilder().addComponents(claveInput);
        modal.addComponents(actionRow);

        return await interaction.showModal(modal);
      }

      // 🔹 Partner rol system
      if (interaction.customId === "partner_rol") {
        const rolId = "1470862847671140412"; // ID del rol
        const cargo = interaction.guild.roles.cache.get(rolId);

        if (!cargo) {
          return interaction.reply({
            content: "⚠️ El rol ya no existe en el servidor.",
            ephemeral: true
          });
        }

        if (!interaction.member.roles.cache.has(rolId)) {
          await interaction.member.roles.add(rolId);
          return interaction.reply({
            content: `<:checkwhite:1374234754366570576> | **${interaction.user.username}** obtuviste el **${cargo.name}**.`,
            ephemeral: true
          });
        } else {
          await interaction.member.roles.remove(rolId);
          return interaction.reply({
            content: `<:crosshost2:1384349772386664550> | **${interaction.user.username}** perdiste el **${cargo.name}**.`,
            ephemeral: true
          });
        }
      }
    } // <-- Cierra if (interaction.isButton())

    // Modal submit handler para clave 2FA
    if (interaction.isModalSubmit() && interaction.customId === "clave_2fa_modal") {
      const clave = interaction.fields.getTextInputValue("clave_2fa_input");

      try {
        const token = speakeasy.totp({
          secret: clave,
          encoding: "base32"
        });

        await interaction.reply({
          content: `✅ Tu código 2FA es: \`${token}\` (válido por 30 segundos)`,
          ephemeral: true
        });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: "❌ Clave inválida. Asegúrate de ingresarla correctamente en formato base32.",
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error("❌ Error en interactionCreate:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Ha ocurrido un error.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Ha ocurrido un error.", ephemeral: true });
    }
  }
});

client.on('ready', async () => {
  console.log(`🔥 Estoy online en ${client.user.username}!`);
  await registerCommands();

  // ✅ Estado fijo
  client.user.setActivity("discord.gg/hostgg", {
    type: Discord.ActivityType.Watching
  });
});


client.slashCommands = new Collection()

client.login(process.env.TOKEN);

require('./handler')(client)

// Ruta del archivo de la base de datos
const dbPath = path.join(__dirname, 'tickets.db');

// Crear base de datos y tablas
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creatorId TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Crear tabla para el conteo de tickets
        db.run(`CREATE TABLE IF NOT EXISTS conteo_tickets (
            total INT DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error("Error al crear la tabla de conteo de tickets:", err.message);
            } else {
                // Inicializar el conteo si la tabla está vacía
                db.get(`SELECT total FROM conteo_tickets`, (err, row) => {
                    if (err) {
                        console.error("Error al obtener el conteo de tickets:", err.message);
                    } else if (!row) {
                        // Si no hay registros, inicializarlo en 0
                        db.run(`INSERT INTO conteo_tickets (total) VALUES (0)`);
                    }
                });
            }
        });
    }
});

// Objeto para almacenar el estado de cada ticket
let estadoTickets = {};
const rolPermitidoId = "1469967630365622403"; // ID del STAFF

const moment = require('moment');
moment.locale('es');

client.on("interactionCreate", async (interaction) => {
    const ticketId = interaction.channel?.id;

    // 🔹 Si es un envío de modal
    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_")) {
 const opc = interaction.customId; // modal_opc1, modal_opc2, modal_opc3
    let nome, categoria, ticketKey, respuestas = [];

    if (opc === "modal_opc1") {
        nome = `🛒・compra-${interaction.user.tag}`;
        categoria = config.ticket.ticket1.categoria;
        ticketKey = "ticket1";
        respuestas = [
            { name: "🛒 Producto:", value: interaction.fields.getTextInputValue("producto") },
            { name: "💳 Método de pago:", value: interaction.fields.getTextInputValue("metodo_pago") },
            { name: "📄 Cantidad:", value: interaction.fields.getTextInputValue("cantidad_compra") }
        ];
    }

    if (opc === "modal_opc2") {
        nome = `🔨・soporte-${interaction.user.tag}`;
        categoria = config.ticket.ticket2.categoria;
        ticketKey = "ticket2";
        respuestas = [
            { name: "🔨 Producto:", value: interaction.fields.getTextInputValue("producto") },
            { name: "⚠️ Problema:", value: interaction.fields.getTextInputValue("problema") },
            { name: "📄 Info adicional:", value: interaction.fields.getTextInputValue("informacion_extra") || "Ninguna" }
        ];
    }

    if (opc === "modal_opc3") {
        nome = `🤝・partner-${interaction.user.tag}`;
        categoria = config.ticket.ticket3.categoria;
        ticketKey = "ticket3";
        respuestas = [
            { name: "🌐 Servidor:", value: interaction.fields.getTextInputValue("servidor") },
            { name: "👥 ¿+100 Miembros?:", value: interaction.fields.getTextInputValue("miembros") },
            { name: "🎯 Ya envio nuestro ad:", value: interaction.fields.getTextInputValue("nuestroad") }
        ];
    }

    if (!interaction.guild.channels.cache.get(categoria)) categoria = null;

    // 🔍 Buscar si ya existe un ticket con el mismo creador
    const existingTicketChannel = interaction.guild.channels.cache.find(
        c => estadoTickets[c.id]?.creadorId === interaction.user.id
    );

    if (existingTicketChannel) {
        const embedYaExiste = new Discord.EmbedBuilder()
            .setAuthor({ 
                name: "Sistema de Tickets", 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTitle("⚠️ ¡__Ya tienes un ticket abierto__! ")
            .setColor(config.colorpredeterminado)
            .setDescription(
                `**${interaction.user}**, detectamos que ya tienes un ticket activo.\n\n` +
                `🎟️ Ticket: https://discord.com/channels/${interaction.guild.id}/${existingTicketChannel.id}\n\n` +
                `📝 Por favor utiliza el ticket ya creado antes de abrir uno nuevo.`
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        const linkButton = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setLabel("🔗 Ir al Ticket")
                .setStyle(Discord.ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${existingTicketChannel.id}`)
        );

        return interaction.reply({ embeds: [embedYaExiste], components: [linkButton], ephemeral: true });
    }

    // Crear canal del ticket
    const ch = await interaction.guild.channels.create({
        name: nome,
        type: Discord.ChannelType.GuildText,
        parent: categoria,
        permissionOverwrites: [
            { id: interaction.guild.id, deny: [Discord.PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.AttachFiles, Discord.PermissionFlagsBits.EmbedLinks, Discord.PermissionFlagsBits.AddReactions] },
            { id: "1469967630365622403", allow: [Discord.PermissionFlagsBits.ViewChannel] },
            { id: rolPermitidoId, allow: opc !== "modal_opc1" ? [Discord.PermissionFlagsBits.ViewChannel] : [] }
        ]
    });

    // Guardar en DB
    db.run(`INSERT INTO tickets (creatorId) VALUES (?)`, [interaction.user.id], function(err) {
        if (err) return console.error(err);

        const ticketDbId = this.lastID;
        estadoTickets[ch.id] = { creadorId: interaction.user.id, reclamado: false, fechaCreacion: new Date(), ticketId: ticketDbId };

        db.run(`UPDATE conteo_tickets SET total = total + 1`, err => { if(err) console.error(err); });

        // ✅ Embed de confirmación efímera al usuario
        const embedResponse = new Discord.EmbedBuilder()
            .setAuthor({ 
                name: "Sistema de Tickets", 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTitle(`¡__Ticket N° ${ticketDbId} creado con éxito__!`)
            .setColor(config.colorpredeterminado)
            .setDescription(
                `¡Hola ${interaction.user}! 👋\n\n` +
                `✅ Tu ticket ha sido abierto correctamente.\n\n` +
                `📌 **Nuestro equipo revisará tu ticket lo antes posible.**\n` +
                `🖤 Gracias por confiar en nuestro soporte.`
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "📂 Estado:", value: "🟢 **Abierto**", inline: true },
                { name: "👤 Usuario:", value: `${interaction.user}`, inline: true }
            )
            .setTimestamp();

            const linkButton = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder().setLabel("🔗 Ir al Ticket").setStyle(Discord.ButtonStyle.Link).setURL(`https://discord.com/channels/${interaction.guild.id}/${ch.id}`)
            );

        interaction.reply({
            embeds: [embedResponse], components: [linkButton],
            ephemeral: true
        });

        // Embed con info general del ticket
        const embedTicket = new Discord.EmbedBuilder()
            .setTitle(`Sistema De Tickets`)
            .setColor(config.colorpredeterminado)
            .setDescription(`¡Bienvenido/a! Un miembro del staff atenderá tu ticket pronto.`)
            .addFields(
                { name: '👤 Usuario', value: `${interaction.user}`, inline: true },
                { name: '🎟️ Ticket N°', value: `${ticketDbId}`, inline: true },
                { name: '🏷️ Categoría', value: `${config.ticket[ticketKey].nome}`, inline: true }
            )
            .setTimestamp();

        // Embed con respuestas del formulario
        const embedFormulario = new Discord.EmbedBuilder()
            .setTitle("📋 Respuestas del Formulario")
            .setColor(config.colorpredeterminado)
            .addFields(respuestas)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Ticket abierto por ${interaction.user.tag}` })
            .setTimestamp();

        // 🔘 Botones de control para staff
        const controlButtons = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder().setCustomId("fechar_ticket").setLabel("Cerrar").setEmoji("🔒").setStyle(Discord.ButtonStyle.Danger),
            new Discord.ButtonBuilder().setCustomId("claim_ticket").setLabel("Reclamar").setEmoji("✅").setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder().setCustomId("notify_ticket").setLabel("Notificar").setEmoji("📩").setStyle(Discord.ButtonStyle.Primary)
        );

        // Enviar mensajes al canal del ticket
        ch.send({ content: `<@${interaction.user.id}>`, embeds: [embedTicket], components: [controlButtons] });
        ch.send({ embeds: [embedFormulario] }).then(m => m.pin());
    });

        return;
}

    // 🔹 Si es un botón
    if (interaction.isButton()) {
        const opc = interaction.customId;

        // Mostrar modal según el botón presionado
        if (["opc1", "opc2", "opc3"].includes(opc)) {
            let modal;
            if (opc === "opc1") {
                modal = new Discord.ModalBuilder()
                    .setCustomId("modal_opc1")
                    .setTitle("Formulario de Ticket - Compras")
                    .addComponents(
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId("producto")
                                .setLabel("¿Qué producto deseas comprar?")
                                .setPlaceholder("Ej: Rockstar Account")
                                .setStyle(Discord.TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId("metodo_pago")
                                .setLabel("¿Qué método de pago prefieres?")
                                .setPlaceholder("Ej: MercadoPago, Binance, Prex, etc.")
                                .setStyle(Discord.TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId("cantidad_compra")
                                .setLabel("Cantidad")
                                .setPlaceholder("Ej: 1, 2, 5, etc.")
                                .setStyle(Discord.TextInputStyle.Short)
                                .setRequired(true)
                        )
                    );
            }

 if (opc === "opc2") {
        modal = new Discord.ModalBuilder()
            .setCustomId("modal_opc2")
            .setTitle("Formulario de Ticket - Soporte");

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId("producto")
                    .setLabel("¿Que producto esta presentando problemas?")
                    .setPlaceholder("Ej: Discord Account")
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId("problema")
                    .setLabel("Describe el problema que tienes")
                    .setPlaceholder("Ej: No puedo acceder al webmail.")
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId("informacion_extra")
                    .setLabel("Información adicional (opcional)")
                    .setStyle(Discord.TextInputStyle.Paragraph)
                    .setRequired(false)
            )
        );
    }

    if (opc === "opc3") {
        modal = new Discord.ModalBuilder()
            .setCustomId("modal_opc3")
            .setTitle("Formulario de Ticket - Partner");

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId("servidor")
                    .setLabel("Enlace de tu servidor")
                    .setPlaceholder("Ej: discord.gg/ejemplo")
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId("miembros")
                    .setLabel("¿Tu servidor tiene mas de 250 miembros?")
                    .setPlaceholder("Si / No")
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId("nuestroad")
                    .setPlaceholder("Si / No")
                    .setLabel("¿Ya enviaste nuestro ad?")
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
            )
        );
    }

            return interaction.showModal(modal);
        }

///CLAIM TICKET
    if (opc === "claim_ticket") {
        const ticket = estadoTickets[ticketId];
        if (!ticket) return interaction.reply({ content: "❌ | Ticket no encontrado.", ephemeral: true });

        if (!interaction.member.roles.cache.has(rolPermitidoId))
            return interaction.reply({ content: "❌ | No tienes permiso para usar este botón.", ephemeral: true });

        if (ticket.reclamado) return interaction.reply({ content: `❌ | Este ticket ya fue reclamado por <@${ticket.reclamadorId}>.`, ephemeral: true });

        ticket.reclamado = true;
        ticket.reclamadorId = interaction.user.id;

        const embedClaim = new Discord.EmbedBuilder()
            .setTitle("📌 Ticket Reclamado")
            .setColor(config.colorpredeterminado)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setDescription("Este ticket ha sido reclamado por un miembro del staff.")
            .addFields(
                { name: '👤 Staff Asignado', value: `<@${ticket.reclamadorId}>`, inline: true },
                { name: '🕒 Fecha y hora', value: `\`${moment().format('LLLL')}\``, inline: true },
                { name: '🎟️ Ticket N°', value: `${ticket.ticketId}`, inline: true }
            )
            .setFooter({ text: "Sistema de Tickets | Host" })
            .setTimestamp();

        await interaction.channel.send({ embeds: [embedClaim] });
        await interaction.reply({ content: "✅ | Has reclamado este ticket exitosamente.", ephemeral: true });

        const creador = await interaction.guild.members.fetch(ticket.creadorId).catch(() => null);
        if (creador) {
            const embedNotificacion = new Discord.EmbedBuilder()
                .setTitle("✅ ¡Tu Ticket ha sido Reclamado!")
                .setColor(config.colorpredeterminado)
                .setDescription(`👨‍💼 Un miembro del staff ha tomado tu ticket.`)
                .addFields(
                    { name: '🎟️ Ticket N°', value: `${ticket.ticketId}`, inline: true },
                    { name: '👷 Staff Asignado', value: `<@${ticket.reclamadorId}>`, inline: true },
                    { name: '🥷 Servidor', value: `${interaction.guild.name}`, inline: true }
                )
                .setFooter({ text: "Sistema de Tickets | Gracias por tu paciencia 🖤" });

            const linkButton = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder().setLabel("🔗 Ir al Ticket").setStyle(Discord.ButtonStyle.Link).setURL(interaction.channel.url)
            );

            creador.send({ embeds: [embedNotificacion], components: [linkButton] }).catch(() => {});
        }
        return;
    }

///NOTIFICAR USUARIO
    if (opc === "notify_ticket") {
        const ticket = estadoTickets[ticketId];
        if (!ticket) return interaction.reply({ content: "❌ | Ticket no encontrado.", ephemeral: true });

        if (!interaction.member.roles.cache.has(rolPermitidoId))
            return interaction.reply({ content: "❌ | No tienes permiso para usar este botón.", ephemeral: true });

        const creador = await interaction.guild.members.fetch(ticket.creadorId).catch(() => null);
        if (!creador) return interaction.reply({ content: "❌ | No se pudo encontrar al creador del ticket.", ephemeral: true });

        const embedNotificacion = new Discord.EmbedBuilder()
            .setTitle("🔔 ¡Tienes una actualización en tu Ticket!")
            .setColor(config.colorpredeterminado)
            .setDescription("👋 ¡Hola! Tenemos nuevos mensajes sobre tu ticket.")
            .addFields(
                { name: '🎟️ Ticket N°', value: `${ticket.ticketId}`, inline: true },
                { name: '👷 Staff Asignado', value: `<@${ticket.reclamadorId || 'N/A'}>`, inline: true },
                { name: '🥷 Servidor', value: `${interaction.guild.name}`, inline: true }
            )
            .setFooter({ text: "Sistema de Tickets | Host" });

        const linkButton = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder().setLabel("🔗 Ir al Ticket").setStyle(Discord.ButtonStyle.Link).setURL(interaction.channel.url)
        );

        await creador.send({ embeds: [embedNotificacion], components: [linkButton] }).catch(() => {});
        await interaction.reply({ content: `✅ | Notificación enviada a <@${ticket.creadorId}>.`, ephemeral: true });
        return;
    }

///CERRAR TICKET
if (opc === "fechar_ticket") {
    const ticket = estadoTickets[ticketId];
    if (!ticket) return interaction.reply({ content: "❌ | Ticket no encontrado.", ephemeral: true });

    if (!interaction.member.roles.cache.has(rolPermitidoId))
        return interaction.reply({ content: "❌ | No tienes permiso para usar este botón.", ephemeral: true });

    await interaction.deferUpdate();

    // Preguntar si desea dejar nota
    const notaEmbed = new Discord.EmbedBuilder()
        .setTitle("¿Deseas dejar una nota?")
        .setDescription("Si deseas dejar una nota, presiona 'Sí'. De lo contrario, presiona 'No'.")
        .setColor(config.colorpredeterminado);

    const yesButton = new Discord.ButtonBuilder().setCustomId("nota_si").setLabel("Sí").setStyle(Discord.ButtonStyle.Primary);
    const noButton = new Discord.ButtonBuilder().setCustomId("nota_no").setLabel("No").setStyle(Discord.ButtonStyle.Secondary);
    const row = new Discord.ActionRowBuilder().addComponents(yesButton, noButton);

    await interaction.followUp({ embeds: [notaEmbed], components: [row], ephemeral: true });

    const filter = i => ["nota_si", "nota_no"].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on("collect", async i => {
        await i.deferUpdate();

        if (i.customId === "nota_si") {
            await i.followUp({ content: "Escribe tu nota:", ephemeral: true });

            const msgCollector = i.channel.createMessageCollector({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 30000
            });

            msgCollector.on("collect", async m => {
                await cerrarTicketFinal(interaction, ticket, m.content);
            });

            msgCollector.on("end", collected => {
                if (collected.size === 0) cerrarTicketFinal(interaction, ticket, null);
            });
        } else {
            await cerrarTicketFinal(interaction, ticket, null);
        }
    });
}

// Función para cerrar ticket y enviar embeds
async function cerrarTicketFinal(interaction, ticket, nota) {
    const ticketId = interaction.channel.id;
    const fechaCierre = new Date();

    // Crear transcripción
    const transcriptFile = await transcript.createTranscript(interaction.channel, {
        limit: -1,
        returnType: 'buffer',
        fileName: `transcript-${interaction.channel.name}.html`
    });

    // Embed del ticket cerrado
    const embedCierre = new Discord.EmbedBuilder()
        .setTitle("📝 Ticket Cerrado")
        .setColor(config.colorpredeterminado)
        .addFields(
            { name: '🎟️ Ticket', value: `\`${interaction.channel.name}\``, inline: false },
            { name: '🔢 Ticket N°', value: `#${ticket.ticketId}`, inline: false },
            { name: '👤 Ticket abierto por', value: `<@${ticket.creadorId}>`, inline: false },
            { name: '🔒 Ticket cerrado por', value: `<@${interaction.user.id}>`, inline: false },
            { name: '📅 Fecha de creación', value: `\`${ticket.fechaCreacion.toLocaleString()}\``, inline: false },
            { name: '🕒 Fecha de cierre', value: `\`${fechaCierre.toLocaleString()}\``, inline: false },
            { name: '📄 Nota', value: `\`\`\`${nota || "No se proporcionaron notas adicionales."}\`\`\``, inline: false }
        )
        .setFooter({ text: "Sistema de Tickets | Host", iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

    // Enviar embed al creador
    const creador = await interaction.guild.members.fetch(ticket.creadorId).catch(() => null);
    if (creador) {
        try {
            await creador.send({
                content: `Tu ticket \`(${interaction.channel.name})\` ha sido cerrado. Aquí tienes el transcript:`,
                embeds: [embedCierre],
                files: [{ attachment: transcriptFile, name: `transcript-${interaction.channel.name}.html` }]
            });
        } catch {}
    }

    // Enviar embed al canal de logs
    const logChannel = interaction.guild.channels.cache.get("1355829850174263347"); // Cambia al ID real
    if (logChannel) {
        await logChannel.send({
            embeds: [embedCierre],
            files: [{ attachment: transcriptFile, name: `transcript-${interaction.channel.name}.html` }]
        });
    }

    // Eliminar ticket de memoria y DB
    db.run(`DELETE FROM tickets WHERE id = ?`, [ticket.ticketId], err => { if(err) console.error(err) });
    delete estadoTickets[ticketId];

    // Borrar canal después de 5 segundos
    setTimeout(async () => {
        try { await interaction.channel.delete(); } catch (err) { console.error(err); }
    }, 5000);
}
}
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("🚫 Unhandled Rejection:", reason?.stack || reason);
});

process.on('uncaughtException', (error, origin) => {
  console.error("❌ Uncaught Exception:", error.stack || error, "Origen:", origin);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
  console.error("❌ Exception Monitor:", error.stack || error, "Origen:", origin);
});


// Cargar eventos

const eventsDir = path.join(__dirname, 'Events');

fs.readdir(eventsDir, (err, files) => {
  if (err) {
    console.error('Error al leer la carpeta de eventos:', err);
    return;
  }

  let loadedEvents = 0; // Contador de eventos cargados

  files.forEach(file => {
    if (file.endsWith('.js')) {
      try {
        const event = require(path.join(eventsDir, file));
        event(client);
        console.log(`Evento cargado: ${file}`); // Mensaje para confirmar que se carga
        loadedEvents++; // Incrementar el contador de eventos cargados
      } catch (error) {
        console.error(`Error al cargar el evento ${file}:`, error);
      }
    } else {
      console.warn(`El archivo ${file} no es un archivo .js y será ignorado.`);
    }
  });

  // Función asíncrona para manejar operaciones
const doSomethingAsync = async () => {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('La operación fue abortada.');
    } else {
      console.error('Error inesperado:', error);
    }
  }
};

  // Asegúrate de que las operaciones asincrónicas se manejen correctamente
doSomethingAsync().then(result => {
  if (result) {
    console.log('Operación completada:', result);
  }
});
  // Mensaje final para confirmar que todos los eventos han sido procesados
  console.log(`Total de eventos cargados: ${loadedEvents}`);
  client.login(process.env.TOKEN);
});
