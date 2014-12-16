// Ugly global variable holding the current card deck
var card_data = [];
var card_options = card_default_options();
var dnd_stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

function mergeSort(arr, compare) {
  if (arr.length < 2)
	return arr;

var middle = parseInt(arr.length / 2);
var left = arr.slice(0, middle);
var right = arr.slice(middle, arr.length);

return merge(mergeSort(left, compare), mergeSort(right, compare), compare);
}

function merge(left, right, compare) {
  var result = [];

  while (left.length && right.length) {
	if (compare(left[0], right[0]) <= 0) {
		result.push(left.shift());
  } else {
		result.push(right.shift());
  }
}

while (left.length)
	result.push(left.shift());

while (right.length)
	result.push(right.shift());

return result;
}

var ui_generate_modal_shown = false;
function ui_generate() {
  if (card_data.length == 0) {
	alert("Your deck is empty. Please define some cards first, or load the sample deck.");
	return;
}

	// Generate output HTML
	var card_html = card_pages_generate_html(card_data, card_options);

	// Open a new window for the output
	// Use a separate window to avoid CSS conflicts
	var tab = window.open("output.html", 'rpg-cards-output');

	if (ui_generate_modal_shown == false) {
		$("#print-modal").modal('show');
		ui_generate_modal_shown = true;
  }

	// Send the generated HTML to the new window
	// Use a delay to give the new window time to set up a message listener
	setTimeout(function () { tab.postMessage(card_html, '*') }, 500);
}

function ui_load_sample() {
	card_data = card_data_example;
	ui_update_card_list();
}

function ui_clear_all() {
	card_data = [];
	ui_update_card_list();
}

function ui_load_files(evt) {
	// ui_clear_all();

	var files = evt.target.files;

	for (var i = 0, f; f = files[i]; i++) {
		var reader = new FileReader();

		reader.onload = function (reader) {
		var data = JSON.parse(this.result);
		ui_add_cards(data);
	};

	reader.readAsText(f);
}

	// Reset file input
	$("#file-load-form")[0].reset();
}

function ui_add_cards(data) {
	card_data = card_data.concat(data);
	ui_update_card_list();
}

function ui_add_new_card() {
	card_data.push(card_default_data());
	ui_update_card_list();
	ui_select_card_by_index(card_data.length - 1);
}

function ui_duplicate_card() {
	if (card_data.length > 0) {
		var old_card = ui_selected_card();
		var new_card = $.extend({}, old_card);
		card_data.push(new_card);
		new_card.title = new_card.title + " (Copy)";
  } else {
		card_data.push(card_default_data());
  }
  ui_update_card_list();
  ui_select_card_by_index(card_data.length - 1);
}

function ui_select_card_by_index(index) {
	$("#selected-card").val(index);
	ui_update_selected_card();
}

function ui_selected_card_index() {
	return parseInt($("#selected-card").val(), 10);
}

function ui_selected_card() {
	return card_data[ui_selected_card_index()];
}

function ui_delete_card() {
	card_data.splice(ui_selected_card_index(), 1);
	ui_update_card_list();
}

function ui_update_card_list() {
	$("#total_card_count").text("Deck contains " + card_data.length + " unique cards.");

	$('#selected-card').empty();
	for (var i = 0; i < card_data.length; ++i) {
		var card = card_data[i];
		$('#selected-card')
		.append($("<option></option>")
		.attr("value", i)
		.text(card.title));
  }

  ui_update_selected_card();
}

function ui_save_file() {
	var str = JSON.stringify(card_data, null, "  ");
	var parts = [str];
	var blob = new Blob(parts, { type: 'application/json' });
	var url = URL.createObjectURL(blob);

	var a = $("#file-save-link")[0];
	a.href = url;
	a.download = "rpg_cards.json";
	a.click();

	setTimeout(function () { URL.revokeObjectURL(url); }, 500);
}

function ui_update_selected_card() {
	var card = ui_selected_card();
	if (card) {
		$("#card-title").val(card.title);
		$("#card-title-size").val(card.title_size);
		$("#card-count").val(card.count);
		$("#card-icon").val(card.icon);
		$("#card-icon-back").val(card.icon_back);
    var contents = [];
    for (var i = 0; i < card.contents.length; i++) {
      var line = card_data_split_params(card.contents[i]);
      contents.push({'id':line[0], 'value':(line[0] == "rule" ? "" : line.slice(1).join(" | "))});
    } 
    $("#card-contents").queryBuilder("setRules", {"rules":contents});
    // $("#card-contents").val(card.contents.join("\n"));
		$("#card-color").val(card.color).change();
  }

  ui_render_selected_card();
}

