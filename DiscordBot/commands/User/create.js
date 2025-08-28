const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js")
const functions = require("../../../structs/functions.js");

module.exports = {
    commandInfo: {
        name: "create",
        description: "Project Meteorにアカウントを登録します。",
        options: [
            {
                name: "id",
                description: "半角英数字でIDを決めます。",
                required: true,
                type: 3
            },
            {
                name: "displayname",
                description: "これがあなたのディスプレイネームになります。",
                required: true,
                type: 3
            },
            {
                name: "password",
                description: "これがあなたのパスワードになります。 注意:パスワードは他のサイトで利用しているものにしないでください。",
                required: true,
                type: 3
            }
        ],
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;

        const discordId = interaction.user.id;
        const email = `${options.get("id").value}@meteor.dev`;
        const username = options.get("username").value;
        const password = options.get("password").value;

        const plainEmail = `${options.get("id").value}@meteor.dev`;
        const plainUsername = options.get('username').value;

        const existingEmail = await User.findOne({ email: plainEmail });
        const existingUser = await User.findOne({ username: plainUsername });

        const emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!emailFilter.test(email)) {
            return interaction.editReply({ content: "You did not provide a valid email address!", ephemeral: true });
        }
        if (existingEmail) {
            return interaction.editReply({ content: "メールアドレスが被っています。", ephemeral: true });
        }
        if (existingUser) {
            return interaction.editReply({ content: "ユーザーネームが被っています。", ephemeral: true });
        }
        if (username.length >= 25) {
            return interaction.editReply({ content: "ユーザーネームは25文字以下でしか登録できません。", ephemeral: true });
        }
        if (username.length < 3) {
            return interaction.editReply({ content: "ユーザーネームは3文字以上でしか登録できません。", ephemeral: true });
        }
        if (password.length >= 128) {
            return interaction.editReply({ content: "パスワードは128文字以下でしか登録できません。", ephemeral: true });
        }
        if (password.length < 4) {
            return interaction.editReply({ content: "パスワードは4文字以上長い必要があります。", ephemeral: true });
        }

        await functions.registerUser(discordId, username, email, password).then(resp => {
            let embed = new MessageEmbed()
            .setColor(resp.status >= 400 ? "#ff0000" : "#56ff00")
            .setThumbnail(interaction.user.avatarURL({ format: 'png', dynamic: true, size: 256 }))
            .addFields({
                name: resp.status >= 400 ? "登録失敗" : "登録成功！",
                value: resp.status >= 400 ? "登録に失敗しました。" : "登録に成功しました！",
            }, {
                name: "ユーザーネーム",
                value: username,
            }, {
                name: "ディスコードID",
                value: interaction.user.tag,
            })
            .setTimestamp()
            .setFooter({
                text: "Project Meteor",
                iconURL: "https://i.imgur.com/IWI4pAz.png"
            })

            if (resp.status >= 400) return interaction.editReply({ embeds: [embed], ephemeral: true });

            (interaction.channel ? interaction.channel : interaction.user).send({ embeds: [embed] });
            interaction.editReply({ content: resp.status >= 400 ? "登録に失敗しました。" : "登録に成功しました！", ephemeral: true });
        });
    }
}