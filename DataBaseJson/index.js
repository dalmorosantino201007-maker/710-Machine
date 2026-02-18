const {
    JsonDatabase,
  } = require("wio.db");

  const General = new JsonDatabase({
    databasePath: "./DataBaseJson/config.json"
});
  
const emoji = new JsonDatabase({
    databasePath: "./DataBaseJson/Emojis.json"

});

module.exports = {
   emoji,
}