function ui_render_selected_card() {
	var card = ui_selected_card();
	$('#preview-container').empty();
	if (card) {
    console.log(card);
		var front = card_generate_front(card, card_options);
		var back = card_generate_back(card, card_options);
		$('#preview-container').html(front + "\n" + back);
  }
}

function ui_open_help() {
	window.open("http://crobi.github.io/rpg-cards/", "_blank");
}

function ui_select_icon() {
	window.open("http://game-icons.net/", "_blank");
}

function ui_setup_color_selector() {
	// Insert colors
	$.each(card_colors, function (name, val) {
		$(".colorselector-data")
		.append($("<option></option>")
		.attr("value", name)
		.attr("data-color", val)
		.text(name));
  });
	
	// Callbacks for when the user picks a color
	$('#default_color_selector').colorselector({
		callback: function (value, color, title) {
		$("#default-color").val(title);
		ui_set_default_color(title);
	}
});
	$('#card_color_selector').colorselector({
		callback: function (value, color, title) {
		$("#card-color").val(title);
		ui_set_card_color(value);
	}
});
	$('#foreground_color_selector').colorselector({
		callback: function (value, color, title) {
		$("#foreground-color").val(title);
		ui_set_foreground_color(value);
	}
});
	$('#background_color_selector').colorselector({
		callback: function (value, color, title) {
		$("#background-color").val(title);
		ui_set_background_color(value);
	}
});

	// Styling
	$(".dropdown-colorselector").addClass("input-group-addon color-input-addon");
}

function ui_set_default_color(color) {
	card_options.default_color = color;
	ui_render_selected_card();
}

function ui_set_foreground_color(color) {
	card_options.foreground_color = color;
}

function ui_set_background_color(color) {
	card_options.background_color = color;
}

function ui_change_option() {
	var property = $(this).attr("data-option");
	var value = $(this).val();
	card_options[property] = value;
	ui_render_selected_card();

}

function ui_change_card_title() {
	var title = $("#card-title").val();
	var card = ui_selected_card();
	if (card) {
		card.title = title;
		$("#selected-card option:selected").text(title);
		ui_render_selected_card();
  }
}

function ui_change_card_property() {
	var property = $(this).attr("data-property");
	var value = $(this).val();
	var card = ui_selected_card();
	if (card) {
		card[property] = value;
		ui_render_selected_card();
  }
}

function ui_set_card_color(value) {
	var card = ui_selected_card();
	if (card) {
		card.color = value;
		ui_render_selected_card();
  }
}

function ui_update_card_color_selector(color, input, selector) {
	if ($(selector + " option[value='" + color + "']").length > 0) {
		// Update the color selector to the entered value
		$(selector).colorselector("setValue", color);
	} else {
		// Unknown color - select a neutral color and reset the text value
		$(selector).colorselector("setValue", "");
		input.val(color);
	}
}

function ui_change_card_color() {
  var input = $(this);
  var color = input.val();

  ui_update_card_color_selector(color, input, "#card_color_selector");
  ui_set_card_color(color);
}

function ui_change_default_color() {
  var input = $(this);
  var color = input.val();

  ui_update_card_color_selector(color, input, "#default_color_selector");
  ui_set_default_color(color);
}

function ui_change_default_icon() {
  var value = $(this).val();
  card_options.default_icon = value;
  ui_render_selected_card();
}

function ui_change_card_contents() {
  // var value = $(this).val();
  var json = $("#card-contents").queryBuilder('getRules')
  var card = ui_selected_card();
  if (card && "rules" in json) {
    var rules = json['rules'],
      contents = [];
  	for (var i = 0; i < rules.length; i++) {
  		contents.push(rules[i].field + (rules[i].field == "rule" ? "" : " | ") + rules[i].value);
  	}
    // console.log(contents);
    card.contents = contents;
    ui_render_selected_card();
  }
}

function ui_change_default_title_size() {
  card_options.default_title_size = $(this).val();
  ui_render_selected_card();
}

function ui_change_default_icon_size() {
  card_options.icon_inline = $(this).is(':checked');
  ui_render_selected_card();
}

