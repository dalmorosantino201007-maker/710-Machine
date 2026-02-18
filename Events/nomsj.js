const Discord = require("discord.js");
const path = require('path');
const eventsDir = path.join(__dirname, 'Events');
const config = require("../config.json")

module.exports = (client) => {
    console.log('Módulo nomsj.js cargado.');

    // Verifica que el cliente sea una instancia válida
    if (!(client instanceof Discord.Client)) {
        console.error('El cliente no es una instancia válida');
        return;
    }

    const CHANNEL_ID = "1364365321019981895"; // ID del canal donde no se pueden enviar mensajes

    client.on("messageCreate", async (message) => {
        // Verifica que el mensaje no sea del bot
        if (message.author.bot) return;

        // Verifica si el mensaje fue enviado en el canal específico
        if (message.channel.id === CHANNEL_ID) {
            try {
                // Elimina el mensaje del usuario
                await message.delete();

                // Envía un mensaje en el mismo canal informando que no se pueden enviar mensajes
                await message.author.send({
                      content: `<:warninghost:1383935369275379874> | No puedes enviar mensajes en el canal de ${config.comandos}. Este canal es unicamente para Comandos.`
                });
            } catch (error) {
                console.error('Error al manejar el mensaje:', error);
            }
        }
    });
};
