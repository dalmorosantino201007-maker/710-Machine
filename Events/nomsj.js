const Discord = require("discord.js");
const config = require('../DataBaseJson/config.json');

module.exports = (client) => {
    console.log('Módulo nomsj.js cargado para v13.');

    // Verifica que el cliente sea una instancia válida
    if (!(client instanceof Discord.Client)) {
        console.error('El cliente no es una instancia válida');
        return;
    }

    // ID del canal donde no se pueden enviar mensajes de texto plano
    const CHANNEL_ID = "1364365321019981895";

    client.on("messageCreate", async (message) => {
        // 1. Ignorar si el mensaje es de un bot o no es en un servidor
        if (message.author.bot || !message.guild) return;

        // 2. Verificar si el mensaje fue enviado en el canal restringido
        if (message.channel.id === CHANNEL_ID) {
            
            // Opcional: Permitir mensajes que empiecen con "/" o "!" si quieres que los comandos sí pasen
            // if (message.content.startsWith('/') || message.content.startsWith('!')) return;

            try {
                // Elimina el mensaje del usuario
                if (message.deletable) {
                    await message.delete();
                }

                // Enviar aviso por MD (Mensaje Directo) al usuario
                await message.author.send({
                    content: `<:warninghost:1383935369275379874> | No puedes enviar mensajes en el canal de ${config.comandos}. Este canal es únicamente para el uso de **Comandos**.`
                }).catch(() => {
                    // Si el usuario tiene los MD cerrados, no crashear el bot
                    console.log(`No se pudo enviar MD a ${message.author.tag} (MDs cerrados).`);
                });

            } catch (error) {
                console.error('Error al manejar la restricción de mensaje:', error);
            }
        }
    });
};