import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';
import { sumarSaldo, consultarSaldo } from '../db.js';

// Categorías y sus ítems
const categorias = [
  { label: 'Armas 🔫', value: 'armas', description: 'Rifles, pistolas y más', emoji: '🔫' },
  { label: 'Medicinas 🩹', value: 'medicinas', description: 'Botiquines y curaciones', emoji: '🩹' },
  { label: 'Ropa y Chalecos 🦺', value: 'ropa', description: 'Protección y estilo', emoji: '🦺' },
  { label: 'Autos 🚗', value: 'autos', description: 'Vehículos para moverte rápido', emoji: '🚗' }
];

const itemsPorCategoria = {
  armas: [
    { label: 'AKM Rifle', value: 'akm', description: 'Rifle de asalto confiable - 250 Argentums', emoji: '🔫', precio: 250 },
    { label: 'Mosin Nagant', value: 'mosin', description: 'Rifle de francotirador - 300 Argentums', emoji: '🎯', precio: 300 },
    { label: 'M1911 Pistola', value: 'm1911', description: 'Pistola clásica - 100 Argentums', emoji: '🔫', precio: 100 }
  ],
  medicinas: [
    { label: 'Botiquín Médico', value: 'botiquin', description: 'Cura heridas - 80 Argentums', emoji: '🩹', precio: 80 },
    { label: 'Tabletas de Vitamina', value: 'vitaminas', description: 'Mejora tu salud - 40 Argentums', emoji: '💊', precio: 40 }
  ],
  ropa: [
    { label: 'Chaleco Táctico', value: 'chaleco', description: 'Protección extra - 120 Argentums', emoji: '🦺', precio: 120 },
    { label: 'Casco Militar', value: 'casco', description: 'Protege tu cabeza - 90 Argentums', emoji: '🪖', precio: 90 }
  ],
  autos: [
    { label: 'Sedán', value: 'sedan', description: 'Auto familiar - 1000 Argentums', emoji: '🚗', precio: 1000 },
    { label: 'Camioneta', value: 'camioneta', description: 'Espacio y potencia - 1200 Argentums', emoji: '🚙', precio: 1200 }
  ]
};

export const data = new SlashCommandBuilder()
  .setName('tienda')
  .setDescription('Abre la tienda de DayZ 🛒🌄');

export async function execute(interaction) {
  const selectCategorias = new StringSelectMenuBuilder()
    .setCustomId('categoria_tienda')
    .setPlaceholder('Selecciona una categoría 🗂️')
    .addOptions(categorias);

  const row = new ActionRowBuilder().addComponents(selectCategorias);

  await interaction.reply({
    content: '¡Bienvenido a la tienda de DayZ! 🛒🌄\nSelecciona una categoría para ver los ítems disponibles:',
    components: [row],
    flags: 4096
  });
}

export async function handleCategoria(interaction) {
  const categoria = interaction.values[0];
  const items = itemsPorCategoria[categoria];

  if (!items) {
    await interaction.update({
      content: '❌ Categoría no encontrada.',
      components: [],
      flags: 4096
    });
    return;
  }

  const selectItems = new StringSelectMenuBuilder()
    .setCustomId(`comprar_item_${categoria}`)
    .setPlaceholder('Selecciona un ítem para comprar 🛍️')
    .addOptions(items);

  const row = new ActionRowBuilder().addComponents(selectItems);

  await interaction.update({
    content: `Has seleccionado la categoría **${categorias.find(c => c.value === categoria).label}**. Elige un ítem para comprar:`,
    components: [row],
    flags: 4096
  });
}

export async function handleSelect(interaction) {
  const categoria = interaction.customId.replace('comprar_item_', '');
  const items = itemsPorCategoria[categoria];
  const selected = interaction.values[0];
  const item = items.find(i => i.value === selected);

  const modal = new ModalBuilder()
    .setCustomId(`steamid_modal_${item.value}`)
    .setTitle(`Comprar ${item.label} ${item.emoji}`);

  const steamInput = new TextInputBuilder()
    .setCustomId('steamid')
    .setLabel('Ingresa tu SteamID 🚀')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ej: 7656119...')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(steamInput));

  await interaction.showModal(modal);
}

export async function handleModal(interaction) {
  const itemValue = interaction.customId.replace('steamid_modal_', '');
  let item;
  for (const cat of Object.values(itemsPorCategoria)) {
    item = cat.find(i => i.value === itemValue);
    if (item) break;
  }
  if (!item) {
    await interaction.reply({
      content: '❌ Ítem no encontrado.',
      flags: 4096
    });
    return;
  }

  const steamid = interaction.fields.getTextInputValue('steamid');
  const saldoActual = await consultarSaldo(steamid);

  if (saldoActual < item.precio) {
    await interaction.reply({
      content: `❌ No tienes suficientes Argentums para comprar **${item.label}** (${item.precio} Argentums). Tu saldo: ${saldoActual} 🪙`,
      flags: 4096
    });
    return;
  }

  await sumarSaldo(steamid, -item.precio);

  const nuevoSaldo = saldoActual - item.precio;

  await interaction.reply({
    content: `✅ ¡Compra realizada con éxito! Has adquirido **${item.label}** por ${item.precio} Argentums 🪙\nTu nuevo saldo es: **${nuevoSaldo} Argentums**\n¡Gracias por tu compra, sobreviviente! 🏕️`,
    flags: 4096
  });
}

export const darArgentumData = new SlashCommandBuilder()
  .setName('darargentum')
  .setDescription('Regala Argentums a un usuario 💸')
  .addStringOption(option =>
    option.setName('steamid')
      .setDescription('SteamID del usuario')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('cantidad')
      .setDescription('Cantidad de Argentums')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function darArgentum(interaction) {
  const adminRoleId = '1399948089627906055';

  if (!interaction.member.roles.cache.has(adminRoleId)) {
    await interaction.reply({
      content: '🚫 ¡Solo los administradores con el rol adecuado pueden usar este comando! 👮‍♂️',
      flags: 4096
    });
    return;
  }

  const steamid = interaction.options.getString('steamid');
  const cantidad = interaction.options.getInteger('cantidad');

  await sumarSaldo(steamid, cantidad);

  const nuevoSaldo = await consultarSaldo(steamid);

  await interaction.reply({
    content: `🎉 ¡Listo! Has dado **${cantidad} Argentums** a \`${steamid}\` 💸\nNuevo saldo: **${nuevoSaldo} Argentums**\n¡Que la suerte te acompañe en Chernarus! 🌄`,
    flags: 4096
  });
}

export const argentumData = new SlashCommandBuilder()
  .setName('argentum')
  .setDescription('Consulta cuántos Argentums tienes 🪙')
  .addStringOption(option =>
    option.setName('steamid')
      .setDescription('Tu SteamID para consultar el saldo')
      .setRequired(true)
  );

export async function argentum(interaction) {
  const steamid = interaction.options.getString('steamid');
  const cantidad = await consultarSaldo(steamid);

  await interaction.reply({
    content: `🪙 Tu saldo actual es: **${cantidad} Argentums**\n¡Sigue sobreviviendo y acumulando más! 🌟`,
    flags: 4096
  });
}