// index.js
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import './database.js'; // Conexión DB

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`El comando en ${filePath} no tiene "data" o "execute".`);
  }
}

client.once('ready', () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ Ocurrió un error al ejecutar este comando.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
