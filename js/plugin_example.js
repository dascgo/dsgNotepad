// http://localhost/dsg_notepad/js/plugin_example.js
app.plugin.load({
  name: "test",
  developer: "Daniel Goodwin",
  url: "http://localhost/dsg_notepad/js/plugin_example.js",
  commands: {
    jump: function(){
      alert("jumping!!")
    },
    sit: function(){
      alert("sitting!")
    }
  },
  descriptions: {
    jump: "will alert the word jump",
    sit: "will alert the word sit"
  }
})