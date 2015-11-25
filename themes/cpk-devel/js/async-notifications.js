// TODO: Set "you have no blocks in this institution" if on page Profile or Fines & there are no blocks or fines fetched at all
// TODO: Also update async-profile.js
$(function() { // Onload DOM ..

    // Initialize the notifications' pointers
    __notif.helper.init();

    // We need to acknowledge user about global notifications
    __notif.global.fetch();

    // Now fetch all blocks from institutions user is in
    __notif.blocks.fetch();

    // Now fetch all transactions from institutions user is in
    __notif.fines.fetch();
});

var __notif = {

    options : {

	development : true,

	version : '1.0.2',

	toWait : 60 * 60 * 1000, // Wait 60 minutes until next download

	allowedClasses : [ 'default', 'info', 'warning', 'danger', 'success' ],
    },
}

__notif.blocks = {
    // institutions
    responses : {},
    timeSaved : 0,
    ajaxMethod : 'getMyBlocks',
    localforageItemName : 'blocks',

    fetch : function() {
	// Dont' be passive unless on Profile page ..
	var shouldBePassive = $('body').children('div.template-name-profile').length !== 0;

	if (!shouldBePassive)
	    __notif.helper.fetch(this);
    },

    // This function will render the blocks passed to it ...
    processResponse : function(response) {

	var data = response.data, status = response.status;

	var institution = data.source, blocks = data.blocks, count = data.count, message = data.message;

	if (status === 'OK') {

	    if (count !== 0) {
		Object.keys(blocks).forEach(
			function(key) {
			    __notif.addNotification(blocks[key], 'warning',
				    institution);
			});
	    }

	} else { // We have recieved an error
	    // FIXME: Where is the element defined ??
	    element.children('i').remove();

	    var message = data.message;
	    if (message === undefined)
		message = 'Unknown error occured';

	    element.children('span.label').text(message).removeClass(
		    'label-primary').addClass('label-danger');
	}
    },
};

__notif.fines = {
    // institutions
    responses : {},
    timeSaved : 0,
    ajaxMethod : 'getMyFines',
    localforageItemName : 'fines',

    fetch : function() {
	// Dont' be passive unless on Profile page ..
	var shouldBePassive = document.location.pathname
		.match(/^\/[a-zA-Z]+\/Fines/);

	if (!shouldBePassive)
	    __notif.helper.fetch(this);
    },

    // This function will render the fines passed to it ...
    processResponse : function(response) {
	// TODO
	return false;
    },
};

__notif.global = {
    // TODO: think about global notifications being parsed asynchronously ..
    fetch : function() {
	var initialCount = __notif.helper.pointers.global
		.children('div:not(.counter-ignore)').length;

	if (initialCount > 0)
	    __notif.helper.warning.show();
    }
};

/**
 * Appends a notification message.
 * 
 * Syntax is: __notif.addNotification( message [, msgclass , institution ] )
 * 
 * msgclass can be one of __notif.options.allowedClasses
 * 
 * institution can be any string defining the source the MultiBackend uses to
 * recognize an institution
 * 
 */
__notif.addNotification = function(message, msgclass, institution,
	showWarningIcon) {

    if (message === undefined) {
	return this.printErr('Please provide message to notify about.');
    }

    var identityNotificationsElement = __notif.helper
	    .getIdentityNotificationsElement(institution);

    if (identityNotificationsElement === false)
	return false;

    // Get the loading div if any
    var loader = identityNotificationsElement.children('[data-type=loader]');

    // Remove it if not already done
    if (loader.length)
	loader.remove();

    // Create the notification Element
    var notif = document.createElement('div');

    if (msgclass === undefined
	    || this.options.allowedClasses.indexOf(msgclass) === -1) {
	msgclass = 'default';
    }

    if (showWarningIcon === undefined) {
	showWarningIcon = true;
    }

    var clazz = 'notif-' + msgclass;

    if (!showWarningIcon) {
	clazz += ' counter-ignore';
    } else {
	__notif.helper.warning.show();
    }

    notif.setAttribute('class', clazz);
    notif.textContent = message;

    // Append the notification
    identityNotificationsElement.append(notif);
    identityNotificationsElement.parent('li').show();

    return true;
};

