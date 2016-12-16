function startApp() {
    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewAppHome');

    $("#linkMenuAppHome").click(showHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);


    $("#linkMenuUserHome").click(showMenuUserHome);
    $("#linkMenuMyMessages").click(showMenuMyMessages);
    $("#linkMenuArchiveSent").click(showMenuArchiveSend);
    $("#linkMenuSendMessage").click(showMenuSendMessage);
    $("#linkMenuLogout").click(showMenuLogout);

    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);
    $("#formSendMessage").submit(createSendMessage);

    // Home User Navigation
    $('#linkUserHomeMyMessages').click(showMenuMyMessages);
    $('#linkUserHomeSendMessage').click(showMenuSendMessage);
    $('#linkUserHomeArchiveSent').click(showMenuArchiveSend);

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppID = "";
    const kinveyAppSecret = "";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppID + ":" + kinveyAppSecret),
    };

    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHomeView() {
        showView("viewAppHome");
    }

    function showHideMenuLinks() {
        $("#menu a").hide();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $('.anonymous').hide();
            $('.useronly').show();

        } else {

            $('.useronly').hide();
            $('.anonymous').show();
            //
            // // No logged in user
            // $("#linkMenuAppHome").show();
            // $("#linkMenuLogin").show();
            // $("#linkMenuRegister").show();
            //
            // $("#linkMenuUserHome").hide();
            // $("#linkMenuMyMessages").hide();
            // $("#linkMenuArchiveSent").hide();
            // $("#linkMenuSendMessage").hide();
            // $("#linkMenuLogout").hide();
            // $("#spanMenuLoggedInUser").hide();
            // $('#infoBox').hide();
            // $('#errorBox').hide();
            // $('#loadingBox').hide();
        }
    }

    //errors

    // Bind the info / error boxes: hide on click
    $("#infoBox, #errorBox").click(function () {
        $(this).fadeOut();
    });

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    function showMenuUserHome() {
        showView("viewUserHome");
    }


    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');

        // showHideMenuLinks()
    }

    function showRegisterView() {
        $('#linkMenuRegister').trigger('reset');
        showView('viewRegister');

    }

    function showMenuSendMessage() {
        $('#formSendMessage').trigger('reset');
        showView('viewSendMessage');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppID,
            headers: getKinveyUserAuthHeaders(),
            success: displayAllUsers,
            error: handleAjaxError

        })

        function formatSender(name, username) {
            if (!name)
                return username;
            else
                return username + ' (' + name + ')';
        }

        function displayAllUsers(data) {
            $('#msgRecipientUsername').empty();

            let select = $('#msgRecipientUsername');

            for (let user of data) {

                if(user._id == sessionStorage.getItem('userId')){
                    continue;
                }

                let name = user.name;

                let username = user.username;

                let selectName = formatSender(name, username);

                let option = $('<option>').text(selectName);
                select.append(option);
            }
        }

    }


    function showMenuLogout() {
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppID + "/_logout",
            headers: getKinveyUserAuthHeaders(),
        });

        sessionStorage.clear();
        // $('#linkMenuLogin').text("");
        showHideMenuLinks();
        showView('viewAppHome');
        showInfo('Logout successful.');

    }

    function loginUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppID + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showView('viewUserHome');
            showInfo('Login successful.');
        }

        $('#formLogin input[name=username]').val('');
        $('#formLogin input[name=passwd]').val('')

    }

    function registerUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            name: $('#formRegister input[name=name]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppID + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showView('viewUserHome');
            showInfo('User registration successful.');
        }

        $('#formRegister input[name=username]').val('');
        $('#formRegister input[name=passwd]').val('')
    }

    function saveAuthInSession(userInfo) {
        sessionStorage.setItem("authToken", userInfo._kmd.authtoken);
        sessionStorage.setItem("username", userInfo.username);
        sessionStorage.setItem("userId", userInfo._id);
        sessionStorage.setItem("name", userInfo.name);


        $('#viewUserHomeHeading').text(
            "Welcome, " + sessionStorage.getItem('username') + "!");

        $('#spanMenuLoggedInUser').text(
            "Welcome, " + sessionStorage.getItem('username') + "!");
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }


    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " +
            sessionStorage.getItem('authToken'),
        };
    }

    //
    // $.ajax({
    //     method: "GET",
    //     url: kinveyBaseUrl + "appdata/" + kinveyAppID + "/messages",
    //     headers: getKinveyUserAuthHeaders(),
    //     success: loadAllMessages,
    //     error: handleAjaxError
    // });
    //
    // function loadAllMessages(data) {
    //     console.dir(data);
    // }


