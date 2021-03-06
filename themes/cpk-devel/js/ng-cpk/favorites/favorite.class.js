/**
 * Class Favorite for favorites AngularJS app.
 * 
 * Because this Favorite class is implemented as an value, we cannot inject
 * anything, thus it will be logging using native console.error() if any occurs ..
 * 
 * @author Jiří Kozlovský
 */
(function() {

    angular.module('favorites').value('Favorite', Favorite);
    
    var searchItems = undefined;

    function Favorite() {

	// Private
	var vars = {
	    title : {
		link : undefined,
		value : undefined
	    },
	    author : {
		link : undefined,
		value : undefined
	    },
	    published : undefined,
	    format : {
		iconClass : undefined,
		value : undefined
	    },
	    image : undefined,
	    icon : {
		value : undefined,
		style : undefined
	    },
	    created : (new Date()).getTime()
	};

	// Public
	var vm = this;
	
	vm.parseCurrentSearch = function(rank) {
	    if (typeof rank === 'undefined') 
		return console.error('Cannot parse from current search with unknown rank!');
	    
	    rank = parseInt(rank);
	    
	    if (rank < 0)
		return console.error('Invalid rank provided for parsing current search!');
	    
	    if (typeof searchItems === 'undefined') {
		searchItems = $('div#result-list-placeholder').children();
		
		window.addEventListener('searchResultsLoaded', function() {
		    searchItems = $('div#result-list-placeholder').children();
		});
	    }
	    
	    var desiredRecord = searchItems.get(rank);
	    
	    desiredRecord = desiredRecord.getElementsByClassName('row')[0];
	    
	    vm.title(parseTitleForSearchRecord());

	    vm.author(parseAuthorForSearchRecord());
	    
	    vm.format(parseFormatForSearchRecord());

	    vm.published(parsePublishedForSearchRecord());

	    vm.image(parseImageForSearchRecord());
	    
	    return vm;
	    
	    function parseTitleForSearchRecord() {
		var anchor = desiredRecord.querySelector('a.title');
		
		if (anchor) {
		    vm.titleLink(anchor.getAttribute('href'));
		    
		    return anchor.textContent.trim();
		}
		
		console.error('Parsing search record title and link failed!');
	    }

	    function parseAuthorForSearchRecord() {
		var anchor = desiredRecord.querySelector('a.author-info');
		
		if (anchor) {
		    vm.authorLink(anchor.getAttribute('href'));
		    
		    return anchor.textContent.trim();
		}
		
		console.error('Parsing search record author and link failed!');
	    }
	    
	    function parseFormatForSearchRecord() {
		var iconDiv = desiredRecord.querySelector('div.format-list div.iconlabel');

		if (iconDiv) {

		    vm.formatIconClass(iconDiv.getElementsByTagName('i')[0].getAttribute('class'));

		    return iconDiv.getElementsByTagName('span')[0].getAttribute('data-orig');
		}

		console.error('Parsing format icon class failed!');
		console.error('Parsing record format failed!');
		
	    }

	    function parsePublishedForSearchRecord() {
		var span = desiredRecord.querySelector('span.summDate');
		
		if (span) {
		    return span.textContent.trim();
		}

		console.error('Parsing publication date failed!');
	    }

	    function parseImageForSearchRecord() {
		    
		var thumbnail = desiredRecord.getElementsByClassName('coverThumbnail')[0];
		
		var image = thumbnail.getElementsByTagName('img')[0];

		if (typeof image !== 'undefined') {
		    return image.getAttribute('src');
		}

		// Parsing image has failed .. so try to parse an icon
		
		var icon = thumbnail.getElementsByTagName('i')[0];
		
		if (typeof icon !== 'undefined') {
			
		    // Set at least the icon to the object
		    vm.icon(icon.getAttribute('class'));
		    vm.iconStyle(icon.getAttribute('style'));
			
		    // And image is undefined ..
		    return undefined;
		}
		
		console.error('Parsing search image source or icon failed!');
		
	    }
	}

	vm.parseCurrentRecord = function() {

	    var tablePointer = $('table[summary]');
	    var authorPointer = tablePointer.find('tbody tr td[property=author] a');

	    if (authorPointer.length === 0) {
		// Could also be a creator property
		authorPointer = tablePointer.find('tbody tr td[property=creator] a');

		if (authorPointer.length === 0) {
		    // Could also be an contributor
		    authorPointer = tablePointer.find('tbody tr td span[property=contributor] a');
		}
	    }

	    var formatPointer = tablePointer.find('tbody tr td div.iconlabel');

	    // Current pathname should be the right link
	    vm.titleLink(location.pathname);
	    vm.title(parseTitle());

	    vm.authorLink(parseAuthorLink());
	    vm.author(parseAuthor());

	    vm.formatIconClass(parseFormatIconClass());
	    vm.format(parseFormat());

	    vm.published(parsePublished());

	    vm.image(parseImage());

	    return vm; // Respect fluent API

	    function parseTitle() {
		var expectedSiblingHeader = tablePointer.siblings('h2');

		if (expectedSiblingHeader.length)
		    return expectedSiblingHeader.find('strong').text();
		else
		    console.error('Parsing record title failed!');
	    }

	    function parseAuthorLink() {
		var link = authorPointer.prop('href');

		if (typeof link === "string")
		    return link;
		else
		    console.error('Parsing author\'s link failed!');
	    }

	    function parseAuthor() {
		var author = authorPointer.text();

		if (typeof author === "string")
		    return author;

		console.error('Parsing author\'s name failed!');
	    }

	    function parseFormatIconClass() {
		var expectedIcon = formatPointer.children('i');

		if (expectedIcon.length)
		    return expectedIcon.attr('class');

		console.error('Parsing format icon class failed!');
	    }

	    function parseFormat() {
		var expectedSpan = formatPointer.children('span');

		if (expectedSpan.length)
		    return expectedSpan.attr('data-orig');

		console.error('Parsing record format failed!');
	    }

	    function parsePublished() {
		var expectedSpan = tablePointer.find('tbody tr td span[property=publicationDate]');

		if (expectedSpan.length)
		    return expectedSpan.text();

		console.error('Parsing publication year failed!');
	    }

	    function parseImage() {
		var expectedParentSiblingSmallDivision = tablePointer.parent().siblings('div.col-sm-3');

		if (expectedParentSiblingSmallDivision.length) {
		    var expectedImg = expectedParentSiblingSmallDivision.find('img');

		    if (expectedImg.length)
			return expectedImg.attr('src');

		    // Parsing image has failed .. so try to parse an icon
		    var expectedIcon = expectedParentSiblingSmallDivision.find('i[class][style]');

		    if (expectedIcon.length) {
			
			// Set at least the icon to the object
			vm.icon(expectedIcon.attr('class'));
			vm.iconStyle(expectedIcon.attr('style'));
			
			// And image is undefined ..
			return undefined;
		    }		    
		    
		    console.error('Parsing record image source or icon failed!');
		    
		} else
		    // I think this might be appreciated in the future ..
		    console.error('Parsing record image\'s parent division failed!');
	    }
	}

	vm.fromObject = function(obj) {

	    if (typeof obj !== "object") {
		console.error('Trying to create Favorite from object, but no object passed');

	    } else if (!obj.hasOwnProperty('created')) {
		console.error('Missing timestamp of the object!');

	    } else {
		vars = obj;
	    }

	    return vm;
	}

	vm.toObject = function() {
	    return vars;
	}

	// Override native method toString

	vm.toString = function() {
	    return JSON.stringify(vars);
	};

	// Now are here only setters/getters ..

	vm.titleLink = function(titleLink) {

	    if (typeof titleLink === "undefined") {
		return vars.title.link;
	    }

	    vars.title.link = titleLink;
	    return vm;
	}

	vm.title = function(title) {

	    if (typeof title === "undefined") {
		return vars.title.value;
	    }

	    vars.title.value = title;
	    return vm;
	}

	vm.authorLink = function(authorLink) {

	    if (typeof authorLink === "undefined") {
		return vars.author.link;
	    }

	    vars.author.link = authorLink;
	    return vm;
	}

	vm.author = function(author) {

	    if (typeof author === "undefined") {
		return vars.author.value;
	    }

	    vars.author.value = author;
	    return vm;
	}

	vm.published = function(published) {

	    if (typeof published === "undefined") {
		return vars.published;
	    }

	    vars.published = published;
	    return vm;
	}

	vm.formatIconClass = function(formatIconClass) {

	    if (typeof formatIconClass === "undefined") {
		return vars.format.iconClass;
	    }

	    vars.format.iconClass = formatIconClass;
	    return vm;
	}

	vm.format = function(format) {

	    if (typeof format === "undefined") {
		return vars.format.value;
	    }

	    vars.format.value = format;
	    return vm;
	}

	vm.image = function(image) {

	    if (typeof image === "undefined") {
		return vars.image;
	    }

	    vars.image = image;
	    return vm;
	}
	
	vm.icon = function(icon) {

	    if (typeof icon === "undefined") {
		return vars.icon.value;
	    }

	    vars.icon.value = icon;
	    return vm;
	}
	
	vm.iconStyle = function(iconStyle) {

	    if (typeof iconStyle === "undefined") {
		return vars.icon.style;
	    }

	    vars.icon.style = iconStyle;
	    return vm;
	}

	vm.created = function() {
	    return vars.created;
	}
    }
})();