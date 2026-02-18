const fs = require("fs").promises;
const path = require("path");
const Discord = require("discord.js");

module.exports = async (client) => {
  client.slashCommands = new Discord.Collection();

  // Función para cargar comandos
  async function loadCommands() {
    const SlashsArray = [];
    const commandFolders = await fs.readdir('./Comandos');

    for (const folder of commandFolders) {
      const commandFiles = await fs.readdir(`./Comandos/${folder}`);

      for (const file of commandFiles) {
        if (!file.endsWith('.js')) continue;

        try {
          const command = require(`../Comandos/${folder}/${file}`);
          if (!command?.name) continue;

          client.slashCommands.set(command.name, command);
          SlashsArray.push(command);
        } catch (error) {
          console.error(`Error al cargar el comando ${file}:`, error);
        }
      }
    }

    return SlashsArray;
  }

  // Cargar comandos y verificar duplicados
  const SlashsArray = await loadCommands();

  // Buscar nombres duplicados
  const commandNames = SlashsArray.map(cmd => cmd.name);
  const duplicates = commandNames.filter((name, i) => commandNames.indexOf(name) !== i);

  if (duplicates.length > 0) {
    console.warn('⚠️ Comandos duplicados detectados:', [...new Set(duplicates)]);
    throw new Error('Hay comandos con nombres duplicados, corregir antes de registrar');
  }

  // Registrar comandos cuando el cliente esté listo
  client.once("ready", async () => {
    try {
      await Promise.all(
        client.guilds.cache.map(guild => guild.commands.set(SlashsArray))
      );
      console.log('✅ Comandos registrados en los servidores.');
    } catch (error) {
      console.error('Error al registrar comandos:', error);
    }
  });
};