//// CRATE MESSAGE BY USER
    function createSendMessage(event) {

        event.preventDefault();

        let username = $("#msgRecipientUsername").val().split(' ')[0];
        let name = sessionStorage.getItem('name');

        if(name === ''){
            name = null;
        }

        let messageData = {
            sender_username: sessionStorage.getItem('username'),
            sender_name: name,
            recipient_username: username,
            text: $('#formSendMessage input[name=text]').val(),
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppID + "/messages",
            headers: getKinveyUserAuthHeaders(),
            contentType: "application/json",
            data: JSON.stringify(messageData),
            success: createMessageSuccess,
            error: handleAjaxError
        })

        function createMessageSuccess(message) {
            showInfo('Message created.');
            showMenuArchiveSend();
            // showView('viewArchiveSent');
        }
    }


    function showMenuMyMessages() {
        showView('viewMyMessages');

        let username = sessionStorage.getItem('username');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppID + `/messages?query={"recipient_username":"${username}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMyMessages,
            error: handleAjaxError
        })

        function loadMyMessages(messages) {

            $('#viewMyMessages').empty();

            if (messages.length == 0) {
                // $('#viewMyMessages').text('No messages in the database.');

                let advertsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>To</th><th>Message</th>',
                        '<th>Date Send</th><th>Actions</th>'));
                $('#viewMyMessages').append(advertsTable);

            } else {

                function formatDate(dateISO8601) {
                    let date = new Date(dateISO8601);
                    if (Number.isNaN(date.getDate()))
                        return '';
                    return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
                        "." + date.getFullYear() + ' ' + date.getHours() + ':' +
                        padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

                    function padZeros(num) {
                        return ('0' + num).slice(-2);
                    }
                }

                function formatSender(name, username) {
                    if (!name)
                        return username;
                    else
                        return username + ' (' + name + ')';
                }

                let advertsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>From</th><th>Message</th>',
                        '<th>Date Received</th>'));
                for (let message of messages){

                    let sender_username = message.sender_username;
                    let sender_name = message.sender_name;

                    let name = formatSender(sender_name, sender_username);

                    let date = message._kmd.lmt;
                    let dateParse = formatDate(date);


                    appendAdvertisementRow(message, advertsTable);
                    $('#viewMyMessages').append(advertsTable);


                    function appendAdvertisementRow(advert, messagesTable) {
                        messagesTable.append($('<tr>').append(
                            $('<td>').text(name),
                            $('<td>').text(message.text),
                            $('<td>').text(dateParse)
                        ));
                    }
            }
            }
        }
    }

    function showMenuArchiveSend() {
        showView('viewArchiveSent');

        let username = sessionStorage.getItem('username');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppID + `/messages?query={"sender_username":"${username}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMyArchiveMessages,
            error: handleAjaxError
        })

        function loadMyArchiveMessages(messages) {

            $('#viewArchiveSent').empty();

            if (messages.length == 0) {
                // $('#viewArchiveSent').text('No messages in the database.');

                let advertsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>To</th><th>Message</th>',
                        '<th>Date Send</th><th>Actions</th>'));
                $('#viewArchiveSent').append(advertsTable);
            } else {

                function formatDate(dateISO8601) {
                    let date = new Date(dateISO8601);
                    if (Number.isNaN(date.getDate()))
                        return '';
                    return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
                        "." + date.getFullYear() + ' ' + date.getHours() + ':' +
                        padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

                    function padZeros(num) {
                        return ('0' + num).slice(-2);
                    }
                }

                let advertsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>To</th><th>Message</th>',
                        '<th>Date Send</th><th>Actions</th>'));
                for (let message of messages) {

                    let recipient_username = message.recipient_username;

                    let date = message._kmd.lmt;
                    let dateParse = formatDate(date);


                    appendMessageRow(message, advertsTable);
                    $('#viewArchiveSent').append(advertsTable);

                    function appendMessageRow(message, messagesTable) {
                        let links = [];

                        if (message._acl.creator == sessionStorage['userId']) {
                            let deleteLink = $('<a href="#">[Delete]</a>')
                                .click(function () {
                                    deleteMessage(message)
                                });
                            links = [deleteLink];
                        }

                        messagesTable.append($('<tr>').append(
                            $('<td>').text(recipient_username),
                            $('<td>').text(message.text),
                            $('<td>').text(dateParse),
                            $('<td>').append(links)
                        ));
                    }


                    function deleteMessage(message) {
                        console.dir(message);
                        $.ajax({
                            method: "DELETE",
                            url: kinveyBaseUrl + "appdata/" + kinveyAppID + "/messages/" + message._id,
                            headers: getKinveyUserAuthHeaders(),
                            success: deleteMessageSuccess,
                            error: handleAjaxError
                        });


                        function deleteMessageSuccess(response) {
                            showMenuArchiveSend();
                            showInfo('Message deleted.');
                        }
                    }
                }
            }
        }

    }


}

