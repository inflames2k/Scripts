// ==UserScript==
// @name         Extended admincall
// @namespace    http://ps.addins.net/
// @version      2.5
// @author       riesaboy
// @match        https://*.knuddels.de:8443/ac/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @require https://code.jquery.com/jquery-3.3.1.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/xregexp/3.2.0/xregexp-all.min.js
// @require https://raw.githubusercontent.com/inflames2k/Scripts/refs/heads/main/extended_admincall_internal.js
// ==/UserScript==

(function() {
    'use strict';

    // function for generation of userdefined warn texts
    function generateWarnTexts()
    {
      // Beispiel für das manuelle Hinzufügen eines Verwarntexts
      //
      // commonWarnTexts.push({
      //  title: 'Bezeichnung des Verstoßes (z.B. Beleidigungen)',
      //  text: 'Text der als Verwarntext versendet wird',
      //  comment: 'Kommentar für automatisches Einfügen in das Abschlusskommentar Feld'
      //});
      //
      // Zur Verfügung stehen folgende Verwarntext-Collections:
      // commonWarnTexts = Allgemeine Verwarnungen (Aussage melden, AE, etc)
      // profileContentWarnTexts = Verwarntexte für Profilverstöße (Readme, Profilinhalte)
      // profilePictureWarnTexts = Verwarntexte für Profilbildverstöße
      //
      // Soll im Verwarntext der Nutzername mit ausgegeben werden, muss im Text folgende Wildcard eingebaut werden:
      // {user}
      // dadurch wird ein einmaliges vorkommen von {user} durch den Namen des gemeldeten ersetzt
    }

    // bootstrap the main script
    bootStrap();
    // generate the user defined warn texts
    generateWarnTexts();
})();
