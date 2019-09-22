"use strict";

function buildTree(id, currentPageUrl, backButtonId, nextButtonId) {

    var root = document.getElementById(id);
    var backBtn = document.querySelectorAll("#" + backButtonId);
    var nextBtn = document.querySelectorAll("#" + nextButtonId);

    function foreach(array, action) {
        if (array != undefined)
            for (var i = 0; i < array.length; i++)
                action(array[i]);
    };

    function buttonHide(b) {
        for (var i = 0; i < b.length; i++) {
            b[i].style.visibility = 'hidden';
        }

    }
    function nodeShow(n) {
        n.style.display = 'block';
    };
    function nodeHide(n) {
        n.style.display = 'none';
    };
    buttonHide(backBtn);
    buttonHide(nextBtn);

    function buttonUrl(b, url) {
        for (var i = 0; i < b.length; i++) {
            b[i].style.visibility = 'visible';
            b[i].href = url;
        }
    }

    var prevUrl = '/';
    var doNextBtn = false;


    function showChildNodes(nodes) {
        foreach(nodes, function (item) {
            item.show();
            showChildNodes(item.nodes);
        });
    }

    function search(nodes, what) {
        var found = false;
        foreach(nodes, function (item) {
            item.collapse();
            var imFound = false;
            if (item.matches(what)) {
                item.show();

                found = true;
                imFound = true;
            }
            if (search(item.nodes, what)) {
                item.expand();
                item.show();
                found = true;
            }

            if (imFound)
                showChildNodes(item.nodes);

        });
        return found;
    }
    function reset(nodes) {
        var found = false;
        foreach(nodes, function (item) {
            if (item.resetAndReturnTrueIfYouAreSelected())
                found = true;
            if (item.nodes != undefined) {
                if (reset(item.nodes)) {
                    found = true;
                    item.expand();
                }
            }
        });
        return found;
    }



    function buildNodes(nodes, parent) {
        var found = false;
        foreach(nodes,
            function (item) {
                var treeItem = document.createElement('div');
                treeItem.classList.add('TreeItem');

                var plusMinusButton = document.createElement('div');
                plusMinusButton.style.width = '1em';
                plusMinusButton.style.display = 'table-cell';
                plusMinusButton.innerText = '▪';
                plusMinusButton.style.cursor = 'pointer';
                treeItem.appendChild(plusMinusButton);

                var treeItemContent = document.createElement('div');
                treeItemContent.style.display = 'table-cell';
                treeItem.appendChild(treeItemContent);

                var treeTitle = document.createElement('a');
                treeTitle.innerText = item.name;
                treeItemContent.appendChild(treeTitle);

                var keywords = document.createElement('div');
                keywords.style.paddingLeft = '1em';
                keywords.style.fontSize = 'small';
                keywords.innerHTML = 'Keywords: ';
                nodeHide(keywords);
                treeItemContent.appendChild(keywords)



                if (item.url != undefined) {
                    treeTitle.href = item.url;
                    if (doNextBtn) {
                        buttonUrl(nextBtn, treeTitle.href);
                        doNextBtn = false;
                    }
                    if (item.url == currentPageUrl) {
                        found = true;
                        treeItem.classList.add('current-page');
                        buttonUrl(backBtn, prevUrl);
                        doNextBtn = true;
                    }
                    prevUrl = treeTitle.href;
                }


                item.lowerName = item.name.toLowerCase();
                item.lowerKeywords = item.keywords.toLowerCase();
                item.matches = function (what) {
                    var indexInName = item.lowerName.indexOf(what);
                    var found = false;
                    if (indexInName === -1) {
                        treeTitle.innerText = item.name;
                    }
                    else {

                        found = true;
                        var before = item.name.substring(0, indexInName);
                        var middle = item.name.substr(indexInName, what.length);
                        var after = item.name.substr(indexInName + what.length, item.name.length - indexInName - what.length);
                        treeTitle.innerHTML = before + '<strong>' + middle + '</strong>' + after;
                    }

                    var indexInKeywords = item.lowerKeywords.indexOf(what);
                    if (indexInKeywords === -1) {
                        nodeHide(keywords);
                    } else {
                        var before = item.keywords.substring(0, indexInKeywords);
                        var middle = item.keywords.substr(indexInKeywords, what.length);
                        var after = item.keywords.substr(indexInKeywords + what.length, item.keywords.length - indexInKeywords - what.length);
                        if (before.length > 20)
                            before = before.substring(before.length - 20);
                        if (after.length > 20)
                            after = after.substring(0,20);
                        keywords.innerHTML = 'keywords: ' + before + '<strong>' + middle + '</strong>' + after;
                        nodeShow(keywords);
                        found = true;
                    }
                    if (found) {
                        item.show();
                        return true;
                    }
                    else {
                        item.hide();
                        item.collapse();
                        return false;
                    }
                };
                item.resetAndReturnTrueIfYouAreSelected = function () {
                    treeTitle.innerText = item.name;
                    nodeHide(keywords);
                    item.show();
                    item.collapse();
                    if (item.url == currentPageUrl) {
                        item.expand();
                        return true;
                    }
                    else {
                        item.collapse();
                        return false;
                    }


                }

                item.collapse = function () { };
                item.expand = function () { };
                item.hide = function () {
                    nodeHide(treeItem);
                };
                item.show = function () {
                    nodeShow(treeItem);
                };
                parent.appendChild(treeItem);

                if (item.nodes != undefined) {
                    var childNodesContainer = document.createElement('div');
                    childNodesContainer.classList.add('TreeNode');
                    parent.appendChild(childNodesContainer);

                    item.collapse = function () {
                        plusMinusButton.innerText = '+';
                        nodeHide(childNodesContainer);
                    };
                    item.expand = function () {
                        plusMinusButton.innerText = '-';
                        nodeShow(childNodesContainer);
                    };
                    item.toggle = function () {
                        if (childNodesContainer.style.display == 'block')
                            item.collapse();
                        else
                            item.expand();
                    };
                    if (item.url == currentPageUrl)
                        item.expand();
                    else
                        item.collapse();
                    plusMinusButton.onclick = item.toggle;

                    if (buildNodes(item.nodes, childNodesContainer)) {
                        item.expand();
                        found = true;
                    }


                }

            });
        return found;
    };
    $.ajax({
        url: "../../menu.json",
        dataType: "json",
        success: function (data) {
            var searchDiv = document.createElement('div');
            searchDiv.style.padding = '10px';

            var searchInput = document.createElement('input');
            searchInput.style.width = '100%';
            searchInput.placeholder = 'search';


            searchDiv.appendChild(searchInput);
            root.appendChild(searchDiv);
            buildNodes(data.nodes, root);
            var notFoundLink = document.createElement("a");
            {
                var notFoundDiv = document.createElement('div');

                notFoundDiv.className = 'TreeItem';
                notFoundLink.style.display = 'none';
                notFoundLink.href = 'asdf';
                notFoundLink.innerText = "Couldn't find !!!";
                root.appendChild(notFoundDiv);
                notFoundDiv.appendChild(notFoundLink);

            }
            var searchButtonDiv = document.createElement("div");

            

            searchInput.oninput = function () {
                {
                    searchButtonDiv.innerHTML = '';
                    if (searchInput.value != '') {
                        var searchBtn = document.createElement("a");
                        var searchReference = document.createElement("a");


                        searchButtonDiv.className = 'searchButtonsDiv';
                        searchDiv.appendChild(searchButtonDiv);

                        searchBtn.innerText = 'Search';
                        searchBtn.className = "btn btn-neutral";
                        searchBtn.href = "asdfsadfas";
                        searchButtonDiv.appendChild(searchBtn);
                        searchBtn.title = 'Search doc.fireflymigration.com using Google Search';

                        searchReference.innerText = "Search in API";
                        searchReference.href = '123';
                        searchReference.className = "btn btn-neutral";
                        searchReference.style.cssFloat = 'right';
                        searchButtonDiv.appendChild(searchReference);
                        searchBtn.href = 'http://www.google.com/search?q=site:doc.fireflymigration.com ' + encodeURI(searchInput.value);
                        searchBtn.title = "Search the API Documentation using Google Search";
                        
                        searchBtn.target='_blank';
                        searchReference.href = 'http://www.google.com/search?q=site:www.fireflymigration.com/reference ' + encodeURI(searchInput.value);
                        searchReference.target = '_blank';
                    }
                }


                if (searchInput.value == '')
                    reset(data.nodes);
                else
                    if (!search(data.nodes, searchInput.value.toLowerCase())) {

                        ga('send', 'event', 'searchFailed', searchInput.value);
                        notFoundLink.style.display = 'block';
                        notFoundLink.innerHTML = "Sorry, we couldn't find a match for <strong>" +
                            searchInput.value + "</strong>.<br/><br/>You can click search or search API to find more options.<br/></br> Please click here to send us an email about what you were searching for, and we'll get back to you shortly with an answer";
                        notFoundLink.href = "mailto:info@fireflymigration.com?subject=" + encodeURI("Missing info in documentation " + searchInput.value);
                        notFoundLink.target = '_blank';
                    }
                    else notFoundLink.style.display = 'none';
            };
            if (currentPageUrl == '404.html') {
                if (window.location.href.toLowerCase() != window.location.href)
                    window.location.href = window.location.href.toLowerCase();
                else
                    ga('send', 'event', 'page not found', window.location.href);
            }

        }
    });


};