__notif.helper = {

    /**
     * Pointers point to various sections after init() is called Only parent
     * pointer resolves whole notifications section
     */
    pointers : {
	parent : undefined,
	global : undefined, // Global notifications usually loaded synchronously
	warningIcon : undefined, // Warning icon user should pay attention to

	institutions : {},
    },

    institutionsCount : 0,

    /**
     * This one holds the handlers which are now in state of fetching the data
     * from the institutions in order to be able of calling
     * allNotificationsFetched() after all of them are done.
     */
    handlersFetching : {},

    /**
     * Variable determining whether is syncing the institutions in process
     * alredy
     * 
     * FIXME rework syncing so it synchronizes all handlers at once
     */
    syncingInstitutionsAlready : false,

    /**
     * Decide based on number of notifications fetched, whether to show
     * translated message 'without_notifications' or show nothing at all in
     * global notifications section.
     * 
     * There can be shown three states:
     * 
     * 1) We are loading newest notifications right now, please wait
     * 
     * 2) Custom global messages defined in notifications.ini when the're
     * enabled
     * 
     * 3) Showing translated 'without_notifications' as told if there is nothing
     * to notify about
     */
    allNotificationsFetched : function() {
	// TODO call this function after are fetched all possible notifications
	// from all the institutions user has valid account in

	// Remove the loader
	__notif.helper.pointers.global.siblings('[data-type=loader]').remove();

	// Detect we have recieved any showable notifications
	var haveAnythingToShow = false;

	var institutionsKeys = Object
		.keys(__notif.helper.pointers.institutions);

	var institutionsKeysLength = institutionsKeys.length;

	for (var i = 0; i < institutionsKeysLength; ++i) {
	    var institution = __notif.helper.pointers.institutions[institutionsKeys[i]];

	    var notificationsCount = institution
		    .children('div:not(.counter-ignore)').length;

	    if (notificationsCount !== 0) {
		haveAnythingToShow = true;
		break;
	    }
	}

	// Show the translated message 'without_notifications' if we have no
	// notifications to show
	if (!haveAnythingToShow) {
	    __notif.helper.pointers.global.show();
	} else {
	    // Now hide the global notifications as we have nothing to show
	    // there .. (unless there are notifyable global notifications)

	    var globalNotificationsCount = __notif.helper.pointers.global
		    .children('div:not(.counter-ignore)').length;

	    if (globalNotificationsCount === 0)
		__notif.helper.pointers.global.parent().hide();
	}
    },

    /**
     * Check User's last version of this app used in order to delete
     * incompatible variables stored in localforage
     * 
     */
    checkVersion : function() {

	var localforageVersionName = '__notif.version';

	var setCurrVersion = function() {
	    // Set the version to the current version
	    localforage
		    .setItem(localforageVersionName, __notif.options.version);
	}

	var getVersionCallback = function(err, val) {
	    __notif.helper.printErr(err, val);

	    if (val === null) {
		// FIXME remove this global localforage removal as it would wipe
		// out other saved object not desired to be wiped out later

		// it is here mainly because in the earliest version we cannot
		// recognize the notifications' object within storage
		localforage.clear();

		// Set the version to the current version
		setCurrVersion();

	    } else if (val !== __notif.options.version) {
		__notif.helper.clearTheCrumbs();

		// Set the version to the current version
		setCurrVersion();
	    }

	};

	localforage.getItem(localforageVersionName, getVersionCallback);
    },

    /**
     * Clears provided identity's stored notification Useful e.g. while
     * disconnecting an account ..
     * 
     * @param handler
     * @param institutions
     */
    clearInstitutions : function(handler, institutions) {
	var responsesTmp = {};

	Object.keys(handler.responses).forEach(function(key) {
	    if (institutions.indexOf(key) === -1)
		responsesTmp[key] = handler.responses[key];
	});

	handler.responses = responsesTmp;

	// This one is called only if we have young enough notifications
	__notif.helper.save(handler);

    },

    /**
     * Clears all the notifications' object from the localforage storage :)
     */
    clearTheCrumbs : function() {

	localforage.iterate(function(value, key, iterationNumber) {

	    if (key.match(/^notif\./) !== null)
		localforage.removeItem(key);

	});

    },

    /**
     * Downloads all possible notifications within a handler
     * 
     * @param handler
     */
    downloadAll : function(handler) {

	var downloadCallback = function(source) {
	    var institution = __notif.helper.pointers.institutions[source];

	    var cat_username = institution.attr('data-id');
	    __notif.helper.downloadFor(handler, cat_username);
	};

	Object.keys(__notif.helper.pointers.institutions).forEach(
		downloadCallback);
    },

    /**
     * Create a query to fetch notifications about one institution
     * 
     * @param handler
     * @param cat_username
     * @returns
     */
    downloadFor : function(handler, cat_username) {

	if (cat_username === undefined) {
	    return __notif.helper.printErr('No cat_username provided !');
	}

	$.ajax({
	    type : 'POST',
	    url : '/AJAX/JSON?method=' + handler.ajaxMethod,
	    dataType : 'json',
	    async : true,
	    data : {
		cat_username : cat_username
	    },
	    success : function(response) {

		__notif.helper.saveResponse(handler, response);

		__notif.helper.processResponse(handler, response);
	    },
	    error : function(err) {
		__notif.helper.printErr(err);
	    }
	});
    },

    /**
     * Perform the fetching for all identites using provided handler
     * 
     * @param handler
     */
    fetch : function(handler) {

	// Set the fetching count to determine when we are done
	__notif.helper.handlersFetching[handler.localforageItemName] = __notif.helper.institutionsCount;

	// Get the notifies object from storage
	localforage.getItem('__notif.' + handler.localforageItemName, function(
		err, savedResponses) {

	    __notif.helper.printErr(err, savedResponses);

	    __notif.helper.processSavedResponses(handler, savedResponses);
	});
    },

    /**
     * Retrieves pointer to an element holding all the notifications used within
     * that institution.
     * 
     * @param source
     * @returns
     */
    getIdentityNotificationsElement : function(source) {
	if (source === undefined) {
	    // Set default identity
	    return __notif.helper.pointers.global;
	}

	var identityNotificationsElement = __notif.helper.pointers.institutions[source];

	// Did we find the identity?
	if (identityNotificationsElement === undefined
		|| !identityNotificationsElement.length) {

	    var message = "Pointer for '" + source
		    + "' wasn't properly initialized."
		    + ' An attempt to resolve it failed';

	    this.printErr(message);

	    message = 'Are you sure you are trying to access existing institution notifications?';
	    return this.printErr(message);
	}

	return identityNotificationsElement;
    },

    /**
     * This method is called after a handler finishes fetching of all the
     * institutions needed.
     * 
     * It serves to call the allNotificationsFetched() method after all handlers
     * are done.
     * 
     * @param handler
     */
    handlerDoneFetching : function(handler) {

	delete __notif.helper.handlersFetching[handler.localforageItemName];

	var handlersFetchingCount = Object
		.keys(__notif.helper.handlersFetching).length;

	if (handlersFetchingCount === 0)
	    __notif.helper.allNotificationsFetched();

    },

    /**
     * This function essentially stores all the pointers needed to prevent doing
     * multiple selects while they're slow.
     * 
     * It also checks for last version of notifications implementations in order
     * to clear the localforage to prevent bugs caused by version
     * incompatibility.
     */
    init : function() {

	var notifList = $('div#header-collapse nav ul li ul#notificationsList');

	__notif.helper.pointers.parent = notifList;

	// Get all divs with any data-type
	var sections = notifList.children('li').children('div[data-type]');

	// Iterate over these & decide which one is global & which is an
	// institution div
	sections.each(function(i, section) {

	    var type = section.getAttribute('data-type');

	    if (type === 'global') {

		__notif.helper.pointers.global = $(section);
	    } else if (type === 'institution') {

		++__notif.helper.institutionsCount;

		var source = section.getAttribute('data-source');

		__notif.helper.pointers.institutions[source] = $(section);
	    } else if (type !== 'loader') {
		var msg = 'Unknown data-type encoutered within notifications';
		__notif.helper.printErr(msg);
	    }

	});

	if (__notif.helper.pointers.global === undefined
		|| !__notif.helper.pointers.global.length) {
	    var message = 'Could not resolve notifications global pointer !\n'
		    + 'Please consider adding div[data-type=global] inside any <li>'
		    + "__notif.addNotification() won't work correctly until fixed";

	    __notif.helper.printErr(message);
	}

	// Resolve the counter span
	var warningIcon = notifList.siblings('a#notif_icon').children(
		'i#notif-warning');

	if (warningIcon.length) {
	    __notif.helper.pointers.warningIcon = warningIcon;
	} else {
	    var message = 'Could not resolve warning icon pointer !\n'
		    + "User won't see any warning showed up when "
		    + 'notifications are added until fixed';

	    __notif.helper.printErr(message);
	}

	// Now check user already updated his storage data
	__notif.helper.checkVersion();
    },

    /**
     * Error printing function
     * 
     * @param err
     * @param val
     * @returns {Boolean}
     */
    printErr : function(err, val) {
	if (__notif.options.development && err !== null) {
	    console.error("notifications.js produced an error: " + err);
	    if (val !== null) {
		console.error("value having problem with is '" + val + "'");
	    }
	}
	return false;
    },

    /**
     * Serves to send the response to handler's own processResponse() method &
     * to determine, if the handler is done fetching all the notifications from
     * all the institutions in order to trigget
     * __notif.helper.handlerDoneFetching() method
     * 
     * @param handler
     * @param response
     */
    processResponse : function(handler, response) {

	// Let the handler handle the response itself
	handler.processResponse(response);

	// Decide if the handler is done fetching
	if (--__notif.helper.handlersFetching[handler.localforageItemName] < 1) {
	    // Wait 500 ms until all the other handlers actualize the
	    // __notif.helper.handlersFetching
	    setTimeout(function() {
		__notif.helper.handlerDoneFetching(handler);
	    }, 500);
	}
    },

    /**
     * Manages saving the responses used with provided handler & calls the
     * handler.processResponse() method in order to have customizable behavior
     * for each handler
     * 
     * @param handler
     * @param savedResponses
     * @returns
     */
    processSavedResponses : function(handler, savedResponses) {

	// localforage returns null if not found
	if (savedResponses === null) {

	    // Download then all
	    __notif.helper.downloadAll(handler);
	} else {
	    // Found some responses for handler provided

	    // Update handler's variables
	    handler.responses = savedResponses.responses;
	    handler.timeSaved = savedResponses.timeSaved;

	    // Decide whether will we renew the notifications
	    if (__notif.helper.shouldWeFetchAgain(handler)) {
		return __notif.helper.downloadAll(handler);
	    }

	    if (!__notif.helper.syncingInstitutionsAlready) {

		__notif.helper.syncingInstitutionsAlready = true;

		// Check for another identities / delete disconnected ones
		var currIdentities = Object.keys(savedResponses.responses);
		__notif.helper.syncInstitutions(handler, currIdentities);
	    }

	    // Print saved values ..
	    $.each(savedResponses.responses, function(i, response) {
		__notif.helper.processResponse(handler, response);
	    });
	}
    },

    /**
     * Do not call this function twice - as it'd probably result in an error.
     * 
     * It handles saving handler's state using localforage library.
     * 
     * @param handler
     */
    save : function(handler) {

	var localforageItem = {
	    responses : handler.responses,
	    timeSaved : Date.now()
	};

	localforage.setItem('__notif.' + handler.localforageItemName,
		localforageItem, function(err, val) {
		    __notif.helper.printErr(err, val);
		});
    },

    /**
     * Updates saved notifications used by provided handler
     * 
     * @param handler
     * @param response
     */
    saveResponse : function(handler, response) {

	var institution = response.data.source;

	handler.responses[institution] = response;

	var institutionsCount = Object
		.keys(__notif.helper.pointers.institutions).length;
	// have we fetched all the institutions ?
	// FIXME possible unexpected behavior?
	if (Object.keys(handler.responses).length >= institutionsCount) {

	    // This one is called only after fresh notifications were
	    // fetched
	    __notif.helper.save(handler);
	}
    },

    /**
     * Decies if it is the time now to fetch notifications again using provided
     * handler.
     * 
     * @param handler
     * @returns {Boolean}
     */
    shouldWeFetchAgain : function(handler) {
	if (handler.timeSaved === undefined
		|| typeof handler.timeSaved !== 'number'
		|| handler.timeSaved !== 0) {

	    var shouldWeFetchAgain = __notif.options.toWait + handler.timeSaved < Date
		    .now();

	    return shouldWeFetchAgain;
	} else {
	    return true;
	}
    },

    /**
     * Checks for (dis)connected identities
     * 
     * TODO: Make the sync process handler-independent.
     * 
     * @param handler
     * @param currIdentities
     */
    syncInstitutions : function(handler, currIdentities) {

	var filterCallback = function(source) {

	    // Did we have this identity already ?
	    var i = currIdentities.indexOf(source);

	    if (i > -1) {
		// Yes, this identity we know
		currIdentities.splice(i, 1);
	    } else {

		// No, we don't know anything about this
		// identity ->
		// New identity connected

		// Fetch notificatios for new cat_username
		var cat_username = __notif.helper.pointers.institutions[source]
			.attr('data-id');

		__notif.helper.downloadFor(handler, cat_username);
	    }
	};

	// Perform the callback on all institutions
	Object.keys(__notif.helper.pointers.institutions).forEach(
		filterCallback);

	if (currIdentities.length > 0) {
	    // Some identities were disconnected

	    // Remove those disconnected identites from storage
	    __notif.helper.clearInstitutions(currIdentities);
	}
    },

    /**
     * Object holding two methods show() & hide() to show or hide notifications'
     * warning easily
     */
    warning : {
	showedAlready : false,

	show : function() {
	    if (!this.showedAlready) {
		this.showedAlready = true;
		__notif.helper.pointers.warningIcon.show();
	    }
	},

	hide : function() {
	    if (this.showedAlready) {
		this.showedAlready = false;
		__notif.helper.pointers.warningIcon.hide();
	    }
	}
    },
};