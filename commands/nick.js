const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const stringSimilarity = require('string-similarity');
const db = require('../database.js');
const config = db.prepare('SELECT renameLogChannel, verifiedRole FROM config WHERE guildId = ?');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('Changes your nick (don\'t set a new nick to remove your nick)')
        .addStringOption(option =>
            option
                .setName('nick')
                .setDescription('Your new nick')
        ),
    async execute (interaction) {
        const { renameLogChannel, verifiedRole } = config.get(interaction.guildId);
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'This command is only avalible in a server.',
                ephemeral: true
            });
            return;
        }
        if (!interaction.member.roles.cache.has(verifiedRole)) {
            await interaction.reply({
                content: 'This command can not be used by verified users',
                ephemeral: true
            });
            return;
        }
        if (!interaction.member.manageable) {
            await interaction.reply({
                content: 'Bot is unable to change your nick because you\'re higher than it, please use Discord\'s native nick change feature.',
                ephemeral: true
            });
            return;
        }
        if (interaction.member.nickname === interaction.options.getString('nick')) {
            await interaction.reply({
                content: 'Your new nick is the same as your old nick.',
                ephemeral: true
            });
            return;
        }
        if (!interaction.member.nickname && !interaction.options.getString('nick')) {
            await interaction.reply({
                content: 'You can not remove a nick you have not set.',
                ephemeral: true
            });
            return;
        }
        const newName = interaction.options.getString('nick') || interaction.member.user.username;
        const diff = stringSimilarity.compareTwoStrings(interaction.member.displayName.toLowerCase(), newName.toLowerCase());
        const embed = new MessageEmbed()
            .addFields({
                name: 'User',
                value: '<@' + interaction.member.id + '>',
                inline: true
            }, {
                name: `Old ${interaction.member.nickname ? 'nick' : 'username'}`,
                value: interaction.member.displayName,
                inline: true
            }, {
                name: `New ${interaction.options.getString('nick') ? 'nick' : 'username'}`,
                value: newName,
                inline: true
            }, {
                name: 'Similarity',
                value: diff.toString(),
                inline: true
            });
        if (!interaction.options.getString('nick')) {
            embed.setTitle('User removed nick');
        } else if (!interaction.member.nickname) { //eslint-disable-line no-negated-condition
            embed.setTitle('User set nick');
        } else {
            embed.setTitle('User changed nick');
        }
        await interaction.client.channels.cache.get(renameLogChannel).send({
            embeds: [
                embed
            ]
        });
        if (diff < 0.3) {
            await interaction.reply({
                content: 'New name is not similar to your Fandom username, and has therefor not been changed. Please re-verify yourself in <#928414471469277194> if your Fandom username has changed.',
                ephemeral: true
            });
        } else {
            await interaction.member.setNickname(newName, 'Requested by user');
            await interaction.reply({
                content: 'Your nick has been changed.',
                ephemeral: true
            });
        }
    }
};