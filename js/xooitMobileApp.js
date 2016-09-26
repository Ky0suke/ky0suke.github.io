////////////////////////////////////////////////////////////
///
///     XooitMobile version prod 1
///     Réalisé par Kyosuke, ne pas reproduire sans autorisation
///     Dernière édition le 30/03/15 à 21:57
///
//////////////////////////////////////////////////////////

// ---- [ App functions ] -------------------------------------------------------------------------

var xooitMobile = {
	location: window.location.pathname + window.location.search,
	init: function() {

		this.checkVersion();
		this.bindEventListeners();
		this.removeAds();
		this.getPrivateMsgsNumber();

		// VIEWTOPIC BODY

		if (window.scriptName === 'viewtopic') {
			this.removeOnClick();
			this.setAuthor();
			this.setLikeBtn();
			this.postsPosition();
		}

		// POSTING BODY

		if (window.scriptName === 'posting' && document.querySelector('#antiflood-captcha'))
			this.getCaptchaId();

		// PRIVMSGS READ BODY

		if (window.scriptName === 'privmsg' && ~ this.location.indexOf('&mode=read')) {
			window.id = this.getId(/p=([0-9]+)/);
			this.postsPosition();
			this.setAuthor();
		}

		// MODCP SPLIT && POSTING BODY

		if (~ this.location.indexOf('&mode=split') || ~ this.location.indexOf('privmsg.php?mode=reply')) {
			this.postsPosition();
			this.setAuthor();
		}

		// PROFILE VIEW BODY

		if (window.scriptName === 'profile')
			window.id = this.getId(/u=([0-9]+)/);

		// INDEX BODY

		if (window.scriptName === 'index') {
			this.hideCategories();

			var statLinks = document.querySelectorAll('.stats a'),
			href;

			if (statLinks) {
				for (var i = 0; i < statLinks.length; i++) {
					href = statLinks[i].href + '&theme=test';
					statLinks[i].setAttribute('href', href);
				}
			}
		}

		// CHAT

		if (~ this.location.indexOf('&chat=1'))
			xooitMobile.showChat();

		// FORUM LIST BUTTON HEADER

		if (window.scriptName !== 'index')
			document.querySelector('#browseBtn').style.display = 'block';

	},
	bindEventListeners: function() {

		// GLOBAL

		var appWrapper 			= document.querySelector('#app-wrapper'),
			menuBtn 			= document.querySelector('#mainMenuBtn'),
			browseForumsBtn 	= document.querySelector('#browseBtn'),
			goToTopBtn 			= document.querySelector('button.go-to-top'),
			toggleLinks 		= document.querySelectorAll('.toggleInformations'),
			jsLinks 			= document.querySelectorAll('[data-url]'),
			eraseSearchButton 	= document.querySelector('span.erase'),
			search 				= document.querySelector("#search");

		window.addEventListener('resize', this.resizeScreen.bind(this));

		if (appWrapper)
			appWrapper.addEventListener('click', this.hideMenus.bind(this));

		if (menuBtn)
			menuBtn.addEventListener('click', this.toggleMainMenu);

		if (browseForumsBtn)
			browseForumsBtn.addEventListener('click', this.toggleBrowseMenu);

		if (goToTopBtn) {
			goToTopBtn.addEventListener('click', function () {
				window.scrollTo(0, 0);
			});
		}

		if (toggleLinks) {
			for (var i = 0; i < toggleLinks.length; i++)
				toggleLinks[i].addEventListener('click', this.toggleInformations);
		}

		if (jsLinks) {
			for (var i = 0; i < jsLinks.length; i++)
				jsLinks[i].addEventListener('click', this.navigateTo);
		}

		if (eraseSearchButton)
			eraseSearchButton.addEventListener('click', this.eraseInputValue);

		if (search) {
			search.addEventListener('keyup', this.searchField);
			search.addEventListener('focusin', this.toggleSearchBtnClass);
			search.addEventListener('focusout', this.toggleSearchBtnClass);
		}

		// INDEX

		var categoriesLabel = document.querySelectorAll('article.categorie label');

		if (categoriesLabel) {
			for (var i = 0; i < categoriesLabel.length; i++) {
				categoriesLabel[i].addEventListener('click', this.toggleCategories);
			}
		}

		// BBCODE EDITOR

		var bbcodeBtn = document.querySelectorAll('#bbcode li');

		if (bbcodeBtn) {
			for (var i = 0; i < bbcodeBtn.length; i++) {
				bbcodeBtn[i].addEventListener('click', this.bbcode);
			}
		}

		// PROFILES

		var avatarInput = document.querySelector('#avatar');

		if (avatarInput) {
			avatarInput.addEventListener('change', this.readIMG);
		}

		// FAQ

		var faqLinks 	= document.querySelectorAll('a.faq-categorie'),
			answerLinks = document.querySelectorAll('a.goto-answer');

		if (faqLinks) {
			for (var i = 0; i < faqLinks.length; i++) {
				faqLinks[i].addEventListener('click', this.showFaqSection);
			}
		}
		if (answerLinks) {
			for (var i = 0; i < answerLinks.length; i++) {
				answerLinks[i].addEventListener('click', this.showFaqAnswer);
			}
		}

		// POSTING BODY

		var usernameInput = document.querySelector('#username_input');

		if (usernameInput)
			usernameInput.addEventListener('keyup', this.searchUsername);

	},
    getId: function (regex) {

        /*
            Récupère un identifiant dans l'URL de la page grâce à une expression régulière passée en paramètre.
            regex: expression régulière
        */

        var vars = window.location.search,
            check = false,
            id;

        if (vars.length > -1) {
            check = regex.test(vars);
            if (check) {
                id = regex.exec(vars)[1];
                return id;
            }
        }
    },
    getUsername: function (method, string) {

        /*
            Récupère le nom d'utilisateur du membre connecté
            method : string (condition / username)
            string: string
        */

        var usernameRegex = /\[\s(.*)\s\]/,
            result = '';

        if (method === 'condition') {
            if (usernameRegex.test(string))
                result = true;
            else
                result = false;
        } else {
            if (usernameRegex.test(string))
                result = usernameRegex.exec(string)[1];
        }
        return result;
    },
    setAuthor: function () {

        /*
            Colore les messages postés par le membre connecté
        */

        var username,
            author,
            arr,
            i;

        if (xooitMobile.getUsername('condition', window.username)) {
            username = xooitMobile.getUsername('username', window.username);
            arr = document.querySelectorAll('.message');
            for (i = 0; i < arr.length; i++) {
                author = arr[i].querySelector('span.username').textContent || arr[i].querySelector('span.username').innerText;
                if (author === username) {
                    arr[i].className += ' author';
                }
            }
        }
    },
    postsPosition: function () {

        /*
            Positionnement des messages en fonction du nom d'utilisateur
        */

        var username,
            previousUsername,
            previousClass = '',
            arr = document.querySelectorAll('.message'),
            i;

        for (i = 0; i < arr.length; i++) {
            username = arr[i].querySelector('span.username').textContent || arr[i].querySelector('span.username').innerText;
            if ((username !== previousUsername) && (i !== 0)) {
                if (previousClass.indexOf('right') === -1) {
                    arr[i].className += ' right';
                }
            }
            if (username === previousUsername) {
                if (previousClass.indexOf('right') !== -1) {
                    arr[i].className += ' right';
                }
            }
            previousUsername = username;
            previousClass = arr[i].className;
        }
    },
    setLikeBtn: function () {

        /*
            Colore l'icône "J'aime" lorsque le message est apprecié par le membre connecté
        */

        var arr = document.querySelectorAll('.message'),
            html = '<a href="#" onClick="alert(\'Vous aimez déj&agrave; ce message.\');return false;"><img src="http://img.xooimage.com/files110/0/c/3/like-4895968.png" height="16" width="16" alt="J\'aime ce message"></a>',
            username = xooitMobile.getUsername('username', window.username),
            currentUsername,
            i;

        for (i = 0; i < arr.length; i++) {
            currentUsername = arr[i].querySelector('span.username').textContent || arr[i].querySelector('span.username').innerText;
            if ((username !== '') && (currentUsername !== username) && (arr[i].previousElementSibling.querySelector('li.like').innerHTML.trim() === "")) {
                arr[i].previousElementSibling.querySelector('li.like').innerHTML = html;
            } else if ((currentUsername === username) || (username === '')) {
                arr[i].previousElementSibling.querySelector('li.like').remove();
            }
        }
    },
    removeOnClick: function () {

        /*
            Retire l'attribut onClick des boutons "Citer" mis en place par Xooit
        */

        var arr = document.querySelectorAll('a[href^="posting.php?mode=quote"]'),
            i;

        for (i = 0; i < arr.length; i++) {
            arr[i].removeAttribute('onclick');
        }
    },
    getCaptchaId: function () {

        /*
            Récupère l'identifiant du captcha
        */

        var id;

        new Ajax.Request(window.location.href.replace('&theme=test', ''), {
            onSuccess: function (response) {
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.responseText;
                id = tempDiv.querySelector('input[name="antiflood_id"]').value;
                if (id.length) {
                    document.querySelector('#antiflood-captcha').setAttribute('src', 'http://www.xooit.com/app/antiflood.php?id=' + id);
                    document.querySelector('input[name="antiflood_id"]').value = id;
                }
            },
            onFailure: function () {
                alert('Une erreur est survenue, veuillez réessayer ultérieurement.');
                window.location.href = window.location.origin + '/index.php?theme=test';
            }
        });
    },
    getPrivateMsgsNumber: function () {

        /*
            Récupère et affiche le nombre de nouveaux messages reçu par le membre connecté.
        */

        var regex = /([0-9]+)/,
            privateMsgs = window.privateMsgs;
        if (regex.test(privateMsgs)) {
            privateMsgs = regex.exec(privateMsgs)[1];
            document.querySelector('#mainMenuBtn').className += ' new';
            document.querySelector('#mainMenuBtn').setAttribute('data-new', privateMsgs);
            document.querySelector('#menu span.fa-envelope-o').className = 'new';
            document.querySelector('#menu span.new').innerHTML = privateMsgs;
        }
    },
    showChat: function () {

        /*
            Affiche le chat
        */

        var html = '<div id="app-illustration">&nbsp;</div><div class="pageTitle"><h1>Chat</h1></div><iframe src="chat3.php?theme=test" id="chat" class="chat-iframe" seamless></iframe>';

        document.querySelector('#app-wrapper').innerHTML = html;
        document.querySelector('#chat').onload = function () {
            window.setInterval(function () {
                document.querySelector('#chat').contentWindow.xooitChat.autoScroll = false;
            }, 100);
        };
    },
    searchUsername: function () {

        /*
            Recherche du nom d'utilisateur en ajax
        */

        var username = document.querySelector('#username_input').value + '*',
            request,
            resultsInput,
            arr,
            i;

        request = new XMLHttpRequest();
        request.open('GET', 'search.php?mode=searchuser&search_username=' + username + '&theme=test', true);
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = request.responseText;
                document.querySelector('ul.search-results').innerHTML = '';
                resultsInput = tempDiv.querySelector('select[name="username_list"]');
                if (resultsInput) {
                    arr = resultsInput.querySelectorAll('option');
                    for (i = 0; i < arr.length; i++) {
                        if (arr[i].value !== 'Aucun enregistrement trouvé.') {
                            document.querySelector('ul.search-results').insertAdjacentHTML('beforeEnd', '<li onClick="xooitMobile.selectUsername(this);">' + arr[i].value + '</li>');
                        }
                    }
                    if (document.querySelector('ul.search-results li')) {
                        document.querySelector('ul.search-results').style.display = 'block';
                    } else {
                        document.querySelector('ul.search-results').style.display = 'none';
                    }
                    tempDiv = null;
                }
            } else {
                alert('Une erreur est survenue, veuillez réessayer ultérieurement.');
                window.location.href = window.location.origin + '/index.php?theme=test';
            }
        };
        request.onerror = function () {
            alert('Une erreur est survenue, veuillez réessayer ultérieurement.');
            window.location.href = window.location.origin + '/index.php?theme=test';
        };
        request.send();
    },
    selectUsername: function (li) {

        /*
            Selection d'un nom d'utilisateur
            li: element HTML
        */

        var username = li.textContent || li.innerText;

        document.querySelector('#username_input').value = username;
        xooitMobile.hideSearchResults();
    },
    hideSearchResults: function () {

        /*
            Cache la liste des noms d'utilisateurs
        */
        var ul = document.querySelector('ul.search-results');
        if (window.getComputedStyle(ul).display === "block") {
            ul.style.display = 'none';
        }
    },
    readIMG: function (input) {

        /*
            Prévisualisation de l'avatar
            input: element HTML
        */

        var file = this.files[0],
            reader = new FileReader(),
            result;

        reader.onload = function (e) {
            result = e.target.result;
            if (xooitMobile.checkType(file.name).length > 0) {
                if (result.substring(0, 11) === 'data:base64') {
                    result = result.replace('data:base64', xooitMobile.checkType(file.name));
                }
            } else {
                window.alert('Ce type de fichier n\'est pas autorisé : veuillez sélectionner une image au format jpg, png ou gif.');
                return false;
            }
            if (document.querySelector('.upload > img')) {
                document.querySelector('.upload > img').setAttribute('src', result);
            } else {
                document.querySelector('.upload').className = document.querySelector('.upload').className.replace('no-avatar', '');
                document.querySelector('.upload').insertAdjacentHTML('afterBegin', '<img src="' + result + '">');
            }
        };
        reader.readAsDataURL(file);
    },
    checkType: function (filename) {

        /*
            Récupère le type du fichier selectionné
            filename: string
        */

        var extension = filename.substring(filename.lastIndexOf('.')),
            result = '';

        switch (extension) {
        case '.jpg':
        case '.jpeg':
            result = 'data:image/jpeg;base64';
            break;
        case '.png':
            result = 'data:image/png;base64';
            break;
        case '.gif':
            result = 'data:image/gif;base64';
            break;
        }
        return result;
    },
    insertTag: function (el, method, openTag, closeTag) {

        /*
            Insère un tag BBcode dans l'éditeur de message
            el: textarea
            method: string (wrap | replace)
            openTag: string
            closeTage: string
        */

        var textArea = document.querySelector(el),
            begin,
            selection,
            end;

        if (typeof textArea.selectionStart !== "undefined") {
            begin = textArea.value.substr(0, textArea.selectionStart);
            selection = textArea.value.substr(textArea.selectionStart, textArea.selectionEnd - textArea.selectionStart);
            end = textArea.value.substr(textArea.selectionEnd);
            if (method === 'wrap') {
                textArea.value = begin + openTag + selection + closeTag + end;
            } else {
                textArea.value = begin + openTag + closeTag + end;
            }
        }
    },
    bbcode: function () {

        /*
            Mini éditeur BBcode
            el: element html
        */

        var bbcode = this.getAttribute('data-bbcode'),
            url,
            emojis,
            emojisLi,
            i1,
            i2;

        switch (bbcode) {
        case 'bold':
            xooitMobile.insertTag('textarea#message', 'wrap', '[b]', '[/b]');
            break;
        case 'italic':
            xooitMobile.insertTag('textarea#message', 'wrap', '[i]', '[/i]');
            break;
        case 'underline':
            xooitMobile.insertTag('textarea#message', 'wrap', '[u]', '[/u]');
            break;
        case 'link':
            url = window.prompt("Saisissez l'adresse du lien :", "http://");
            if (url && url.length > 0) {
                xooitMobile.insertTag('textarea#message', 'wrap', '[url=' + url + ']', '[/url]');
            }
            break;
        case 'emoji':
            emojis = [
                "http://img.xooimage.com/files110/f/3/7/emoji-smiley-01-48c8f9a.png",
                "http://img.xooimage.com/files110/3/7/3/emoji-smiley-02-48c8f9b.png",
                "http://img.xooimage.com/files110/f/6/a/emoji-smiley-03-48c8f9c.png",
                "http://img.xooimage.com/files110/c/6/5/emoji-smiley-04-48c8f9d.png",
                "http://img.xooimage.com/files110/2/1/f/emoji-smiley-05-48c8fa0.png",
                "http://img.xooimage.com/files110/1/6/e/emoji-smiley-06-48c8fa3.png",
                "http://img.xooimage.com/files110/2/e/a/emoji-smiley-07-48c8fa4.png",
                "http://img.xooimage.com/files110/a/8/c/emoji-smiley-08-48c8fa5.png",
                "http://img.xooimage.com/files110/0/c/b/emoji-smiley-09-48c8fa6.png",
                "http://img.xooimage.com/files110/9/c/2/emoji-smiley-10-48c8fa7.png",
                "http://img.xooimage.com/files110/d/a/1/emoji-smiley-11-48c8faa.png",
                "http://img.xooimage.com/files110/7/1/8/emoji-smiley-12-48c8fad.png",
                "http://img.xooimage.com/files110/e/1/d/emoji-smiley-13-48c8fae.png",
                "http://img.xooimage.com/files110/d/b/7/emoji-smiley-14-48c8faf.png",
                "http://img.xooimage.com/files110/5/7/e/emoji-smiley-15-48c8fb0.png",
                "http://img.xooimage.com/files110/e/5/4/emoji-smiley-16-48c8fb3.png",
                "http://img.xooimage.com/files110/f/1/6/emoji-smiley-17-48c8fb7.png",
                "http://img.xooimage.com/files110/d/b/4/emoji-smiley-18-48c8fb4.png",
                "http://img.xooimage.com/files110/7/5/f/emoji-smiley-19-48c8fb8.png",
                "http://img.xooimage.com/files110/a/5/7/emoji-smiley-20-48c8fb9.png",
                "http://img.xooimage.com/files110/3/1/5/emoji-smiley-21-48c8fba.png",
                "http://img.xooimage.com/files110/8/2/3/emoji-smiley-22-48c8fbb.png",
                "http://img.xooimage.com/files110/4/a/9/emoji-smiley-23-48c8fbc.png",
                "http://img.xooimage.com/files110/a/3/8/emoji-smiley-24-48c8fbd.png",
                "http://img.xooimage.com/files110/b/b/3/emoji-smiley-25-48c8fbe.png",
                "http://img.xooimage.com/files110/4/7/c/emoji-smiley-26-48c8fbf.png",
                "http://img.xooimage.com/files110/4/5/8/emoji-smiley-27-48c8fc0.png",
                "http://img.xooimage.com/files110/8/c/4/emoji-smiley-28-48c8fc1.png",
                "http://img.xooimage.com/files110/6/3/e/emoji-smiley-29-48c8fc2.png",
                "http://img.xooimage.com/files110/5/5/3/emoji-smiley-30-48c8fc3.png",
                "http://img.xooimage.com/files110/0/5/b/emoji-smiley-31-48c8fc6.png",
                "http://img.xooimage.com/files110/f/2/8/emoji-smiley-32-48c8fc7.png",
                "http://img.xooimage.com/files110/f/c/4/emoji-smiley-33-48c8fc8.png",
                "http://img.xooimage.com/files110/b/3/9/emoji-smiley-34-48c8fc9.png",
                "http://img.xooimage.com/files110/7/d/9/emoji-smiley-35-48c8fcb.png",
                "http://img.xooimage.com/files110/c/e/f/emoji-smiley-36-48c8fce.png",
                "http://img.xooimage.com/files110/4/8/f/emoji-smiley-37-48c8fcf.png",
                "http://img.xooimage.com/files110/a/2/7/emoji-smiley-38-48c8fd0.png",
                "http://img.xooimage.com/files110/5/2/c/emoji-smiley-39-48c8fd1.png",
                "http://img.xooimage.com/files110/c/6/a/emoji-smiley-41-48c8fd2.png",
                "http://img.xooimage.com/files110/e/0/4/emoji-smiley-42-48c8fd3.png",
                "http://img.xooimage.com/files110/2/d/5/emoji-smiley-43-48c8fd5.png",
                "http://img.xooimage.com/files110/9/3/1/emoji-smiley-44-48c8fd6.png",
                "http://img.xooimage.com/files110/9/e/b/emoji-smiley-45-48c8fd7.png",
                "http://img.xooimage.com/files110/2/8/3/emoji-smiley-46-48c8fda.png",
                "http://img.xooimage.com/files110/b/c/7/emoji-smiley-47-48c8fdb.png",
                "http://img.xooimage.com/files110/2/8/b/emoji-smiley-50-48c8fe0.png",
                "http://img.xooimage.com/files110/a/9/6/emoji-smiley-52-48c8fe3.png",
                "http://img.xooimage.com/files110/6/4/7/emoji-smiley-53-48c8fe4.png",
                "http://img.xooimage.com/files110/a/f/6/emoji-smiley-54-48c8fe5.png",
                "http://img.xooimage.com/files110/9/7/f/emoji-smiley-55-48c8fe6.png",
                "http://img.xooimage.com/files110/9/d/f/emoji-smiley-56-48c8fe7.png",
                "http://img.xooimage.com/files110/c/9/a/emoji-smiley-57-48c8fe8.png",
                "http://img.xooimage.com/files110/3/c/c/emoji-smiley-58-48c8feb.png"
            ];
            if (this.className.indexOf('active') !== -1) {
                this.className = this.className.replace(' active', '');
            } else {
                this.className += ' active';
            }

            if (!document.querySelector('#emojis')) {
                document.querySelector('#bbcode').insertAdjacentHTML('afterEnd', '<ul id="emojis" class="list-unstyled list-inline text-center" style="display: none;"></ul>');

                for (i1 = 0; i1 < emojis.length; i1 += 1) {
                    document.querySelector('#emojis').insertAdjacentHTML('beforeEnd', '<li><img src="' + emojis[i1] + '" alt="" width="50" height="50" class="emoji"></li>');
                }

                if (window.getComputedStyle(document.querySelector("#emojis")).display === "block") {
                    document.querySelector("#emojis").style.display = 'none';
                } else {
                    document.querySelector("#emojis").style.display = 'block';
                }

                emojisLi = document.querySelectorAll('#emojis > li');

                if (emojisLi) {
                    for (i2 = 0; i2 < emojisLi.length; i2 += 1) {
                        emojisLi[i2].addEventListener('click', xooitMobile.insertEmoji.bind(null, emojisLi[i2], el), false);
                    }
                }
            } else {
                if (window.getComputedStyle(document.querySelector("#emojis")).display === "block") {
                    document.querySelector("#emojis").style.display = 'none';
                } else {
                    document.querySelector("#emojis").style.display = 'block';
                }
            }
            break;
        }
    },
    insertEmoji: function (emoji, button) {

        /*
            Insère un emoji dans l'éditeur de message
            emoji: l'élément li qui contient l'emoji
            buton: le bouton qui permet d'afficher/cacher les emojis
        */

        var src = emoji.querySelector('img').src;

        xooitMobile.insertTag('textarea#message', 'replace', '[img]' + src, '[/img]');
        if (button.className.indexOf('active') !== -1) {
            button.className = button.className.replace(' active', '');
        }
        document.querySelector("#emojis").style.display = 'none';
    },
    loading: function (action) {

        /*
            Affiche ou cache l'écran de chargement
            action: string (hide / show)
        */

        if (action === 'hide') {
            document.querySelector('.loading').style.display = 'none';
        } else {
            document.querySelector('.loading').style.display = 'block';
        }
    },
    toggleMainMenu: function () {

        /*
            Affiche ou cache le menu
        */

        if (document.querySelector('#header').className.indexOf('fast') === -1) {
            document.querySelector('#header').className += ' fast';
        }
        if (document.querySelector('#menu ul').className.indexOf('active') === -1) {
            document.querySelector('#menu ul').className += ' active';
            document.querySelector('#header').className += ' active';
            document.querySelector('#app-wrapper').className += ' active greyBlur';
        } else {
            document.querySelector('#menu ul').className = document.querySelector('#menu ul').className.replace('active', '');
            document.querySelector('#header').className = document.querySelector('#header').className.replace(' active', '');
            document.querySelector('#app-wrapper').className = document.querySelector('#app-wrapper').className.replace(' active greyBlur', '');
        }
        if (document.querySelector('#mainMenuBtn > span').className.indexOf('fa-bars') !== -1) {
            document.querySelector('#mainMenuBtn > span').className = document.querySelector('#mainMenuBtn > span').className.replace('fa-bars', 'fa-close');
        } else {
            document.querySelector('#mainMenuBtn > span').className = document.querySelector('#mainMenuBtn > span').className.replace('fa-close', 'fa-bars');
        }
    },
    toggleBrowseMenu: function () {

        /*
            Affiche ou cache le menu d'accès rapide vertical
        */

        var tempDiv,
            target;

        if (document.querySelector('body').className.indexOf('active') !== -1) {
            document.querySelector('body').className = document.querySelector('body').className.replace(' active', '');
        } else {
            document.querySelector('body').className += ' active';
        }
        if (document.querySelector('#browseBtn > span').className.indexOf('fa-ellipsis-h') !== -1) {
            document.querySelector('#browseBtn > span').className = document.querySelector('#browseBtn > span').className.replace('fa-ellipsis-h', 'fa-close');
        } else {
            document.querySelector('#browseBtn > span').className = document.querySelector('#browseBtn > span').className.replace('fa-close', 'fa-ellipsis-h');
        }
        if (!document.querySelector('#browseMenu')) {
            document.querySelector('body').insertAdjacentHTML('beforeEnd', '<div id="browseMenu" class="fast"></div>');
        }
        if (document.querySelector('#browseMenu').className.indexOf('active') === -1) {
            xooitMobile.loading('show');

            new Ajax.Request('index.php?theme=test', {
                onSuccess: function (response) {
                    xooitMobile.loading('hide');
                    tempDiv = document.createElement('div');
                    tempDiv.innerHTML = response.responseText;
                    target = tempDiv.querySelector('#categories');
                    if (target) {
                        document.querySelector('#browseMenu').innerHTML = target.outerHTML;
                        document.querySelector('#browseMenu').className += ' active';
                        document.querySelector('#app-wrapper').className += ' active greyBlur';
                    }
                    tempDiv = null;
                },
                onFailure: function () {
                    xooitMobile.loading('hide');
                    alert('Une erreur est survenue, veuillez réessayer ultérieurement.');
                    window.location.href = window.location.origin + '/index.php?theme=test';
                }
            });
        } else {
            document.querySelector('#browseMenu').className = document.querySelector('#browseMenu').className.replace(' active', '');
            document.querySelector('#app-wrapper').className = document.querySelector('#app-wrapper').className.replace(' active greyBlur', '');
        }
    },
    toggleCategories: function () {

        /*
            Affiche ou cache les catégories de l'index
        */

        var categorie = 'cat-' + this.getAttribute('data-categorie'),
            localData;

        if (window.getComputedStyle(document.querySelector('#' + categorie + ' .subforums-wrapper')).display === "block") {
            document.querySelector('#' + categorie + ' .subforums-wrapper').style.display = 'none';
        } else {
            document.querySelector('#' + categorie + ' .subforums-wrapper').style.display = 'block';
        }

        if (document.querySelector('#' + categorie).className.indexOf('active') !== -1) {
            document.querySelector('#' + categorie).className = document.querySelector('#' + categorie).className.replace(' active', '');
        } else {
            document.querySelector('#' + categorie).className += ' active';
        }

        if (Storage !== void(0)) {
            if (localStorage.getItem('categories')) {
                localData = JSON.parse(localStorage.getItem('categories'));
                localData = JSON.parse(localData.categories);
                if (localData.indexOf(categorie) === -1) {
                    localData.push(categorie);
                } else {
                    localData.splice(localData.indexOf(categorie), 1);
                }
                localData = {
                    'categories': localData
                };
                localStorage.setItem('categories', JSON.stringify(localData));
            } else {
                localData = {
                    'categories': [categorie]
                };
                localStorage.setItem('categories', JSON.stringify(localData));
            }
        }
    },
    hideCategories: function () {

        /*
            Cache les catégories au chargement de la page.
        */

        var localData, i;

        if (Storage !== void(0)) {
            if (localStorage.getItem('categories')) {
                localData = JSON.parse(localStorage.getItem('categories'));
                localData = JSON.parse(localData.categories);
                for (i = 0; i < localData.length; i++) {
                    document.querySelector('#' + localData[i] + ' .subforums-wrapper').style.display = 'none';
                    document.querySelector('#' + localData[i]).className += ' active';
                    document.querySelector('#' + localData[i] + ' input[type="checkbox"]').checked = false;
                }
            }
        }
    },
    showFaqSection: function (e) {

        /*
            Affiche les sections de la FAQ
            link: élément HTML
            e: event
        */

        var target = this.parentNode.querySelector('ul'),
            ul = document.querySelectorAll('ul.faq-links'),
            i;

        e.preventDefault();

        for (i = 0; i < ul.length; i++) {
            ul[i].style.display = 'none';
        }
        target.style.display = 'block';
    },
    showFaqAnswer: function (e) {

        /*
            Affiche la réponse d'une question de la FAQ
            link: élément HTML
            e: event
        */

        var id = this.getAttribute('data-id'),
            answerWrapper = document.querySelectorAll('.faq-answer'),
            i;

        e.preventDefault();

        if (id.length > -1) {
            id = id.replace('#', '');
            for (i = 0; i < answerWrapper.length; i++) {
                if (answerWrapper[i].id === 'question-' + id) {
                    if (answerWrapper[i].className.indexOf('hidden') !== -1) {
                        answerWrapper[i].className = answerWrapper[i].className.replace(' hidden', '');
                    }
                } else {
                    if (answerWrapper[i].className.indexOf('hidden') === -1) {
                        answerWrapper[i].className += ' hidden';
                    }
                }
            }
            window.location.hash = '#question-' + id;
        }
    },
    toggleInformations: function (e) {

        /*
            Affiche ou cache un bloc d'information
            el: élément HTML
            e: event
        */

        e.preventDefault();
        if (window.getComputedStyle(this.nextElementSibling).display === "block")
            this.nextElementSibling.style.display = 'none';
        else
            this.nextElementSibling.style.display = 'block';
    },
    removeAds: function () {

        /*
            Retire les publicités
        */

        var ads = document.querySelectorAll('iframe[src^="/pub.php"]'),
            adsWrapper = document.querySelectorAll('.message-content table'),
            i,
            i2;

        document.querySelector('html').removeAttribute('style');
        document.querySelector('body').removeAttribute('style');
        if (document.querySelector('img[src="http://xooit.xooit.com/images/picsxooit/ombre.png"]')) {
            document.querySelector('img[src="http://xooit.xooit.com/images/picsxooit/ombre.png"]').parentNode.remove();
        }
        if (document.querySelector('#mainDivForCloseCIMDIV')) {
            document.querySelector('#mainDivForCloseCIMDIV').remove();
        }
        for (i = 0; i < ads.length; i++) {
            ads[i].parentNode.remove();
        }
        for (i2 = 0; i2 < adsWrapper.length; i2 += 1) {
            if (adsWrapper[i2].id && adsWrapper[i2].id.length > 10) {
                adsWrapper[i2].remove();
            }
        }
    },
    showAnnounce: function (announce) {

        /*
            Affiche une annonce
            announce: string
        */

        if (typeof announce === 'string' && announce.length > 0) {
            document.querySelector('.pageTitle').insertAdjacentHTML('afterEnd', '<div class="container-fluid"><div class="announce alert alert-warning text-center" role="alert">' + announce + '</div></div>');
        }
    },
    navigateTo: function() {

		/*
			Navigue à une url définir via l'attribut data-url
		*/

    	var url = this.getAttribute('data-url');
    	if (url) document.location.href = url;
    },
    eraseInputValue: function() {

    	/*
			Efface le contenu de l'input search
		*/

    	var button 	= this,
    		input 	= document.querySelector('#search'),
    		li 		= document.querySelector('li.search');

    	input.value 		= '';
        li.className 		= li.className.replace('active', '');
        button.className 	= button.className.replace('show', '');
    },
    resizeScreen: function() {

    	/*
			Se produit lors de la rotation de l'écran
		*/

    	var width = screen.width;

        if (width < 315) {
            this.hideMenus();
        }
    },
    hideMenus: function(e) {

    	/*
			Cache les différents menus dynamiques
		*/

    	var browseForumsMenu 	= document.querySelector('#browseMenu'),
    		menu 				= document.querySelector('#menu ul');

    	e.preventDefault();

		if (browseForumsMenu && ~ browseForumsMenu.className.indexOf('active'))
			this.toggleBrowseMenu();

		if (menu && ~ menu.className.indexOf('active'))
			this.toggleMainMenu();

		return false;
    },
    searchField: function() {

    	/*
			Affiche ou cache le bouton de suppression de l'input search
		*/

    	var eraseBtn = document.querySelector('li.search span.erase');

		if (this.value === '' && ~ eraseBtn.className.indexOf('show'))
			eraseBtn.className = eraseBtn.className.replace(' show', '');

		if (this.value !== '' && eraseBtn.className.indexOf('show') === -1)
			eraseBtn.className += ' show';
    },
    toggleSearchBtnClass: function(e) {

    	/*
			Donne ou enlève la classe active à l'input search
		*/

    	var eventType 	= e.type,
    		li 			= document.querySelector('li.search');

    	if (eventType === 'focusin' && li.className.indexOf('active') == -1)
    		li.className += ' active';

    	if (eventType === 'focusout' && ~ li.className.indexOf('active'))
    		li.className = li.className.replace(' active', '');
    },
    checkVersion: function() {

    	/*
			Vérifie la version du thème
		*/

    	if (window.version !== 'prod_1')
        	this.showAnnounce('Une mise à jour du theme mobile est disponible !');
    }
};

// ---- [ Mise en route de l'App ] ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
	try {
		xooitMobile.init();
	} catch (ex) {
		console && console.error(ex);
	} finally {
		xooitMobile.loading('hide');
	}
});
