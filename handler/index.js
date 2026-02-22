const fs = require("fs").promises;
const path = require("path");
const Discord = require("discord.js");

module.exports = async (client) => {
  client.slashCommands = new Discord.Collection();

  async function loadCommands() {
    const SlashsArray = [];
    const commandFolders = await fs.readdir(path.join(process.cwd(), 'Comandos'));

    for (const folder of commandFolders) {
      const folderPath = path.join(process.cwd(), 'Comandos', folder);
      const commandFiles = await fs.readdir(folderPath);

      for (const file of commandFiles) {
        if (!file.endsWith('.js')) continue;

        try {
          // Eliminamos el cache para que los cambios se apliquen siempre
          delete require.cache[require.resolve(`../Comandos/${folder}/${file}`)];
          const command = require(`../Comandos/${folder}/${file}`);

          if (!command?.name) {
            console.warn(`⚠️ El comando en ${file} no tiene nombre.`);
            continue;
          }

          // IMPORTANTE: Solo enviamos a Discord name, description y options
          // Esto evita que Discord rechace el comando por tener la función "run" dentro
          const commandData = {
            name: command.name.toLowerCase(),
            description: command.description || "Sin descripción",
            options: command.options || []
          };

          client.slashCommands.set(commandData.name, command);
          SlashsArray.push(commandData);

          console.log(`Loaded: ${commandData.name}`);
        } catch (error) {
          console.error(`❌ Error al cargar el comando ${file}:`, error);
        }
      }
    }
    return SlashsArray;
  }

  const SlashsArray = await loadCommands();

  client.once("ready", async () => {
    try {
      // Registramos los comandos en todos los servidores donde esté el bot
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(SlashsArray);
      }
      console.log(`✅ ${SlashsArray.length} Comandos registrados correctamente en Discord.`);
    } catch (error) {
      console.error('❌ Error crítico al registrar comandos:', error);
    }
  });
};