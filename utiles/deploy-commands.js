const { REST, Routes, ApplicationCommandType } = require('discord.js');
const { clientId, guildId, token } = require('../config.json');
const fs = require('fs');
const path = require('path');

async function registerCommands() {
  const commandsDir = path.join(__dirname, '..', 'Comandos');
  const commandFolders = fs.readdirSync(commandsDir);

  const globalCommands = [];  // Solo comandos globales
  const guildCommands = [];   // Comandos del servidor

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsDir, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(folderPath, file));
      
      if (command.name && command.description) {
        const data = {
          name: command.name,
          description: command.description.slice(0, 100),
          type: command.type || ApplicationCommandType.ChatInput,
          options: command.options || []
        };

        // Solo agregar /ping a los comandos globales
        if (command.name === 'ping') {
          globalCommands.push(data);
        } else {
          guildCommands.push(data); // Los demás comandos van a los comandos de servidor
        }
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    // 🧪 Subir comandos de prueba (guild commands)
    console.log('🔄 Subiendo comandos de prueba al servidor...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: guildCommands
    });
    console.log('✅ Comandos de prueba registrados.');

    // 🌍 Verificar y subir los comandos globales (solo el /ping)
    if (globalCommands.length > 0) {
      console.log('📋 Verificando comandos globales actuales...');
      const currentGlobalCommands = await rest.get(Routes.applicationCommands(clientId));

      const changed =
        currentGlobalCommands.length !== globalCommands.length ||
        currentGlobalCommands.some((cmd, i) => {
          const newCmd = globalCommands[i];
          return (
            cmd.name !== newCmd.name ||
            cmd.description !== newCmd.description ||
            JSON.stringify(cmd.options) !== JSON.stringify(newCmd.options)
          );
        });

      if (changed) {
        console.log('🌍 Cambios detectados. Subiendo comandos globales...');
        await rest.put(Routes.applicationCommands(clientId), {
          body: globalCommands
        });
        console.log('✅ Comandos globales registrados.');
      } else {
        console.log('✔️ Comandos globales sin cambios. No se actualizaron.');
      }
    }

  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
}

module.exports = registerCommands;
