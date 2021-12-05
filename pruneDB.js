const cron = require('node-cron');
const db = require('./database.js');
const config = db.prepare('SELECT verifiedRole FROM config WHERE guildId = ?');
const getIgnoredUsers = db.prepare('SELECT userId, guildId FROM verificationIgnore');
const removeIgnoreUserRow = db.prepare('DELETE FROM verificationIgnore WHERE userId = ?');

module.exports = {
    execute (client) {
        cron.schedule('0/30 * * * *', () => {
            const ignoredUsers = getIgnoredUsers.all();
            ignoredUsers.forEach(async row => {
                const guild = await client.guilds.fetch(row.guildId.toString())
                const user = await guild.members.fetch(row.userId.toString());
                const role = config.get(row.guildId).verifiedRole.toString();
                if (!user || user.roles.cache.has(role)) {
                    removeIgnoreUserRow.run(row.userId);
                }
            });
        });
    }
}