function ui_sort_by_name() {
  card_data = mergeSort(card_data, function (a, b) {
	if (a.title > b.title) {
		return 1;
  }
  if (a.title < b.title) {
		return -1;
  }
  return 0;
});
  ui_update_card_list();
}

function ui_sort_by_icon() {
  card_data = mergeSort(card_data, function (a, b) {
	if (a.icon > b.icon) {
		return 1;
  }
  if (a.icon < b.icon) {
		return -1;
  }
  return 0;
});
  ui_update_card_list();
}

function ui_apply_default_color() {
  for (var i = 0; i < card_data.length; ++i) {
	card_data[i].color = card_options.default_color;
}
ui_render_selected_card();
}

function ui_apply_default_icon() {
  for (var i = 0; i < card_data.length; ++i) {
	card_data[i].icon = card_options.default_icon;
}
ui_render_selected_card();
}

function ui_apply_default_icon_back() {
  for (var i = 0; i < card_data.length; ++i) {
	card_data[i].icon_back = card_options.default_icon;
}
ui_render_selected_card();
}

$(document).ready(function () {
  ui_setup_color_selector();
  $('.icon-list').typeahead({source:icon_names});

  $("#button-generate").click(ui_generate);
  $("#button-load").click(function () { $("#file-load").click(); });
  $("#file-load").change(ui_load_files);
  $("#button-clear").click(ui_clear_all);
  $("#button-load-sample").click(ui_load_sample);
	//$("#button-save").click(ui_save_file);
	$("#button-sort-name").click(ui_sort_by_name);
	$("#button-sort-icon").click(ui_sort_by_icon);
	$("#button-add-card").click(ui_add_new_card);
	$("#button-duplicate-card").click(ui_duplicate_card);
	$("#button-delete-card").click(ui_delete_card);
	$("#button-help").click(ui_open_help);
	$("#button-apply-color").click(ui_apply_default_color);
	$("#button-apply-icon").click(ui_apply_default_icon);
	$("#button-apply-icon-back").click(ui_apply_default_icon_back);

	$("#selected-card").change(ui_update_selected_card);

	$("#card-title").change(ui_change_card_title);
	$("#card-title-size").change(ui_change_card_property);
	$("#card-icon").change(ui_change_card_property);
	$("#card-count").change(ui_change_card_property);
	$("#card-icon-back").change(ui_change_card_property);
	$("#card-color").change(ui_change_card_color);
	$("#card-contents").change(ui_change_card_contents);

	$("#page-size").change(ui_change_option);
	$("#page-rows").change(ui_change_option);
	$("#page-columns").change(ui_change_option);
	$("#card-arrangement").change(ui_change_option);
	$("#card-size").change(ui_change_option);
	$("#background-color").change(ui_change_option);

	$("#default-color").change(ui_change_default_color);
	$("#default-icon").change(ui_change_default_icon);
	$("#default-title-size").change(ui_change_default_title_size);
	$("#small-icons").change(ui_change_default_icon_size);

  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(ui_change_card_contents);
  observer.observe(document.getElementById("card-contents"), {
    childList:  true,
    subtree:    true
  });

	$(".icon-select-button").click(ui_select_icon);

	var filters = [
		{
			id: 'subtitle',
			label: 'Subtitle',
			type: 'string',
		},
		{
			id: 'section',
			label: 'Section',
			type: 'string',
		},
		{
			id: 'property',
			label: 'Property',
			type: 'string',
			validation: {
				format: /[^\| ]+ ?\| ?[^\| ]+/,
			},
			input: function($rule) {
				var $container = $rule.find('.rule-value-container');
				
				return '<label for="property-name">Name: </label><input type="text" name="property-name"/><br/>'
				+'<label for="property-desc">Description: </label><input type="text" name="property-desc"/>';
			},
			valueParser: function($rule, value, filter, operator) {
				return $rule.find('[name=property-name]').val()
				+ " | " + $rule.find('[name=property-desc]').val();
			},
			onAfterSetValue: function($rule, value, filter, operator) {
				if (operator.accept_values) {
					var val = value.split(/ ?\| ?/);
					$rule.find('[name=property-name]').val(val[0]);
					$rule.find('[name=property-desc]').val(val[1]);
				};
			},
		},
		{
			id: 'description',
			label: 'Description',
			type: 'string',
			validation: {
				format: /[^\| ]+ ?\| ?[^\| ]+/,
			},
			input: function($rule) {
				var $container = $rule.find('.rule-value-container');
				
				return '<label for="description-name">Name: </label><input type="text" name="description-name"/><br/>'
				+'<label for="description-desc">Description: </label><input type="text" name="description-desc"/>';
			},
			valueParser: function($rule, value, filter, operator) {
				return $rule.find('[name=description-name]').val()
				+ " | " + $rule.find('[name=description-desc]').val();
			},
			onAfterSetValue: function($rule, value, filter, operator) {
				if (operator.accept_values) {
					var val = value.split(/ ?\| ?/);
					$rule.find('[name=description-name]').val(val[0]);
					$rule.find('[name=description-desc]').val(val[1]);
				};
			},
		},
		{
			id: 'bullet',
			label: 'Bullet',
			type: 'string',
		},
		{
			id: 'text',
			label: 'Text',
			type: 'string',
		},
		{
			id: 'fill',
			label: 'Fill',
			type: 'integer',
		},
		{
			id: 'rule',
			label: 'Rule',
			type: 'string',
			validation: { callback: function() { return true; } },
			input: function($rule) { return ""; },
			valueParser: function($rule, value, filter, operator) { return ""; },
			onAfterSetValue: function($rule, value, filter, operator) { },
		},
		{
			id: 'boxes',
			label: 'Boxes',
			type: 'string',
			validation: {
				format: /\d+ ?\| ?\d+/,
			},
			input: function($rule) {
				var $container = $rule.find('.rule-value-container');
				
				return '<label for="description-name">Amount: <input type="number" name="boxes-amount"/></label>'
				+'<label for="description-desc">Size: <input type="number" name="boxes-size"/></label>';
			},
			valueParser: function($rule, value, filter, operator) {
				return $rule.find('[name=boxes-amount]').val()
				+ " | " + $rule.find('[name=boxes-size]').val();
			},
			onAfterSetValue: function($rule, value, filter, operator) {
				if (operator.accept_values) {
					var val = value.split(/ ?| ?/);
					$rule.find('[name=boxes-amount]').val(val[0]);
					$rule.find('[name=boxes-size]').val(val[1]);
				};
			},
		},
		{
			id: 'dndstats',
			label: 'DnD Stats',
			type: 'string',
			validation: {
				format: /\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+ ?\| ?\d+/,
			},
			input: function($rule) {
				var $container = $rule.find('.rule-value-container');
				var table = "<table><tbody><tr><th style='text-align: center;'>Stat</th><th style='text-align: center;'>Base</th><th style='text-align: center;'>Mods</th></tr>";
				for (var i = 0; i < dnd_stats.length; i++) {
					table += "<tr><td class='col-xs-2'>"+dnd_stats[i]+"</td>"
								+"<td class='col-xs-4'><input style='text-align: center;' class='col-xs-12' type='number' name='"+dnd_stats[i]+"-base'/></td>"
								+"<td class='col-xs-4'><input style='text-align: center;' class='col-xs-12' type='number' name='"+dnd_stats[i]+"-mods'/></td>";
				}
				return table+"</tbody></table>";
			},
			valueParser: function($rule, value, filter, operator) {
				var base = "", mods = "";
				for (var i = 0; i < dnd_stats.length; i++) {
					if (i > 0) { base += " | "; }
					base += $rule.find('[name='+dnd_stats[i]+'-base]').val();
					mods += " | ";
					mods += $rule.find('[name='+dnd_stats[i]+'-mods]').val();
				}
				return base + mods;
			},
			onAfterSetValue: function($rule, value, filter, operator) {
				if (operator.accept_values) {
					var val = value.split(/ ?| ?/);
					for (var i = 0; i < dnd_stats.length; i++) {
						$rule.find('[name='+dnd_stats[i]+'-base]').val(val[i*2]);
						$rule.find('[name='+dnd_stats[i]+'-mods]').val(val[i*2 + 1]);
					}
				};
			},
		},
	];

	// filters.splice(3, 0, $(this).clone(filters[2]));
	// filters[3].id = "description";
	// filters[3].label = "Description";

	$('#card-contents').queryBuilder({
		sortable: true,
		allow_groups: false,
		conditions: [],
		filters: filters,
	});
	$("#card-contents").find("button[data-add='rule']").html('<i class="glyphicon glyphicon-plus"></i> Add line')
	ui_update_card_list();
});



