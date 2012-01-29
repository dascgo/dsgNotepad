/*
	dsgNotepad
	A simple todo app for the browser
	
	1) To add a new item, type it into the field attached to the bottom of the screen
	2) Once you have items added, use the up/down arrow to select existing items
	3) To reorder an item, select it, and use shift + up or shift + down to change it's order
	4) To nest items, use shift + right (to increase) or shift + left (to decrease) it's indent level
	5) To change the state of a selected item, use the option|alt + right/left arrows keys.
		 - A left arrow click when the item is grayed out will premantently remove the item from the list
	6) To edit an item, select it, and press ESC
		 - To save an edit, just press RETURN
*/
var test;
var app = {
	
	input: 				    false,
	list: 				    false,
	items: 				    [],
	item_index: 	    0,
	indent_size: 	    20,
	edit_id: 			    false,
	existing_plugins: [],
	
	init: function(){ 
	  // position the help area correctly:
	  app.help.position();
	  $(window).resize(function() {
      app.help.position();
    });
		// initialize all startup code:
		app.input = $("#add input");
		app.list = $("#list");
		app.db.init();
		app.keys.init();
		app.input.focus();
		$("#help_toggle").click(app.help.toggle);
		app.plugin.init();
		app.first_run();
	},
	
	first_run: function(){
	  // If this is a first run we need to:
	  // - check, first off
	  var name = "first_run";
	  if(!app.db.get(name)){
	    // - if so, then show the help.
	    $("#help").click();
	    app.input.val("This is my first note!");
	    app.actions.enter();
	    app.db.save(name, true);
	  }
	},
	
	plugin: {
	  delimiter: "**",
	  
	  init: function(){
	    // see if there are existing
	    var existing_plugins = app.db.get("plugins");
	    if(existing_plugins){
	      app.existing_plugins = existing_plugins.split(app.plugin.delimiter);
	    }
	    for(var i = 0, l = app.existing_plugins.length; i < l; i++){
	      app.plugin.add(app.existing_plugins[i]);
	    }
	    // set up click to add
	    $("#new_plugin_btn").click(function(){
	      var url_input = $("#new_plugin_url");
	      var url = url_input.val();
	      url_input.val("");
	      if(app.existing_plugins.indexOf(url) == -1){
	        app.existing_plugins.push(url);
          app.db.save("plugins", app.existing_plugins.join(app.plugin.delimiter));
  	      app.plugin.add(url);
	      }
	    });
	    // set up click to remove
	    $(".delete_plugin").live("click", function(){
	      var elm = $(this);
	      var url = elm.attr("data-plugin_url");
	      app.plugin.remove(url);
	    })
	  },
	  
	  add: function(url){
	    var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = url;
      $("head").append(script);
	  },
	  
	  load: function(plugin){
	    for(var i in plugin.descriptions){
	      if(plugin.descriptions.hasOwnProperty(i)){
	        if(!app.commands.hasOwnProperty(i)){
	          var html = app.html.plugin_command(plugin, i);
  	        $(html).insertBefore($("#plugin_area"));
	          app.commands[i] = plugin.commands[i];
	        }else{
	          console.log("Oops! There is already a " + i + " command.");
	        }
	      }
	    }
	  },
	  
	  remove: function(url){
	    if(confirm("Delete plugin?\nSource: " + url + "\n\nThis will remove all commands that URL has provided.")){
	      for(var i = 0, l = app.existing_plugins.length; i < l; i++){
  	      if(app.existing_plugins[i] == url){
  	        app.existing_plugins.splice(i, 1);
  	        $(".plugin_" + app.tools.permalink(url)).remove();
  	        break;
  	      }
  	    }
  	    app.db.save("plugins", app.existing_plugins.join(app.plugin.delimiter));
	    }
	  }
	  
	},
	
	db: { 
		// functions for interacting with localStorage
		
		init: function(){
			// get items saved to localStorage and add to the dom
			var order = app.db.get("order");
			// add the items to an array for looping (and rearranging later)
			if(order){
				app.items = order.split(",");
			}
			// for each item we find in localStorage, restore it to the DOM
			$.each(app.items, function(index, val){
				app.db.restore_saved(index, val);
			});
		},
		
		restore_saved: function(index, val){
			// takes an item from localStorage and adds it to the DOM
			var text = app.db.get("item_" + val);
			var html = app.html.row(text, val);
			// add html to dom
			app.list.append(html);
			// set indent level
			if(app.db.get("indent_" + val)){
				var margin_left = (app.db.get("indent_" + val) * app.indent_size);
				$("#item_" + val).css("marginLeft", margin_left);
			}
			// set state
			if(app.db.get("state_" + val)){
				var state = app.db.get("state_" + val);
				if(state != "") $("#item_" + val).addClass(state);
			}
		},
		
		save: function(key, value){
			// save a value to localStorage
			if(localStorage){
				localStorage.setItem(key, value);
			}
		},
		
		destroy: function(key){
			// destroy a single item, or array of items, from localStorage
			if(localStorage){
				if(typeof key == "string"){
					localStorage.removeItem(key);
				}else{
					for(var i = 0; i < key.length; i++){
						localStorage.removeItem(key[i]);
					}
				}
			}
		},
		
		get: function(key){
			// get a value saved in localStorage
			if(localStorage){
			  // console.log(key + ": " + JSON.stringify(localStorage.getItem(key)));
				return localStorage.getItem(key);
			}else{
				return false;
			}
		}
		
	},

	keys: {
		
		init: function(){
			// wanted only keyboard navigation, this initializer preps all the keys we want to watch
			$(document, "input").keydown(function(e){
				
				// enter
				if(e.which == '13'){
					app.actions.enter();
				}
				// up arrow
				if(e.which == '38'){
					e.shiftKey ? app.actions.move("up") : app.actions.select("up");
					e.preventDefault();
				}
				// down arrow
				if(e.which == '40'){
					e.shiftKey ? app.actions.move("down") : app.actions.select("down");
					e.preventDefault();
				}
				// right or left arrows...
				if(e.which == '39' || e.which == '37'){
					var id = app.items[app.item_index];
					var item = $("#item_" + app.items[app.item_index]);
				}
				// right arrow
				if(e.which == '39'){
					e.shiftKey ? app.actions.right_shift(item, id) : app.actions.increase_state(e, item, id);
				}
				// left arrow
				if(e.which == '37'){
					e.shiftKey ? app.actions.left_shift(item, id) : app.actions.decrease_state(e, item, id);
				}
				// escape for edit
				if(e.which == '27'){
					app.edit_id ? app.edit.cancel() : app.edit.begin();
				}
				
			});
			
		}
	
	},
	
	commands: {
	  
	  h: function(){
	    app.commands.help();
	  },
	  
	  help: function(){
	    app.help.toggle();
	  },
	  
	  alerter: function(){
	    alert("this is a test");
	  },
	  
	  tweet: function(){
			var row = $("#item_" + app.items[app.item_index]),
					text = row.text();
			if(text.length > 0){
			  var url = "http://twitter.com?status=" + text;
			  window.open(url, 'tweet');
			}
			return false;
	  }
	  
	},
	
	actions: {
	  
	  command: function(cmd){
	    if(app.commands.hasOwnProperty(cmd)){
	      app.commands[cmd]();
	    }else{
	      console.log("'" + cmd + "' is and unknown command.");
	    }
	  },
		
		enter: function(){
			// the enter key was pressed
			var text = app.input.val(),
					id = app.tools.new_id();
			
			if(text.charAt(0) == "\\"){
			  while(text.charAt(0) == '\\')
            text = text.substr(1);
        app.actions.command(text)
			}else{
			  if(app.edit_id){
  				// if we are editing an existing item, we need to resave it to localStorage
  				app.edit.finish(text);
  			}else{
  				// if we are adding a new item, we need to add to:
  				// - determine some values:
  				var after_id = app.items[app.item_index];
  				var after_elm = $("#item_" + after_id);
  				var indent_level = parseInt(after_elm.css("margin-left"), 10) / app.indent_size;
  				// - generate a new element and insert it into the DOM
  				$(app.html.row(text, id, indent_level)).insertAfter("#item_" + after_id);
  				// - add it to the database
  				app.db.save("item_" + id, text);
  				app.db.save("indent_" + id, indent_level);
  				// - add it to our local array and save the new order
  				app.item_index = app.item_index + 1;
  				app.items.splice(app.item_index, 0, id);
  				app.db.save("order", app.items.join(","));
  				// - clear out the input
  				app.input.val("");
  				// - selected it
  				app.actions.select("down", true)
  				// - scroll it into view
  				//$(window).scrollTop($(document).height());
  			}
			}
			return false;
		},
		
		move: function(dir){
			var id = app.items[app.item_index],
					item = $("#item_" + app.items[app.item_index]),
					moved = false,
					swapped_index = 0;
			// swap it's element location in the DOM
			if(dir == "up"){
				var prev = $("#item_" + app.items[app.item_index - 1]);
				if(prev.length > 0){
					// if we have a prev element, continue on...
					item.clone(true).insertBefore(prev);
					swapped_index = app.item_index - 1;
					moved = true;
				}
			}else{
				var next = $("#item_" + app.items[app.item_index + 1]);
				if(next.length > 0){
					// if we have a next element, continue on...
					item.clone(true).insertAfter(next);
					swapped_index = app.item_index + 1;
					moved = true;
				}
			}
			// make sure it moved before doing the remain tasks.
			if(moved){
				// remove the old item
				item.remove();
				// swap the items in our local array
				app.items[app.item_index] = app.items[swapped_index];
				app.items[swapped_index] = id;
				app.item_index = swapped_index;
				// adjust our item_index to new array size
				if(app.item_index < 0) app.item_index = app.items.length - 1;
				if(app.item_index > app.items.length - 1) app.item_index = 0;
				// update the order in localStorage
				app.db.save("order", app.items.join(","));
				// scroll it into view
				app.tools.scroll_to_view($("#item_" + app.items[app.item_index]));
			}
		},
		
		select: function(dir, skip_indexing){
		  if(!skip_indexing) skip_indexing = false;
		  if(!skip_indexing){
		    // the up or down arrow was pressed, so highlight the next/prev sibling
  			if(dir == "up"){
  				app.item_index = app.item_index - 1;
  				if(app.item_index < 0) app.item_index = app.items.length - 1;
  			}else{
  				app.item_index = app.item_index + 1;
  				if(app.item_index > app.items.length - 1) app.item_index = 0;
  			}
		  }
			$("p").removeClass("selected");
			$("#item_" + app.items[app.item_index]).addClass("selected");
			app.tools.scroll_to_view($("#item_" + app.items[app.item_index]));
		},
		
		decrease_state: function(e, item, id){
			// due to issues with using the left/right arrows when writing a new item
			// the state change will now require the option key to be pressed.
			if(!e.altKey || e.metaKey) return false;
			// the left arrow was pressed, so downgrade the state based on current state
			if(item.hasClass("done")){
				item.removeClass("done");
				app.db.save("state_" + id, "");
			}else if(item.hasClass("trashed")){
				app.items.splice(app.item_index, 1);
				item.remove();
				app.db.destroy(["state_" + id, "indent_" + id]);
				app.db.save("order", app.items.join(","));
				app.actions.select("down", true);
			}else if(item.hasClass("deleted")){
				item.removeClass("deleted").addClass("trashed");
				app.db.save("state_" + id, "trashed");
			}else{
				item.addClass("deleted");
				app.db.save("state_" + id, "deleted");
			}
			return false;
		},
		
		increase_state: function(e, item, id){
			// due to issues with using the left/right arrows when writing a new item
			// the state change will now require the option key to be pressed.
			if(!e.altKey || e.metaKey) return false;
			// the left arrow was pressed, so upgrade the state based on current state
			if(item.hasClass("trashed")){
				item.removeClass("trashed").addClass("deleted");
				app.db.save("state_" + id, "trashed");
			}else if(item.hasClass("deleted")){
				item.removeClass("deleted");
				app.db.save("state_" + id, "");
			}else{
				item.addClass("done");
				app.db.save("state_" + id, "done");
			}
			return false;
		},
		
		left_shift: function(item, id){
			// the left arrow + shift was pressed, so downgrade the indention level and save
			var indent_level = app.tools.change_indent_level("decrease", item);
			app.db.save("indent_" + id, indent_level);
		},
		
		right_shift: function(item, id){
			// the right arrow + shift was pressed, so upgrade the indention level and save
			var indent_level = app.tools.change_indent_level("increase", item);
			app.db.save("indent_" + id, indent_level);
		}
		
	},
	
	edit: {
		
		cancel: function(){
			// cancel an edit
			$("#item_" + app.edit_id).removeClass("editing");
			app.edit_id = false;
			// this is strange, if I call app.input.val("") right away, it does not work
			// but slight delay will allow it to work. got me.
			setTimeout(function(){
			  app.input.val("").removeClass("input_edit").focus();
			}, 25);
		},
		
		begin: function(){
			// start editing the selected row
			app.edit_id = app.items[app.item_index];
			var row = $("#item_" + app.edit_id),
					text = row.attr("data-text"); //text();
			app.input.blur();
			app.input.val(unescape(text)).focus();
			app.input.addClass("input_edit");
			row.addClass("editing");
		},
		
		finish: function(text){
			$("#item_" + app.edit_id).html(app.tools.link_urls(text)).attr("data-text", escape(text));
			app.db.save("item_" + app.edit_id, text);
			app.edit.cancel();
		}
		
	},
	
	help: {
	  
	  slide_amount: 482,
	  elm: $('#help'),
	  speed: 500,
	  
	  position: function(){
	    var help_width = parseInt(($(window).width() * 0.85), 10);
	    
	    $("#table_container").css({
	      width: help_width,
	      height: parseInt(($(window).height() * 0.65), 10)
	    });
      
      var toggle_height = $("#help_toggle").height();
	    var help_height = $("#help").height();
	    var margin_left = (help_width / 2) * -1;
	    app.help.slide_amount = help_height - toggle_height;
	    
	    $("#help").css({
	      width: help_width,
	      top: "-" + app.help.slide_amount + "px",
	      margin: "0 0 0 " + margin_left + "px"
	    });
	  },
		
		toggle: function(){
		  if(app.help.elm.css("top") == "-" + app.help.slide_amount + "px"){
		    app.help.open();
		  }else{
		    app.help.close();
		  }
		},
		
		open: function(){
		  app.help.elm.css({ top: '-' + app.help.slide_amount });
		  app.help.elm.animate({ top: '0' }, app.help.speed);
		  app.input.focus();
		},
		
		close: function(){
		  app.help.elm.css({ top: '0' });
		  app.help.elm.animate({ top: '-' + app.help.slide_amount}, app.help.speed);
		  app.input.focus();
		}
		
	},
	
	html: {
		
		row: function(val, id, indent_level){
		  if(!indent_level) indent_level = 0;
			if(val == "") val = "&nbsp;";
			return "<p id='item_" + id + "' style='margin-left: " + (indent_level * app.indent_size) + "px;' data-text='" + escape(val) + "'>" + app.tools.link_urls(val) + "</p>";
		},
		
		plugin_command: function(plugin, command){
		  var html = "";
		      html += "<tr class='plugin_" + app.tools.permalink(plugin.url) + "'>";
		      html +=   "<td nowrap valign='top' class='command_text'>\\" + command + "</td>";
		      html +=   "<td>";
		      html +=     plugin.descriptions[command] + "</br>";
		      html +=     "<span class='plugin_info'>added by plugin <b>" + plugin.name + "</b> (author: <b>" + plugin.developer + "</b>)</span>";
		      html +=   "</td>";
		      html +=   "<td>";
		      html +=     "<input type='button' class='delete_plugin' data-plugin_url='" + plugin.url + "' value='delete'>";
		      html +=   "</td>";
		      html += "</tr>";
		  return html;
		}
		
	},
	
	tools: {
		
		permalink: function(str) {
      return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
    },
    
		new_id: function(){
			dt = new Date();
			return dt.getTime();
		},
		
		scroll_to_view: function(elm){
			var win_height = $(window).height();
			var position = elm.position();
			var top = position.top - (win_height/2) + elm.height();
			$('body').scrollTop(top);
		},
		
		change_indent_level: function(dir, item){
			var indent_level = parseInt(item.css("marginLeft"), 10) / app.indent_size;
			if(dir == "increase"){
				indent_level += 1;
			}else{
				indent_level -= 1;
				if(indent_level < 0) indent_level = 0;
			}
			item.css("marginLeft", (indent_level * app.indent_size));
			return indent_level;
		},
		
		link_urls: function(text){
		  var exp;
		  
		  // images - holding off on this right now, can just link the images in the mean time
		  // exp = /(\b(https?|ftp|file):\/\/.*\.(gif|jpg|png))/ig;
		  // text = text.replace(exp, "<img data-src='$1' class='image' src='$1'/>");
		  
		  // links
		  exp = /\s(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      text = text.replace(exp, " <a href='$1' target='_blank'>$1</a>");
		  
		  // done!
		  return text;
		}
		
    // clean_for_data_attr: function(val){
    //   val = val.replace(/'/gi, "''");
    //   val = val.replace(/""/gi, '""');
    //   return escape(val);
    // }
		
		
		
	},
	
	ext: {
	  
	  selected: function(){
	    return $(".selected");
	  },
	  
	  status: function(elm){
	    elm = $(elm);
	    if(elm.hasClass("trashed")){
				return "trashed";
			}else if(elm.hasClass("deleted")){
				return "deleted";
			}else if(elm.hasClass("done")){
				return "done";
			}else if(elm.hasClass("editing")){
				return "editing";
			}else{
			  return "normal";
			}
	  }
    
    
	  
	}
	
};

$(document).ready(app.init);