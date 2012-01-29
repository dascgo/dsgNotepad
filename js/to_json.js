// http://localhost/dsg_notepad/js/to_json.js
app.plugin.load({
  name: "Export JSON",
  developer: "@dsg",
  url: "http://localhost/dsg_notepad/js/plugin_example.js",
  commands: {
    json: function(){
      
      var items = $("#list p");
      var json = {todos:[]};
      var last_json_item = {};
      var last_indent = 0;
      var last_parent = 
      var push_to = json.todos;
      
      for(var i = 0, l = items.length; i < l; i++){
        
        var item = $(items[i]);
        var indent = parseInt($(items[i]).css("marginLeft"), 10);
        var status = app.ext.status(items[i]);
        
        // This is an empty to-do item, often done for visual formatting
        // If we find one, just skip it.
        if(item.html() == "" || item.html() == "&nbsp;"){
          continue;
        }
        
        console.log("indent = " + indent + " and color = " + status)
        
        var item_json = {
          item: item.html(),
          status: status,
          children: []
        };
        // if(items[i + 1]){
        //   $(items[i + 1]).css("marginLeft");
        // }
        // if(indent > last_indent){
        //   push_to = json.todos[i - 1];
        // }
        push_to.push(item_json);
        last_indent = indent;
      }
      console.log(JSON.stringify(json));
      
    }
  },
  descriptions: {
    json: "Will export your todo list in a JSON format."
  }
});


// 
// 
// {
//   list: [
//     item: {
//       name: "Notepad:",
//       children: {
//         
//       }
//     }
//   ]
// }