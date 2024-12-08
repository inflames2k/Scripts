// ==UserScript==
// @name         Extended admincall
// @namespace    http://ps.addins.net/
// @version      2.0
// @author       riesaboy
// @match        https://*.knuddels.de:8443/ac/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @downloadURL https://raw.githubusercontent.com/inflames2k/Scripts/refs/heads/main/extended_admincall.js
// @require https://code.jquery.com/jquery-3.3.1.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/xregexp/3.2.0/xregexp-all.min.js
// @change       20240806 - Added report processing quota
// @change       20240807 - Corrected output of report processing quota
// @change       20240808 - Added full row clicking in tables
// @change       20240809 - Layout optimizations
// @change       20240919 - Automatically set "filterrelevant" on botCommand, scammerCommand and nagbCommand; fixed widths of sanctions
// @change       20241205 - Added functionality to set warn texts to user
// @Change       20241205 - Added dark mode
// @Change       20241206 - Linked report id's in admin informations of reporter, reported user and sanction user comment
// ==/UserScript==

(function() {
    'use strict';

     const reportID = $('h1:contains("Knuddels.de - Meldesystem")').text().replace('Knuddels.de - Meldesystem - Meldung ', '').split(' ')[0];
     const $reportedUser = $($("h3 div span").filter(function () { return $(this).css('color') === 'rgb(153, 0, 0)'; }).get(0)).text();

     const commonWarnTexts = [];
     const profilePictureWarnTexts = [];
     const profileContentWarnTexts = [];
     const requestReportLinkUser = "Jiacky";

     var currentStyle = "Light";

     autoRefresh();
     addOverlay();
     modifyLayout();

     modifyNavigation();
     modifyLog();
     filterActions();
     setReportQuota();

     createWarningTexts();

    function createWarningTexts()
    {
      // create common warningTexts
      commonWarnTexts.push({
        title: 'Provokationen / Beleidigungen',
        text: 'Hallo '+ $reportedUser +',#du fielst durch Beleidigungen und / oder Provokationen gegenüber anderen Mitgliedern auf. Derartiges Verhalten entspricht nicht dem Knigge und den AGB von Knuddels.#Man sollte Menschen mit Respekt und Toleranz begegnen.#Bitte halte dich in Zukunft an die AGB und den Knigge.',
        comment: 'BS fällt hier durch Beleidigungen / Provokationen auf. Daher hier verwarnt.'
      });

      commonWarnTexts.push({
        title: 'Fremdseitenwerbung',
        text: 'Hallo '+ $reportedUser +',#du fielst durch Werbung für externe Seiten auf. Entsprechend AGB Punkt 6 ist derartige Werbung nicht gestattet.#Bitte halte dich zukünftig an die AGB.',
        comment: 'BS fällt hier durch Werbung für eine externe Website auf. Daher hier verwarnt.'
      });

      commonWarnTexts.push({
        title: 'Sexuelle Belästigung Erwachsener',
        text: 'Hallo '+ $reportedUser +',#du fielst durch Belästigung anderer Mitglieder in Form sexueller Anfragen bzw. Aussagen auf. Derartiges Verhalten entspricht nicht dem Knigge und den AGB.#Solltest du weiterhin Interesse an sexuellen Themen haben, besuche bitte Erotic-Channels wie _/Erotic_, _/Matratzensport_ oder _/Verbotene Spiele_.',
        comment: 'BS fällt hier durch eindeutige sexuelle Belästigung Erwachsener auf. Daher hier verwarnt.'
      });

      commonWarnTexts.push({
        title: 'Messengerwerbung',
        text: 'Hallo '+ $reportedUser +',#du fielst durch Werbung für externe Messenger oder andere Kommunikationsplattformen auf. Entsprechend AGB Punkt 5.6 ist derartige Werbung nicht gestattet.#Bitte unterlasse derartiges Verhalten zukünftig und halte dich an die AGB.',
        comment: 'BS fällt hier durch Werbung für einen Fremdmessenger bzw. eine andere Kommunikationsplattform auf. Daher hier verwarnt.'
      });

      commonWarnTexts.push({
        title: 'dubiose öffentliche sexuelle Anfragen',
        text: 'Hallo ' + $reportedUser + ',du fielst durch (dubiose) öffentliche sexuelle Anfragen außerhalb von Erotic-Channels auf. In den allermeisten Channels sind derartige Anfragen nicht erwünscht und entsprechen demnach auch nicht den AGB.##Solltest du weiterhin Interesse an sexuellen Themen haben, besuche bitte Erotic-Channels wie _/Erotic_, _/Matratzensport_ oder _/Verbotene Spiele_.',
        comment: 'BS fällt hier durch (dubiose) öffentliche sexuelle Anfragen auf. Daher hier verwarnt.'
      })

      commonWarnTexts.push({
        title: 'Rollenspielanfragen (sexuell)',
        text: 'Hallo ' + $reportedUser + ',du fielst durch öffentliche Rollenspielanfragen mit sexuellem Hintergrund außerhalb von Erotic-Channels auf. In den allermeisten Channels sind derartige Anfragen nicht erwünscht und entsprechen demnach auch nicht den AGB.##Solltest du weiterhin Interesse an sexuellen Themen haben, besuche bitte Erotic-Channels wie _/Erotic_, _/Matratzensport_ oder _/Verbotene Spiele_.',
        comment: 'BS fällt hier durch öffentliche Rollenspielanfragen mit sexuellem Hintergrund auf. Daher verwarnt.'
      })

      commonWarnTexts.push({
        title: 'Fremdsprachennutzung',
        text: 'Hallo ' + $reportedUser + ',du fielst durch öffentliche Nutzung von Fremdsprachen auf. Gemäß den AGB sind jedoch nur Deutsch und Englisch als Chatsprachen erlaubt.#Bitte nutze in Zukunft eine dieser beiden Sprachen.',
        comment: 'BS fällt hier durch Nutzung einer Fremdsprache auf. Daher hier verwarnt.'
      })

      profileContentWarnTexts.push({
        title: 'Messengerwerbung (Readme)',
        text: 'Hallo ' + $reportedUser + ',#ich habe soeben deine Readme entfernt.#Der öffentliche Verweis auf andere Kommunikations- und Messenger Plattformen, die nicht Teil der Knuddels-Dienste sind, ist nicht gestattet. [AGB Punkt 5.6].#Bitte achte künftig darauf, wenn du wieder eine Readme setzen solltest.#Im Rahmen dessen kann die erneute Nennung anderer Kommunikations- und Messenger Plattformen in der Readme künftig zu Nicksperren führen.#Für Rückfragen stehe ich dir gerne zur Verfügung.##Knuddelige Grüße',
        comment: 'BS fällt hier durch Werbung für Fremdmessenger im Readme auf. 1. Verstoß daher hier verwarnt.'
      })

      profileContentWarnTexts.push({
        title: 'Messengerwerbung (Profil)',
        text: 'Hallo ' + $reportedUser + ',#ich habe soeben deine Profil-Tabs gesperrt.#Der öffentliche Verweis auf andere Kommunikations- und Messenger Plattformen, die nicht Teil der Knuddels-Dienste sind, ist nicht gestattet. [AGB Punkt 5.6].#Bitte entferne die entsprechenden Inhalte in deinem Profil und achte künftig darauf, wenn du wieder Profilinhalte setzen solltest.#Im Rahmen dessen kann die erneute Nennung anderer Kommunikations- und Messenger Plattformen im Profil künftig zu Nicksperren führen.#Nach Entfernung der entsprechenden Inhalte aus deinem Profil, kannst du dich zur Freigabe an mich wenden.#Für Rückfragen stehe ich dir gerne zur Verfügung.##Knuddelige Grüße',
        comment: 'BS fällt durch Messengerwerbung im Profil auf. Profiltabs gesperrt und verwarnt.',
      })

      profilePictureWarnTexts.push({
        title: 'Schlechte Qualität / Nicht erkennbar / Nickbesitzer nicht abgebildet',
        text: 'Hinweisnachricht des Profil-Teams§Hallo,##du hast leider erneut ein Foto hochgeladen, welches mit unseren °>/h Fotoregeln<° nicht übereinstimmt. Diese Nachricht dient als ausdrücklicher Hinweis. Bitte halte dich künftig an die Fotoregeln und lade nur Bilder hoch, auf denen du gut zu erkennen bzw. selbst abgebildet bist.##Solltest du Probleme damit haben, einschätzen zu können, welches Bild unseren Fotoregeln entspricht, kannst du dich auch gerne jederzeit an ein Mitglied des Profil-Teams wenden. Solltest du einen direkten Ansprechpartner des Teams suchen, kannst du im Chat _/team Profil_ eingeben. Dort findest du Teammitglieder, welche aktuell online sind.##Für Rückfragen stehe ich dir gerne zur Verfügung.#Ich bitte dich, meine Hinweisnachricht entsprechend zu beherzigen, denn das Profilfoto sollte ja schließlich dazu dienen zu erkennen, mit wem man eigentlich spricht.#Liebe Grüße',
        comment: '[Bildbeschreibung]\r\n\r\nAls nicht [erkennbar/selbst] verschoben.\r\n3. Verstoß => VW + AI Eintrag'
      })
    }


    function addOverlay()
    {
        // append modal div
        $('#content').parent().parent().html($('#content').parent().parent().html() + `
        <div class="modal" id="modal">
					<div class="modal-content">
						<div class="reportContent" id="#content"></div><br>

						<div align="right"><a class="close" href="javascript:void(0)">Schließen</a></div>
					</div>
				</div>`);


        // make full rows clickable in tables
        $(document).on("click", 'td:not(:first-child)', function() {
           var href = $('b a', $(this).parent()).attr('href');
           if(href)
           {
               $('.reportContent').load(href + ' #content', function() {
                   modifyLog();
                   modifyLayout();
                   $('#showInputsLink').hide();
                   $('.modal').show();
                   $('.reportContent').scrollTop(0);
                   $('.reportcontent .memberWrapper:last').hide();
               });
           }
        });

        window.onclick = function(event) {
            if (event.target.className == "modal") {
                $('.modal').hide();
            }
        }

        $('.close').on("click", function() {
			    closeModal();
        });
    }

    function closeModal()
    {
        $('.modal').hide();
    }

    // function to modify the navigation
    function modifyNavigation()
    {
        if($('#navi').length) {
            $("a:contains('Topliste')").remove();
            $("a:contains('Hilfe')").remove();
            $("#navi a:contains('Logout')").remove();

            if(requestReportLinkUser == $('div:contains("Du bist eingeloggt als:")').last().children().first().html())
                $('#navi').html('<a href="ac_getcase.pl?d=knuddels.de">Meldung beantragen</a> | ' + $('#navi').html().replace(' |    |   ', ' | ').replace(' |  | ', ' | ').replace('Suche</a> | ', 'Suche</a>'));
            else
                $('#navi').html($('#navi').html().replace(' |    |   ', ' | ').replace(' |  | ', ' | ').replace('Suche</a> | ', 'Suche</a>'));
        }
    }

    // function to modify logging area
    function modifyLog()
    {
        var $reportingUsers = $("h3 div span").filter(function () { return $(this).css('color') === 'rgb(0, 102, 0)'; });

        $('.log').each(function (index){
            var $logDiv = $(this);

            var reportingUser = $($reportingUsers.get(index)).text();

            $('div.content-type-section:first > p', $logDiv).each(function (){
                  if($(this).hasClass('hilite')) {
                      return;
                  }
                  else if($('b:first', $(this)).text().includes(reportingUser)) {
                      $(this).addClass('bsf');
                  }
            });

            $(".hilite").css("background-color", "#F3E2A9");
            $(".bsf").css("background-color", "#CEF6CE");
        });

        $("h3:contains('Gemeldete Inhalte')").each(function(i){
        //$(this).find('a').remove();
            $(this).next().html('<div style="width:100%;font-size:12px; text-align: right;"><input class="dataFilter"  id="' + i +'" type="checkbox" /> Unbeteiligte Filtern</div>' + $(this).next().html());
        });

       $('.dataFilter').on("click", function() {
          filterLog($(this).attr('id'));
       });
    }


    //  function to filter available actions
    function filterActions()
    {
       var reportType = $("h3:contains('Typ:')").children().last().text().replace($("h3:contains('Typ:')").children().last().children().first().text(), '');

       removeSanction('sanction_contactfilterchange');

       if(reportType.trim() != "Spielverhalten melden")
         removeSanction('sanction_gamelock');

       if(reportType.trim() != "Fotokommentar melden")
         removeSanction('sanction_commentdelete');

       if(reportType.trim() != "Suizid-/Amokankündigung melden")
         removeSanction('sanction_emergency');

       if(reportType.trim() != "Alter / Geschlecht melden")
         removeSanction('sanction_profilecontentchange');

       switch(reportType.trim())
       {
           case "Jugendgefährdende Aussage melden":
           case "Sexuelle Belästigung melden":
           case "Extremistische Aussage melden":
           case "Aussage melden":
               removeSanctionGroup("MYCHANNEL");
               removeSanctionGroup("SPIELE");
               removeSanctionGroup("PROFIL");

               removeSanction('sanction_commentdelete');

               removeMyChannelActions();
               removeFotoActions();
               break;
           case "Alter / Geschlecht melden":
               removeSanctionGroup("MYCHANNEL");
               removeSanctionGroup("SPIELE");

               removeSanction('sanction_mute');
               removeSanction('sanction_reprimand');
               removeSanction('sanction_temporarylock');
               removeSanction('sanction_kick');
               removeSanction('sanction_commentdelete');

               removeCMActions();
               removeFotoActions();
               removeMyChannelActions();
               break;
           case "Suizid-/Amokankündigung melden":
               removeSanctionGroup("MYCHANNEL");
               removeSanctionGroup("SPIELE");
               removeSanctionGroup("PROFIL");

               removeSanction('sanction_reprimand');
               removeSanction('sanction_ban');
               removeSanction('sanction_kick');
               removeSanction('sanction_profilecontentdelete');
               removeSanction('sanction_commentdelete');

               removeCMActions();
               removeFotoActions();
               removeMyChannelActions();
               break;
           case "Spielverhalten melden":
               removeSanctionGroup("ADMIN");
               removeSanctionGroup("PROFIL");
               removeSanctionGroup("MYCHANNEL");

               removeSanction('sanction_mute');
               removeSanction('sanction_temporarylock');
               removeSanction('sanction_permanentlock');
               removeSanction('sanction_ban');
               removeSanction('sanction_kick');
               removeSanction('sanction_profilecontentdelete');
               removeSanction('sanction_commentdelete');

               removeCMActions();
               removeFotoActions();
               removeMyChannelActions();
               break;
           case "Profilbilder melden (Fotomeet)":
           case "Profilbilder melden":
               removeSanctionGroup("MYCHANNEL");
               removeSanctionGroup("SPIELE");

                removeSanction('sanction_kick');
                removeSanction('sanction_profilecontentdelete');
                removeSanction('sanction_mute');
                removeSanction('sanction_commentdelete');

                removeCMActions();
                removeMyChannelActions();
               break;
           case "Profilinhalt oder Nickname melden":
                removeSanctionGroup("MYCHANNEL");
                removeSanctionGroup("SPIELE");

                removeSanction('sanction_kick');
                removeSanction('sanction_mute');
                removeSanction('sanction_commentdelete');

                removeCMActions();
                removeFotoActions();
                removeMyChannelActions();
               break;
           case "Fotokommentar melden":
                removeSanctionGroup("MYCHANNEL");
                removeSanctionGroup("SPIELE");

                removeSanction('sanction_mute');
                removeSanction('sanction_ban');
                removeSanction('sanction_kick');
                removeSanction('sanction_profilecontentdelete');
                removeSanction('sanction_gamelock');

                removeCMActions();
                removeFotoActions();
                removeMyChannelActions();
               break;
           case "MyChannel / Globale App melden":
               break;
       }

       //$('#sanction_alreadydone').parent().html($('#sanction_alreadydone').parent().html().replaceAll('<br>', ''));
    }

    function removeCMActions()
    {
      removeSanction('sanction_cmute');
      removeSanction('sanction_fmute');
      removeSanction('sanction_channellock');
    }

    function removeFotoActions()
    {
      removeSanction('sanction_photomove');
      removeSanction('sanction_photodelete');
      removeSanction('sanction_photoblocktemp');
      removeSanction('sanction_photoblockpermanent');
      removeSanction('sanction_photohide');
    }

    function removeMyChannelActions()
    {
      removeSanction('sanction_channelremovebg');
      removeSanction('sanction_channellocktemporary');
      removeSanction('sanction_channellockandremove');
      removeSanction('sanction_channelremove');
      removeSanction('sanction_channelinvisible');
      removeSanction('sanction_channelpubliclock');
      removeSanction('sanction_channelcreationlock');
      removeSanction('sanction_contactappauthor');
    }

    function removeSanction(sanction)
    {
       $('#' +sanction + ',label[for="' + sanction +'"]').hide();
       $('#' +sanction).prev('br').hide();
    }

    function removeSanctionGroup(sanctionGroup)
    {
      $('span:contains("'+ sanctionGroup +'")').hide();
      $('span:contains("'+ sanctionGroup +'")').prev('br').hide();
    }

    function filterLog(index)
    {
        var $logDiv = $('#log' + index);

        $('div.content-type-section:first > p', $logDiv).toggle();
        $('div.content-type-section:first > p.hilite', $logDiv).show();
        $('div.content-type-section:first > p.bsf', $logDiv).show();
    }

    function autoRefresh()
    {
      if(/ac_overview.pl/.test(window.location.href))
      {
         setTimeout(function (){
          $('#content').load(window.location.href + ' #content', function() {
            modifyLayout();
            $('input[value="Aktualisieren"]').parent().after('<div><b>Letzte Aktualisierung:</b> ' + new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE') + '</div>');
         });


         autoRefresh();
         console.log('Refreshed content table');
       }, 5000);
      }
    }

    function setReportQuota()
    {
        if(/ac_judgestatistic.pl/.test(window.location.href))
        {
            var assignedReports = parseFloat($('td[class="Q"]:first-child').text().replace('.', ''));
            var processedReports = parseFloat($('span[style="color:#0A0"]:last-child').text().replace('.', ''));

            $('td[class="Q"]:first-child').next().next().html('<span style="color: #FE9A2E"><b>' + $('td[class="Q"]:first-child').next().next().html() + '</b></span>');

            $('span[style="color:#0A0"]:last-child').parent().css('width', '115px');

            if(assignedReports == 0)
                assignedReports = 1;

            var quota = Math.round(processedReports * 100);
            quota = Math.round(parseFloat(quota / assignedReports));

            if(processedReports == 0)
                quota = 0;

            var color = '';
            if(quota < 85 && assignedReports > 0)
                color = '#f00';
            else if(quota < 100 && assignedReports > 0)
                color = '#74DF00'
            else
                color = '#0A0'

            var quotaText = ' - <span style="color: ' + color + '">[<b>' + quota + '%</b>]</span>';

           $('span[style="color:#0A0"]:last-child').html('<b>' + $('span[style="color:#0A0"]:last-child').text() + '</b>' + quotaText);
        }
    }

    // copy macro to clipboard and set actions
    function copyMacroCommand(id)
    {
       var reportedUser = $($("h3 div span").filter(function () { return $(this).css('color') === 'rgb(153, 0, 0)'; }).get(0)).text();
       resetCommandInputs();
       let command = "";
       switch(id)
       {
           case "botCommand":
               command = '/macro bot:' + reportedUser + '|' + reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);
               $('#filterrelevant').prop("checked", true);

               $('textarea[id="comment"]').text('Botnick, entsprechend gesperrt.');
               break;
           case "scammerCommand":
               command = '/macro scammer:' + reportedUser + '|' + reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);
               $('#filterrelevant').prop("checked", true);

               $('textarea[id="comment"]').text('Inhalte weisen deutlich auf einen Scammer hin. Entsprechend gesperrt.');
               break;
           case "ftCommand":
               command = '/macro ft:' + reportedUser + '|' + reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_photodelete').prop("checked", true);
               $('#sanction_photoblocktemp').prop("checked", true);

               $('textarea[id="comment"]').text('[Bildbeschreibung]\r\n\r\nAls pornographisch / freizügig entfernt, 7 Tage ULS und permanent gesperrt.');
               break;
           case "scamCommand":
               command = '/macro scam:' + reportedUser + '|' + reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_photohide').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);

               $('textarea[id="comment"]').text('Scamfunde: [Scamlink]\r\n\r\nPermanent gesperrt und als Fakeversuch ausgeblendet.');
               break;
           case "tyCommand":
               command = '/macro ty:' + reportedUser + '|' + reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);
               $('input[name="underage"]').prop("checked", true);

                $('textarea[id="comment"]').text('Gemeldete Person ist nach eigener Angabe jünger als 16. Entsprechend als zu jung gesperrt.');
               break;
           case "vslCommand":
               command = '/macro verifylock:' + reportedUser + '|Berechtigte Zweifel an den Angaben - NW erforderlich|' + reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);

                $('textarea[id="comment"]').text('Berechtigte Zweifel an den Angaben.\r\n\r\n[Begründung]');
               break;
           case "nagbCommand":
               command = '/macro nagb:' + reportedUser + '|' + reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#filterrelevant').prop("checked", true);

               $('textarea[id="comment"]').text('Nickname ist AGB widrig. Daher permanent gesperrt\r\n\r\n[Begründung]');
               break;
            case "fakeCommand":
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);

               $('textarea[id="comment"]').text('Als Fake gesperrt.\r\n\r\n[Begründung]');
              break;
            case "vknCommand":
               command = '/macro vkn:' + reportedUser + '|' + reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);

               $('textarea[id="comment"]').text('');
              break;
       }

       if(command)
         navigator.clipboard.writeText(command);
    }

    function resetCommandInputs()
    {
        $('input[name="underage"]').prop("checked", false);
        $('input[type="checkbox"]').each(function (){
            if($(this).attr('id') && $(this).attr('id').startsWith('sanction'))
               $(this).prop('checked', false);
        });
    }

    function hideCommandsByReportType()
    {
      var reportType = $("h3:contains('Typ:')").children().last().text().replace($("h3:contains('Typ:')").children().last().children().first().text(), '');

      if(!reportType.trim().startsWith("Alter"))
        $('#verifyCommands').hide();
      else
      {
        $('#commonCommands').hide();
        $('#warningTexts').hide();
      }

      if(!reportType.trim().startsWith("Profilbilder"))
        $('#profileCommands').hide();


      if(reportType.trim().startsWith("Profil"))
        $('#commonTexts').hide();
      else
      {
        $('#profileContents').hide();
        $('#profilePictures').hide();
      }

      if(reportType.trim().startsWith("Profilbilder"))
        $('#profileContents').hide();


      if(reportType.trim().startsWith("Profilinhalt"))
        $('#profilePictures').hide();
    }

    function showWarningOverlay(id)
    {
      switch(id)
      {
        case "profileContents":
              showWarnings(profileContentWarnTexts, "Profilinhalt");
          break;
        case "commonTexts":
              showWarnings(commonWarnTexts, "Allgemein");
          break;
        case "profilePictures":
              showWarnings(profilePictureWarnTexts, "Profilbilder");
          break;
      }
    }

    function showWarnings(warnings, type)
    {
      $('.reportContent').html('');

      $('.reportContent').append("<center><h2>Verwarntexte - " + type + "<h2></center>");

      for(var i = 0; i < warnings.length; i++)
      {
        $('.reportContent').append("<details><summary>" + warnings[i].title + "</summary><textarea style='width: 100%; height: 50px;'>" + warnings[i].text + "</textarea><input class='modern-button copyWarn' id='"+ warnings[i].title + "' name='" + type + "' style='width: 100%' type='button' value='Kopieren' /></details><br>");
      }

      $('.modal-content').css('height', '400px');
      $('.reportcontent').css('height', '370px');


      $('.copyWarn').on("click", function() {
        var id= $(this).attr('id');
        var name = $(this).attr('name');

        var warnArray;

        switch(name)
        {
          case "Allgemein":
            warnArray = commonWarnTexts;
            break;
          case "Profilinhalt":
            warnArray = profileContentWarnTexts;
            break;
          case "Profilbilder":
            warnArray = profilePictureWarnTexts;
            break;
        }

        var command = "/m " + $reportedUser + ":Verwarnung§";

        warnArray.forEach((item) => {
          if(item.title == id)
          {
            command = command + item.text;

            $('textarea[id="comment"]').text(item.comment);
          }
        });

        if(command)
        {
          navigator.clipboard.writeText(command);
          closeModal();
          $('#sanction_reprimand').prop("checked", true);
          $('select[name="judgement"] option[value="1"]').prop("selected", true);
        }
      })

      $('.modal').show();
    }

    // function to modify the layout
    function modifyLayout()
    {
        setStyle();

        $('img[alt="Foto"]').css('width', '300px');

        // append macros
        if($('#judgementInputsDiv'))
        {
          $('#judgementInputsDiv').before(`
               <div style="width:170px; float:left;"><b>Makros:</b></div>
               <div style="width:430px; float:left;">
                   <div id="commonCommands">
                    <span id="botCommand" class="modern-button copyMacro">Bot</span>
                    <span id="scammerCommand" class="modern-button copyMacro">Scammer</span>
                    <span id="nagbCommand" class="modern-button copyMacro">NAGB</span>
                    <span id="vknCommand" class="modern-button copyMacro">VKN</span><br><br>
                   </div>
                   <div id="profileCommands">
                    <span id="ftCommand" class="modern-button copyMacro">FT</span>
                    <span id="scamCommand" class="modern-button copyMacro">Scam</span><br><br>
                   </div>
                   <div id="verifyCommands">
                      <span id="tyCommand" class="modern-button copyMacro">TY</span>
                      <span id="vslCommand" class="modern-button copyMacro">VSL</span>
                      <span id="fakeCommand" class="modern-button copyMacro">FAKE</span><br><br>
                   </div>
                    <div id="warningTexts">
                      <span id="profileContents" class="modern-button warningTexts">Verwarnung</span>
                      <span id="profilePictures" class="modern-button warningTexts">Verwarnung</span>
                      <span id="commonTexts" class="modern-button warningTexts">Verwarnung</span><br><br>
                   </div>
               </div>
               <div style="clear:both;float:none;font-size:6px;height:6px">&nbsp;</div>
          `);
        }

        hideCommandsByReportType();

       $('.copyMacro').on("click", function() {
          var id = $(this).attr('id');
          copyMacroCommand(id);
       });

      $('.warningTexts').on("click", function() {
        var id= $(this).attr('id');
        showWarningOverlay(id);
      })

        $("b:contains('Meldungen bisher:')").parent().before('<div style="clear: both;">');
        $("b:contains('Meldungen bisher:')").parent().next().after('</div>');
        $('#main div:contains("Du bist eingeloggt")').addClass('loginDetail');

        if(!$( ".logoutLink" ).length)
            $('.loginDetail').html($('.loginDetail').html()?.replace('<br><br>', '<br>') + '<a href="ac_logout.pl" class="logoutLink">Logout</a><br><br><select id="styleSelect" name="style"><option value="Light">Light</option><option value="Dark">Dark</option></select>');

        currentStyle = localStorage.getItem("reportStyle") ?? "Light";

        $('#styleSelect').val(currentStyle);
        setCurrentStyle();

        $('#styleSelect').change(function() {
            currentStyle = $(this).val();
            setCurrentStyle();
        });

        $('button,input[type="submit"]').addClass('modern-button');

        $("div:contains('Kontaktfilter:')").last().html('<b>' + $("div:contains('Kontaktfilter:')").last().html() + '</b>');

        $("div:contains('Bereich voll anzeigen')").last().css('width', '100%');

        $('div b:contains("KOMMENTAR:")').parent().addClass('commentOutput');

        var reportInfo = $('h1:contains("Knuddels.de - Meldesystem - Meldung ")')?.text().replace('Knuddels.de - Meldesystem - Meldung ', '');
        if(reportInfo)
             $('#header').html('<br>Knuddels - Meldesystem<div id="reportInfo">Meldung: ' + reportInfo + '</div>');
        else
             $('#header').html('<br>Knuddels - Meldesystem');

        /*$('#culprit0subcase' + reportID.replace("*", "").replaceAll(".", "") + 'AddInfo').css('max-width', '750px');
        $('#culprit0subcase' + reportID.replace("*", "").replaceAll(".", "") + 'AddInfo').children().each(function() {
           $(this).css('max-width', '750px');
        });

        $('#accuser0AddInfo').css('max-width', '800px');
        $('#accuser0AddInfo').children().each(function() {
           $(this).css('max-width', '800px');
        });*/

        var cnt = 0;

        $('hr').each(function () {
           $(this).nextUntil('hr').wrapAll('<div class="memberWrapper"></div>');
        });

        if(/ac_start.pl/.test(window.location.href))
            $('b:contains("Deine letzten Meldungen:")').prev().nextUntil('hr').wrapAll('<div class="memberWrapper"></div>');


        $('hr:not(:first)').replaceWith('<br>');
        $('hr:first').replaceWith('');

        if(/ac_login.pl/.test(window.location.href))
        {
            $('input[type="submit"]').parent().css('width', '100%');
        }

        $('.caseInfo2').eq(1).remove();


        $('h3:contains("Hinweis")').parent().addClass('memberWrapper');
        $('h3:contains("Hinweis")').parent().css('margin-top', '30px');
        $('div:contains("Momentan ist keine Meldung für dich vorhanden.")').last().addClass('infoMessage');

        $('form[action="ac_login.pl"] div:first')?.addClass('loginForm');

        if(/ac_search.pl/.test(window.location.href))
        {
            $('.memberWrapper:not(.reportContent .memberWrapper, .form)').css('width', '80vw');
            $('.memberWrapper:not(.reportContent .memberWrapper, .form)').css('margin-left', 'calc(50% - 40vw)');
            $('.memberWrapper:not(.reportContent .memberWrapper, .form)').css('margin-right', 'calc(50% - 40vw)');

            if(!$('form[action="ac_search.pl"]').parent().hasClass('memberWrapper'))
            {
                $('form[action="ac_search.pl"]').wrapAll('<div class="memberWrapper form"></div>');
                $('form[action="ac_search.pl"]').css('margin', 'auto');
                $('form[action="ac_search.pl"]').css('width', '600px');
                $('.form').after('<br>');
            }
        }


        if(/ac_judgestatistic.pl/.test(window.location.href))
        {
            $('form[action="ac_judgestatistic.pl"]').wrapAll('<div class="memberWrapper form"></div>');
            $('form[action="ac_judgestatistic.pl"]').css('margin', 'auto');
            $('form[action="ac_judgestatistic.pl"]').css('width', '600px');
            $('.memberWrapper:first').after('<br>');
        }

        if(!$('h3:first').hasClass('title'))
        {
            $('h3:first')?.addClass('title');

            $('.form')?.prepend($('.title'));
            $('.form')?.before('<br className="titleBreak">');
        }

      $('.sanction-option').first().parent().css('overflow-x', 'hidden');
      $('.sanction-option').css('max-width', '450px');

      setReportLinks();
      addTextFilter();
    }

    function addTextFilter()
    {
      if(/ac_viewcase.pl/.test(window.location.href))
      {
        $('b:contains("Admincomments")').each(function() {
          var entryID = $(this).parent().attr("id");
          $(this).html("<u>" + $(this).html() + "</u><br><br><label for='filter" + entryID + "'>Filtern:</label>&nbsp;&nbsp;<input class='aifilter' id='filter" + entryID + "' type='text' style='width: 435px' /><br>");

          $('#' + entryID).children('div').attr("id", "filter" + entryID);
        });

        // react on input
        $(document).on("input", '.aifilter', function(e) {
          var currentID = e.target.id;
          // filter log
          $('div > #' + currentID).each(function() {         //
            if($(this).text().toLowerCase().includes(e.target.value.toLowerCase()))
              $(this).css('display', 'block');
            else
              $(this).css('display', 'none');
          });
        });
      }
    }

    function setReportLinks()
    {
      if(/ac_viewcase.pl/.test(window.location.href))
      {
        let regex = XRegExp('[\*]{0,1}\\d{10}|\\d.\\d{3}.\\d{3}.\\d{3}', 'gms');
        var m = null;
        var content = null;
        var current = null;
        $('b:contains("E-Mail")').each(function() {

           $(this).parent().css('max-width', '500px');

           $(this).parent().children('div').each(function() {
             // add line breaks to admin info entry
             $(this).html($(this).html() + "<br><br>");
             // set max with of admin info entry
             $(this).css("max-width", "850px");

             content = $(this).html();

             // replace report id's with links to report
             while((m = regex.exec(content)) !== null)
             {
               $(this).html($(this).html().replaceAll(m[0], '<a target="_blank" href="https://www6.knuddels.de:8443/ac/ac_viewcase.pl?domain=knuddels.de&id=' + m[0].replaceAll("*", "").replaceAll('.', "") + '">' + m[0] + '</a>'));
             }
           });
        });

        // replace report id's with links to report in comments
        $('.commentOutput,.caseinfo2').each(function() {
          content = $(this).html();
          while((m = regex.exec(content)) !== null)
          {
            $(this).html($(this).html().replaceAll(m[0], '<a target="_blank" href="https://www6.knuddels.de:8443/ac/ac_viewcase.pl?domain=knuddels.de&id=' + m[0].replaceAll("*", "").replaceAll('.', "") + '">' + m[0] + '</a>'));
          }
        });
      }
    }

    function setCurrentStyle()
    {
      switch(currentStyle)
      {
        case "Light":
          $('html,#main,.modal-content').css('background-color', 'white');
          $('html').css('filter', 'invert(0%) hue-rotate(0deg)');
          $('#header,#navi,.modern-button,.loginDetail,img').css('filter', 'invert(0%) hue-rotate(0deg)');
          break;
        case "Dark":
          $('html,#main,.modal-content').css('background-color', 'lightgray');
          $('html').css('filter', 'invert(100%) hue-rotate(180deg)');
          $('#header,#navi,.modern-button,.loginDetail,img').css('filter', 'invert(180%) hue-rotate(180deg)');
          break;
      }

      localStorage.setItem("reportStyle", currentStyle);
    }


    function setStyle()
    {
    // execute update stylesheet
        var style = `
      html { background-color: white; }
			.caseinfo2 {
			   background-color: #F7F8E0 !important;
               margin-left: -5px;
			}

      .logoutLink {
         text-decoration: none;
      }

      .loginForm {
          background-color: #FFF !important;
          border: 1px solid #E6E6E6 !important;
          border-radius: 5px;
          padding-left: 10px;
      }

      .memberWrapper {
        border: 1px solid #E6E6E6 !important;
        padding: 10px;
        border: #838B8B solid 1px;
        border-radius: 5px;
      }

      .memberWrapper:hover, .loginForm:hover {
        border: 1px solid rgb(175, 142, 232) !important;

        h3 {
          color: rgb(175, 142, 232);
        }
      }

      hr { width: 1020px; }

      .log {
         overflow-x: hidden !important;
      }

      .infoMessage {
         background-color: #FFF !important;
         border: none !important;
         width: 500px !important;
      }


			.log, .content-type-section {
			  background-color: white !important;
			  gap: .4em !important;
			}

			.content-type-section p {
			   padding: 0;
			   margin: 0;
               width: 980;
               padding-left: 2px;
               padding-right: 5px;
			}

			.reportContent .content-type-section p {
			   padding: 0;
			   margin: 0;
               width: 730;
               padding-left: 2px;
               padding-right: 5px;
			}

			.content-type-section h4 {
			 background-color: #F7F8E0 !important;
			}

			#footer
			{
				padding:15px;
				padding-left:0;
				padding-right:0;
				padding-top:20px;
				color:#000;
				font-size:11px;
				margin-top:300px;
				text-align:right;
			}

            #reportInfo {
               font-size: 15px;
               padding-top: 10px;
            }

            #header {
              background-color: rgb(175, 142, 232) !important;
              font-size: 30;
              font-weight: bold;
              width: 100%;
              height: 245px;
              margin: 0;
              color: white;
              background-image: url(https://downloads.intercomcdn.com/i/o/136996/6168a787b21e8dc7b10e5890/84e2c36c11248b70818860686b4bb116.jpg);
              background-repeat: no-repeat;
              background-position: center;
              background-size: cover;
              text-align: center;
            }

            #main {
              background-color: white;
              padding: 0px;
              margin: 0px;
              font-size: 14px;
              align: center;
            }

            #main div:not(#header):not(#navi):not(.caseInfo2):not(.commentOutput):not(.log) {
              width: 1000px;
              margin: auto;
            }

            .commentOutput {
              width: 800px;
              //max-width: 700px;
            }

            .reportContent .commentOutput {
               width: 600px;
            }

            #navi {
              position: absolute;
              top: 180px;
              left: 0;
              width: 100%;
              text-align: center;
              color: rgb(175, 142, 232);
              font-size: 20px;
              font-weight: bold;
            }


            #navi a {
              color: white;
              font-size: 20px;
              font-weight: bold;
              padding-left: 10px;
              padding-right: 10px;
              text-decoration: none;
            }

            #navi a:hover {
              color: rgb(175, 142, 232);
            }

            a {
              color: rgb(175, 142, 232);
              font-weight: bold;
            }

            a:hover {
              color: #FF0000;
            }

            .loginDetail {
              color: white;
              font-size: 15px;
              position: absolute;
              top: 10px;
              right: 20px;
             // max-width: 250px;
            }

            .content-type-section
            {
               background-color: #F0F0F0;
            }

            .content-type-section p
            {
               padding-top: 0;
               padding-bottom: 0;
               margin: 0;
            }


            body
            {
              margin: 0;
              padding: 0;
              font-family: 'Dosis', sans-serif;
              overflow-x: hidden;
            }

			table
			{
				font-size:14px;
				border-collapse:collapse;
				margin-top:1em;
				margin-bottom:1em;
				margin-left:auto;
				margin-right:auto,
			}

            table td:first-child {
                text-align: left;
                width: 100px;
                padding-left: 5px;
                padding-right: 10px;
            }


            tr:nth-child(odd):not(:first-child)
			{
			    background:#eee
			}

            td:not(:first-child) {
               padding-top: 5px;
               padding-bottom: 5px;
            }

           // td:last-child { width: 0px; }

            td:nth-child(3) {
               max-width: 300px;
            }

            td a {
               color: #FF0000;
               text-decoration: none;
            }

            td {
              vertical-align: top;
              max-width: 200px;
            }

            th
			{
			    background-color: rgba(175, 142, 232, 0.5);
			    font-weight:bold;
			    padding:5px
			}

            th:nth-child(even)
            {
                background-color: rgba(175, 142, 232, 0.6);
            }

            tr:not(:first-child):hover {
                background-color: rgba(175, 142, 232, 0.3);
            }

            .modern-button {
               background-color: rgba(175, 142, 232, 1);
               border: 1px solid transparent;
               border-radius: 3px;
               box-shadow: rgba(255, 255, 255, .4) 0 1px 0 0 inset;
               box-sizing: border-box;
               color: #FFF;
               cursor: pointer;
               font-family: 'Dosis', sans-serif;
               font-size: 14px;
               font-weight: bold;
               line-height: 1.15385;
               outline: none;
               padding: 4px .4em;
               position: relative;
               text-align: center;
               text-decoration: none;
               user-select: none;
               -webkit-user-select: none;
               touch-action: manipulation;
               vertical-align: baseline;
               white-space: nowrap;
            }

            .modern-button:hover,
            .modern-button:focus {
                 background-color: rgba(175, 142, 232, 0.7);
            }

            .modern-button:focus {
              box-shadow: 0 0 0 4px rgba(175, 142, 232, .15);
            }

            .modern-button:active {
              background-color: rgba(175, 142, 232, 0.3);
              box-shadow: none;
            }

            .modal {
              font-size: 13px;
              display: none; /* Hidden by default */
              position: fixed; /* Stay in place */
              z-index: 1; /* Sit on top */
              padding-top: 100px; /* Location of the box */
              left: 0;
              top: 0;
              width: 100%; /* Full width */
              height: 100%; /* Full height */
              overflow: hidden !important; /* Enable scroll if needed */
              background-color: rgb(0,0,0); /* Fallback color */
              background-color: rgba(0,0,0,0.7); /* Black w/ opacity */
            }

            .modalWarnings {
              font-size: 13px;
              display: none;
              position: fixed;
              z-index: 1;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              overflow: hidden !important;
              background-color: rgb(0,0,0); /* Fallback color */
              background-color: rgba(0,0,0,0.7); /* Black w/ opacity */
            }

            /* Modal Content */
            .modal-content {
              background-color: white;
              margin: auto;
              padding: 20px;
              border: 1px solid #888;
              width: 800px;
              height: 700px;
              border-radius: 10px;
            }

            .reportContent {
              height: 100px;
              height: 650px;
              overflow-x: hidden;
            }

            details {
              font-size: 15px;
            }

            a > .close {
              color: #aaaaaa;
              float: right;
              font-size: 28px;
              font-weight: bold;
              font-family: 'Dosis', sans-serif;
            }

            .close:hover,
            .close:focus {
              color: #000;
              text-decoration: none;
              cursor: pointer;
            }

        `;

        $('style').text(style);
    }
})();
