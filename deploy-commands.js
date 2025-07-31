import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as tiendaData, darArgentumData, argentumData } from './commands/tienda.js';

const config = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID
};

const commands = [
  tiendaData,
  darArgentumData,
  argentumData
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('🚀 Subiendo comandos...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log('✅ ¡Comandos registrados!');
  } catch (error) {
    console.error(error);
  }
})();