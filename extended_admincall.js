// ==UserScript==
// @name         Extended Admincall
// @namespace    http://ps.addins.net/
// @version      2.7.9
// @author       riesaboy
// @match        https://*.knuddels.de:8443/ac/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// @require https://code.jquery.com/jquery-3.3.1.min.js
// @require https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require https://cdnjs.cloudflare.com/ajax/libs/xregexp/3.2.0/xregexp-all.min.js
// @downloadURL https://raw.githubusercontent.com/inflames2k/Scripts/refs/heads/main/extended_admincall.js
// ==/UserScript==

class WarnText
{
  constructor(title, text, comment)
  {
    this.title = title;
    this.text = text;
    this.comment = comment;
    this.id = WarnText.uuidv4();
  }

  static uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
       (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
  }
}

class WarnTextCollection
{
  constructor(commonWarns, profileContentWarns, profilePictureWarns)
  {
    this.commonWarns = commonWarns;
    this.profileContentWarns = profileContentWarns;
    this.profilePictureWarns = profilePictureWarns;
  }

  save()
  {
     localStorage.setItem('warnTexts', JSON.stringify(this));
  }

  static load()
  {
    var result = JSON.parse(localStorage.getItem('warnTexts'));

    if(result != null)
      return new WarnTextCollection(result.commonWarns ?? [], result.profileContentWarns ?? [], result.profilePictureWarns ?? []);
    else
      return new WarnTextCollection([], [], []);
  }
}

class Settings
{
   constructor()
   {
   }

   load()
   {
     this.enableReportRequestlink = localStorage.getItem("newReportLink") ?? "aus";
     this.currentStyle = localStorage.getItem("reportStyle") ?? "Light";
     this.overViewRefreshInterval = localStorage.getItem("refreshInterval") ?? 5000;
     this.warnTextCollection = WarnTextCollection.load();
   }

   save()
   {
     localStorage.setItem("newReportLink", this.enableReportRequestlink);
     localStorage.setItem("reportStyle", this.currentStyle);
     localStorage.setItem("refreshInterval", this.overViewRefreshInterval);
     this.warnTextCollection.save();
   }
}

class BaseVariables
{
  constructor()
  {
    this.settings = new Settings();
    this.settings.load();

    this.reportID = $('h1:contains("Knuddels.de - Meldesystem")').text().replace('Knuddels.de - Meldesystem - Meldung ', '').split(' ')[0];
    this.reportedUser = $($("h3 div span").filter(function () { return $(this).css('color') === 'rgb(153, 0, 0)'; }).get(0)).text();
    this.changeLogUri = 'https://raw.githubusercontent.com/inflames2k/Scripts/refs/heads/main/changelog.html';
    this.reportType = $("h3:contains('Typ:')").children().last().text().replace($("h3:contains('Typ:')").children().last().children().first().text(), '');

  }
}


(function() {
    'use strict';

     var baseVariables = new BaseVariables();

     function bootStrap()
     {
        $('meta[http-equiv="Content-type]"').remove();
        $('head').append('<meta charset="Unicode" />');
        autoRefresh();
        addOverlay();
        addConfigshow();
        modifyNavigation();
        modifyLayout();
        $('#footer').html($('#footer').html() + " - " + GM_info.script.name + " " + GM_info.script.version);

        $('#styleSelect').val(baseVariables.settings.currentStyle);
        setCurrentStyle();

        $('#reportLinkSelect').val(baseVariables.settings.enableReportRequestlink);
        showReportLink();

        $('#refreshInterval').val(baseVariables.settings.overViewRefreshInterval / 1000);

        modifyLog();
        filterActions();
        setReportQuota();
     }

    function showChangeLog()
    {
       $('.reportContent').html('');

       $('.reportContent').append("📋 <div class='changelog'></div>");

       $('.changelog').load(baseVariables.changeLogUri + ' #content', function() {
       });

       $('.modal-content').css('height', '400px');
       $('.reportcontent').css('height', '370px');

       $('.modal').show();
    }

    function addConfigshow()
    {
       $('#content').parent().parent().html($('#content').parent().parent().html() + `
        <div class="config">
					<div class="config-content">
						<div class="configContent" style="max-width: 800px;">⚙️
              <center><h2>Einstellungen verwalten</h2></center>
              <ul id="tabs" style="max-width: 800px">
                <li>
                  <input type="radio" id="tab-1" name="tabControl" checked />
                  <label for="tab-1">Allgemein</label>
                  <section>
                    <div class="memberWrapper" id="commonSettings">
                      <h3>⚙️ Allgemeine Einstellungen</h3>
                      <table style="width: 100%">
                      <tr></tr>
                      <tr>
                        <td style="width: 0px"></td>
                        <td>🕔 Aktualisierung Übersicht:</td>
                        <td><input type="number" step="1" id="refreshInterval" required style="width: 100px"><br><br><span style="font-size: 12px; padding-top: 5px">Legt das Aktualisierungsinterval (s) für die Übersicht fest (Min: 5 Sekunden, Max: 360 Sekunden).</span></td>
                      </tr>
                      <tr>
                        <td style="width: 0px"></td>
                        <td style="width: 200px">🔆 Darstellungsmodus:</td>
                        <td><select id="styleSelect" name="style" style="width: 100px"><option value="Light">Light</option><option value="Dark">Dark</option></select><br><br><span style="font-size: 12px; padding-top: 10px">Schaltet den Anzeigemodus zwischen Light und Dark um.</span><br><br></td>
                      </tr>
                      <tr>
                        <td style="width: 0px"></td>
                        <td>🔗 Link "Meldung beantragen":</td>
                        <td><select id="reportLinkSelect" name="reportLink" style="width: 100px"><option value="an">An</option><option value="aus">Aus</option></select><br><br><span style="font-size: 12px; padding-top: 5px">Aktiviert den Link "Meldung beantragen" im Menü des Meldesystems.</span></td>
                      </tr>
                      </table>
                    </div>
                  </section>
                </li>
                <li>
                  <input type="radio" id="tab-2" name="tabControl" />
                  <label for="tab-2">Verwarntexte</label>
                  <section>
                    <div class="memberWrapper" id="warningSettings" style="margin-top: 10px;">
                       <h3>⚠️ Verwarntexte</h3>

                      <table style="width: 100%">
                        <tr></tr>
                        <tr>
                          <td style="width: 0px"></td>
                          <td style="width: 200px">⬆️ Importieren</td>
                          <td><input type="File" id="warnImport"/><br><br></td>
                        </tr>
                        <tr>
                          <td style="width: 0px"></td>
                          <td>⬇️ Exportieren</td>
                          <td><input type="Button" value="Ausführen" style="width: 114px;" id="warnExport"><br><br></td>
                        </tr>
                        <tr>
                      </table>

                      <center><b>Verwarntexte - Allgemein</b></center><br>
                      <table id="commonWarnDiv" style="width: 100%">
                        <tr>
                          <th style="width: 0px; display: none;"/>
                          <th>Verstoß</th>
                          <th>Verwarntext</th>
                          <th>Kommentar</th>
                          <th></th>
                          <th><a href="#" id="addCommonWarn">➕</a></th>
                        </tr>
                      </table><br>

                      <center><b>Verwarntexte - Profilinhalt</b></center><br>
                      <table id="profileContentWarnDiv" style="width: 100%">
                          <th style="width: 0px; display: none;"/>
                          <th>Verstoß</th>
                          <th>Verwarntext</th>
                          <th>Kommentar</th>
                          <th></th>
                          <th><a href="#" id="addProfileContentWarn">➕</a></th>
                      </table><br>

                      <center><b>Verwarntexte - Profilbilder</b></center><br>
                      <table id="profilePictureWarnDiv" style="width: 100%">
                          <th style="width: 0px; display: none;"/>
                          <th>Verstoß</th>
                          <th>Verwarntext</th>
                          <th>Kommentar</th>
                          <th></th>
                          <th><a href="#" id="addProfilePictureWarn">➕</a></th>
                      </table><br>
                    </div>
                  </section>
                </li>
              </ul>
            </div><br><br>
						<div align="right"><a class="close" href="javascript:void(0)">Schließen</a></div>
					</div>
				</div>`);

        $('#addCommonWarn').on("click", function() {
           var warning = new WarnText("Neuer Verwarntext", "", "");
           baseVariables.settings.warnTextCollection.commonWarns.splice(0, 0, warning);
           // need a way to bind editable
           bindCommonWarns();
           setEditable(warning);
        });

        $('#addProfileContentWarn').on("click", function() {
           var warning = new WarnText("Neuer Verwarntext", "", "");
           baseVariables.settings.warnTextCollection.profileContentWarns.splice(0, 0, warning);
           // need a way to bind editable
           bindProfileContentWarns();
           setEditable(warning);
        });

        $('#addProfilePictureWarn').on("click", function() {
           var warning = new WarnText("Neuer Verwarntext", "", "");
           baseVariables.settings.warnTextCollection.profilePictureWarns.splice(0, 0, warning);
           // need a way to bind editable
           bindProfilePictureWarns();
           setEditable(warning);
        });

        $('#styleSelect').change(function() {
            baseVariables.settings.currentStyle = $(this).val();
            setCurrentStyle();
        });

        $('#reportLinkSelect').change(function() {
           baseVariables.settings.enableReportRequestlink = $(this).val();
           baseVariables.settings.save();

           showReportLink();
        });

        $('#refreshInterval').change(function() {
          var value = $(this).val();

          if(value < 5)
          {
            value = 5;
            $('#refreshInterval').val(value);
          }
          else if(value > 360)
          {
            value = 360;
            $('#refreshInterval').val(value);
          }

          baseVariables.settings.overViewRefreshInterval = value * 1000;
          baseVariables.settings.save();
        });

       // export of warning texts
       $('#warnExport').on("click", function() {
         const link = document.createElement("a");
         const content = JSON.stringify(baseVariables.settings.warnTextCollection, null, 4);
         const file = new Blob([content], { type: 'text/plain' });
         link.href = URL.createObjectURL(file);
         link.download = "warnTexts_" + new Date().toISOString().replaceAll('-', '').replace('T', '_').replace('Z', '') + ".json";
         //link.download = link.download.replaceAll()
         link.click();
         URL.revokeObjectURL(link.href);
       });

       $('.tablinks').on("click", function() {
          openSettings($(this), $(this).id);
       });

       // Import of warning texts
       $('#warnImport').on("change", function() {
          var imp = document.getElementById("warnImport");

          if (imp.files.length == 1)
          {
            var uri = URL.createObjectURL(imp.files[0]);

            fetch(uri)
            .then(res => res.json())
            .then(out => {
              baseVariables.settings.warnTextCollection = new WarnTextCollection(out.commonWarns, out.profileContentWarns, out.profilePictureWarns);
              baseVariables.settings.warnTextCollection.save();

              bindWarns();

              alert("Verwarntexte wurden erfolgreich importiert.");
            })
            .catch(err => console.log(err));
          }
       })

       window.onclick = function(event) {
            if (event.target.className == "config" || event.target.className == 'modal') {
                $('.modal').hide();
            }
        }

        $('.close').on("click", function() {
			    closeModal();
        });
    }

    // set a given warning editable
    function setEditable(warning)
    {
      var index = 0;
      $('#' + warning.id).siblings().each(function() {

        var text = $(this).text();
        if(index >= 0 && index < 3){
          $(this).empty().append('<textarea style="width: 100%; height: 100px;">' + text + '</textarea>');}
        else if(index == 3)
          $(this).empty().append('<a href="#" class="confirmEdit' + warning.id + '">✔️</a>');
        else if(index == 4)
          $(this).empty();
        index++;
      });

      $('.confirmEdit' + warning.id).data('warn', warning);

      $('.confirmEdit' + warning.id).on("click", function() {
         // confirm edit... lets see how and ... bla
        var warn = $(this).data('warn');
        var cur = 0;
        $(this).parent().parent().children().each(function(){
          if(cur == 1)
            warn.title = $(this).children().val();
          else if(cur == 2)
            warn.text = $(this).children().val();
          else if(cur == 3)
            warn.comment = $(this).children().val();

          cur++;
        });

        bindCommonWarns();
        bindProfilePictureWarns();
        bindProfileContentWarns();

        baseVariables.settings.warnTextCollection.save();
      });
    }

    function bindCommonWarns()
    {
      $('#commonWarnDiv tr:not(:first-child)').remove();
      var i = 0;

      for(i = 0; i < baseVariables.settings.warnTextCollection.commonWarns.length; i++)
      {
        $("#commonWarnDiv").append(`
              <tr>
                <td style="width: 0px; display: none;" id="` + baseVariables.settings.warnTextCollection.commonWarns[i].id + `">
                <td>` + baseVariables.settings.warnTextCollection.commonWarns[i].title + `</td>
                <td style="padding-left: 5px; white-space: pre-wrap;">` + baseVariables.settings.warnTextCollection.commonWarns[i].text + `</td>
                <td style="padding-left: 5px; white-space: pre-wrap;">` + baseVariables.settings.warnTextCollection.commonWarns[i].comment + `</td>
                <td><center><a href="#" class="edit` + baseVariables.settings.warnTextCollection.commonWarns[i].id + `">✏️</a></center></td>
                <td><center><a href="#" class="remove` + baseVariables.settings.warnTextCollection.commonWarns[i].id + `">❌</a></center></td>
              </tr>`);

          $('.edit' + baseVariables.settings.warnTextCollection.commonWarns[i].id).data('warn', baseVariables.settings.warnTextCollection.commonWarns[i]);
          $('.remove' + baseVariables.settings.warnTextCollection.commonWarns[i].id).data('warn', baseVariables.settings.warnTextCollection.commonWarns[i]);

          $('.edit' + baseVariables.settings.warnTextCollection.commonWarns[i].id).on("click", function() {
            setEditable($(this).data('warn'));
          });

          $('.remove' + baseVariables.settings.warnTextCollection.commonWarns[i].id).on("click", function() {
            removeWarning(baseVariables.settings.warnTextCollection.commonWarns, $(this).data('warn'));
          });
      }
    }

    function bindProfileContentWarns()
    {
      $('#profileContentWarnDiv tr:not(:first-child)').remove();
      var i = 0;
      for(i = 0; i < baseVariables.settings.warnTextCollection.profileContentWarns.length; i++)
      {
        $("#profileContentWarnDiv").append(`
              <tr>
                <td style="width: 0px; display: none;" id="` + baseVariables.settings.warnTextCollection.profileContentWarns[i].id + `">
                <td>` + baseVariables.settings.warnTextCollection.profileContentWarns[i].title + `</td>
                <td style="padding-left: 5px; white-space: pre-wrap;">` + baseVariables.settings.warnTextCollection.profileContentWarns[i].text + `</td>
                <td style="padding-left: 5px; white-space: pre-wrap;">` + baseVariables.settings.warnTextCollection.profileContentWarns[i].comment + `</td>
                <td><center><a href="#" class="edit` + baseVariables.settings.warnTextCollection.profileContentWarns[i].id + `">✏️</a></center></td>
                <td><center><a href="#" class="remove` + baseVariables.settings.warnTextCollection.profileContentWarns[i].id + `">❌</a></center></td>
              </tr>`);


          $('.edit' + baseVariables.settings.warnTextCollection.profileContentWarns[i].id).data('warn', baseVariables.settings.warnTextCollection.profileContentWarns[i]);
          $('.remove' + baseVariables.settings.warnTextCollection.profileContentWarns[i].id).data('warn', baseVariables.settings.warnTextCollection.profileContentWarns[i]);

          $('.edit' + baseVariables.settings.warnTextCollection.profileContentWarns[i].id).on("click", function() {
            setEditable($(this).data('warn'));
          });

          $('.remove' + baseVariables.settings.warnTextCollection.profileContentWarns[i].id).on("click", function() {
            removeWarning(baseVariables.settings.warnTextCollection.profileContentWarns, $(this).data('warn'));
          });
      }
    }

    function bindProfilePictureWarns()
    {
      $('#profilePictureWarnDiv tr:not(:first-child)').remove();
      var i = 0;
      for(i = 0; i < baseVariables.settings.warnTextCollection.profilePictureWarns.length; i++)
      {
        $("#profilePictureWarnDiv").append(`
              <tr>
                <td style="width: 0px; display: none;" id="` + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id + `">
                <td>` + baseVariables.settings.warnTextCollection.profilePictureWarns[i].title + `</td>
                <td style="padding-left: 5px; white-space: pre-wrap;">` + baseVariables.settings.warnTextCollection.profilePictureWarns[i].text + `</td>
                <td style="padding-left: 5px; white-space: pre-wrap;">` + baseVariables.settings.warnTextCollection.profilePictureWarns[i].comment + `</td>
                <td><center><a href="#" class="edit` + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id + `">✏️</a></center></td>
                <td><center><a href="#" class="remove` + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id + `">❌</a></center></td>
              </tr>`);

          $('.edit' + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id).data('warn', baseVariables.settings.warnTextCollection.profilePictureWarns[i]);
          $('.remove' + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id).data('warn', baseVariables.settings.warnTextCollection.profilePictureWarns[i]);

          $('.edit' + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id).on("click", function() {
            setEditable($(this).data('warn'));
          });

          $('.remove' + baseVariables.settings.warnTextCollection.profilePictureWarns[i].id).on("click", function() {
            removeWarning(baseVariables.settings.warnTextCollection.profilePictureWarns, $(this).data('warn'));
          });
      }
    }

    function bindWarns()
    {
      bindCommonWarns();
      bindProfilePictureWarns();
      bindProfileContentWarns();
    }

    function removeWarning(collection, warning)
    {
      collection.splice(collection.indexOf(warning), 1);
      bindWarns();

      baseVariables.settings.warnTextCollection.save();
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
                   $('.modal-content').css("height", "700px");
                   $('.reportcontent').css("height", "650px");
                   $('.modal').show();
                   $('.reportContent').scrollTop(0);
                   $('.reportcontent .memberWrapper:last').hide();
               });
           }
        });
    }

    function closeModal()
    {
        $('.modal').hide();
        $('.config').hide();
    }

    // function to modify the navigation
    function modifyNavigation()
    {
        if($('#navi').length) {
            $("a:contains('Topliste')").remove();
            $("a:contains('Hilfe')").remove();
            $("#navi a:contains('Logout')").remove();

            $('#navi').html('<span id="reportRequest" style="display: none;"><a href="ac_getcase.pl?d=knuddels.de">Meldung beantragen</a> | </span>' + $('#navi').html().replace(' |    |   ', ' | ').replace(' |  | ', ' | ').replace('Suche</a> | ', 'Suche</a>'));

            //$("#navi").html($("#navi").html().replace("Statistik", "📈 Statistik").replace("Übersicht", "🧮 Übersicht").replace("Meine Meldungen", "🚩 Meine Meldungen").replace("Suche", "🔍 Suche"));
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

            $(this).css("max-height", 'none');

            $('a:contains("Bereich voll anzeigen")').text("Bereich eingrenzen");
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

       if(baseVariables.reportType.trim() != "Spielverhalten melden")
         removeSanction('sanction_gamelock');

       if(baseVariables.reportType.trim() != "Fotokommentar melden")
         removeSanction('sanction_commentdelete');

       if(baseVariables.reportType.trim() != "Suizid-/Amokankündigung melden")
         removeSanction('sanction_emergency');

       if(baseVariables.reportType.trim() != "Alter / Geschlecht melden")
         removeSanction('sanction_profilecontentchange');

       switch(baseVariables.reportType.trim())
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
       }, baseVariables.settings.overViewRefreshInterval);
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
       resetCommandInputs();
       let command = "";

       switch(id)
       {
           case "botCommand":
               command = '/macro bot:' + baseVariables.reportedUser + '|' + baseVariables.reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);

               $('textarea[id="comment"]').text('Botnick, entsprechend gesperrt.');
               break;
           case "scammerCommand":
               command = '/macro scammer:' + baseVariables.reportedUser + '|' + baseVariables.reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);
               $('#filterrelevant').prop("checked", true);

               $('textarea[id="comment"]').text('Inhalte weisen deutlich auf einen Scammer hin. Entsprechend gesperrt.');
               break;
           case "ftCommand":
               command = '/macro ft:' + baseVariables.reportedUser + '|' + baseVariables.reportID;
               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_photodelete').prop("checked", true);
               $('#sanction_photoblocktemp').prop("checked", true);

               $('textarea[id="comment"]').text('[Bildbeschreibung]\r\n\r\nAls pornographisch / freizügig entfernt, 7 Tage ULS und permanent gesperrt.');
               break;
           case "scamCommand":
               command = '/macro scam:' + baseVariables.reportedUser + '|' + baseVariables.reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_photohide').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);

               $('textarea[id="comment"]').text('Scamfunde: [Scamlink]\r\n\r\nPermanent gesperrt und als Fakeversuch ausgeblendet.');
               break;
           case "tyCommand":
               command = '/macro ty:' + baseVariables.reportedUser + '|' + baseVariables.reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);
               $('#sanction_ban').prop("checked", true);
               $('#sanction_profilecontentdelete').prop("checked", true);
               $('input[name="underage"]').prop("checked", true);

                $('textarea[id="comment"]').text('Gemeldete Person ist nach eigener Angabe jünger als 16. Entsprechend als zu jung gesperrt.');
               break;
           case "vslCommand":
               command = '/macro verifylock:' + baseVariables.reportedUser + '|Berechtigte Zweifel an den Angaben - NW erforderlich|' + baseVariables.reportID;

               $('select[name="judgement"] option[value="1"]').prop("selected", true);
               $('#sanction_permanentlock').prop("checked", true);

                $('textarea[id="comment"]').text('Berechtigte Zweifel an den Angaben.\r\n\r\n[Begründung]');
               break;
           case "nagbCommand":
               command = '/macro nagb:' + baseVariables.reportedUser + '|' + baseVariables.reportID;

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
               command = '/macro vkn:' + baseVariables.reportedUser + '|' + baseVariables.reportID;
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

      if(!baseVariables.reportType.trim().startsWith("Alter"))
        $('#verifyCommands').hide();
      else
      {
        $('#commonCommands').hide();
        $('#warningTexts').hide();
      }

      if(!baseVariables.reportType.trim().startsWith("Profilbilder"))
        $('#profileCommands').hide();


      if(baseVariables.reportType.trim().startsWith("Profil"))
        $('#commonTexts').hide();
      else
      {
        $('#profileContents').hide();
        $('#profilePictures').hide();
      }

      if(baseVariables.reportType.trim().startsWith("Profilbilder"))
        $('#profileContents').hide();


      if(baseVariables.reportType.trim().startsWith("Profilinhalt"))
        $('#profilePictures').hide();
    }

    function showWarningOverlay(id)
    {
      switch(id)
      {
        case "profileContents":
              if(!baseVariables.settings.warnTextCollection || !baseVariables.settings.warnTextCollection.profileContentWarns || baseVariables.settings.warnTextCollection.profileContentWarns.length == 0)
              {
                alert("Keine Verwarntexte für Profilinhalte vorhanden. Bitte erstellen oder importieren.");
              }
              else
                showWarnings(baseVariables.settings.warnTextCollection.profileContentWarns, "Profilinhalt");
          break;
        case "commonTexts":
              if(!baseVariables.settings.warnTextCollection || !baseVariables.settings.warnTextCollection.commonWarns || baseVariables.settings.warnTextCollection.commonWarns.length == 0)
              {
                alert("Keine Verwarntexte vorhanden. Bitte erstellen oder importieren.");
              }
              else
                showWarnings(baseVariables.settings.warnTextCollection.commonWarns, "Allgemein");
          break;
        case "profilePictures":
              if(!baseVariables.settings.warnTextCollection || !baseVariables.settings.warnTextCollection.profilePictureWarns || baseVariables.settings.warnTextCollection.profilePictureWarns.length == 0)
              {
                alert("Keine Verwarntexte für Profilbilder vorhanden. Bitte erstellen oder importieren.");
              }
              else
                showWarnings(baseVariables.settings.warnTextCollection.profilePictureWarns, "Profilbilder");
          break;
      }
    }

    function showWarnings(warnings, type)
    {
      $('.reportContent').html('');

      $('.reportContent').append("⚠️ <center><h2>Verwarntexte - " + type + "<h2></center>");

      for(var i = 0; i < warnings.length; i++)
      {
        $('.reportContent').append("<details><summary>" + warnings[i].title + "</summary><textarea style='width: 100%; height: 50px;'>" + warnings[i].text.replace('{user}', baseVariables.reportedUser)  + "</textarea><input class='modern-button copyWarn' id='"+ warnings[i].title + "' name='" + type + "' style='width: 100%' type='button' value='Kopieren' /></details><br>");
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
            warnArray = baseVariables.settings.warnTextCollection.commonWarns;
            break;
          case "Profilinhalt":
            warnArray = baseVariables.settings.warnTextCollection.profileContentWarns;
            break;
          case "Profilbilder":
            warnArray = baseVariables.settings.warnTextCollection.profilePictureWarns;
            break;
        }

        var command = "/m " + baseVariables.reportedUser + ":Verwarnung§";

        warnArray.forEach((item) => {
          if(item.title == id)
          {
            command = command + item.text.replace('{user}', baseVariables.reportedUser);

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
            $('.loginDetail').html($('.loginDetail').html()?.replace('<br><br>', '<br>') + '<a href="ac_logout.pl" class="logoutLink">Logout</a><br><br><a href="#" id="settings">⚙️ Einstellungen</a> | <a href="#" id="changelog">📋 Changelog</a>');

        $('#changelog').click(function(){ showChangeLog(); return false; });

        $('#settings').click(function(){ bindWarns(); $('.config').show(); return false; });

        $('button,input[type="submit"]').not('.tablinks').addClass('modern-button');

        $("div:contains('Kontaktfilter:')").last().html('<b>' + $("div:contains('Kontaktfilter:')").last().html() + '</b>');

        $("div:contains('Bereich voll anzeigen')").last().css('width', '100%');

        $('div b:contains("KOMMENTAR:")').parent().addClass('commentOutput');

        var reportInfo = $('h1:contains("Knuddels.de - Meldesystem - Meldung ")')?.text().replace('Knuddels.de - Meldesystem - Meldung ', '');
        if(reportInfo)
             $('#header').html('<br>Knuddels - Meldesystem<div id="reportInfo">Meldung: ' + reportInfo + '</div>');
        else
             $('#header').html('<br>Knuddels - Meldesystem');

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
      addReportNames();
    }

    function addReportNames()
    {
       if (window.location.href.includes("ac_overview.pl") || window.location.href.includes("ac_search.pl")) {

        $('table tbody tr').each(function(index) {
            const row = $(this);
            const link = row.find('a.blind').attr('href');

            if (link) {
                const caseId = link.match(/id=(\d+)/)[1];

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://www6.knuddels.de:8443/ac/' + link,
                    onload: function(response) {
                         const headerRow = $('table tr').first();
                         if (headerRow.length && !headerRow.find('th:contains("Accountnamen")').length) {
                             headerRow.append('<th class="Q">Accountnamen<br>Channel</th>');
                         }

                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        let meldender = '';
                        let gemeldeter = '';
                        let channel = '';

                        const meldenderAlt = doc.querySelector('h3 div[style*="float:left"] span[style*="color: #060"]');
                        const gemeldeterAlt = doc.querySelector('h3 div[style*="float:left"] span[style*="color: #900"]');
                        const channelAlt = doc.querySelector('span[title="Channel"]');

                        if (meldenderAlt && gemeldeterAlt) {
                            meldender = meldenderAlt.textContent.trim();
                            gemeldeter = gemeldeterAlt.textContent.trim();
                            channel = channelAlt.textContent.trim();
                        }

                        if (!meldender || !gemeldeter) {
                            const contentText = doc.body.textContent;
                            const meldenderMatch = contentText.match(/Meldende\(r\):\s*([^\n]+)/);
                            const gemeldeterMatch = contentText.match(/Gemeldete\(r\):\s*([^\n]+)/);

                            if (meldenderMatch) {
                                meldender = meldenderMatch[1].trim();
                            }
                            if (gemeldeterMatch) {
                                gemeldeter = gemeldeterMatch[1].trim();
                            }
                        }


                        const backgroundColor = (index % 2 === 0) ? '#DDDDDD' : '#EEEEEE';

                        if (!row.find('td.nicknamen-column').length) {
                            row.append('<td class="nicknamen-column Q"><span style="color: #060; font-weight: bold;">' + (meldender || 'Unbekannt') + '</span><br><span style="color: #900; font-weight: bold;">' + (gemeldeter || 'Unbekannt') + '</span><br><b>Channel: </b>' +  channel + '</td>');
                        }
                    }
                });
            }
        });
      }
    }

    function showReportLink()
    {
      if(baseVariables.settings.enableReportRequestlink == "an")
        $('#reportRequest').css("display", "inline-block");
      else
        $('#reportRequest').css("display", "none");
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

        try
        {
          showInputs();
        }
        catch {}
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
      switch(baseVariables.settings.currentStyle)
      {
        case "Light":
          $('html,#main,.modal-content,.config-content,section, li label').css('background-color', 'white');
          $('html').css('filter', 'invert(0%) hue-rotate(0deg)');
          $('#header,#navi,.modern-button,.loginDetail,img').css('filter', 'invert(0%) hue-rotate(0deg)');
          break;
        case "Dark":
          $('html,#main,.modal-content,.config-content,section,.config-content, li label').css('background-color', 'lightgray');
          $('html').css('filter', 'invert(100%) hue-rotate(180deg)');
          $('#header,#navi,.modern-button,.loginDetail,img').css('filter', 'invert(180%) hue-rotate(180deg)');
          break;
      }

      baseVariables.settings.save();
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

			.configContent .reportContent .content-type-section p {
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

            .configContent .reportContent .commentOutput {
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
              max-width: 350px;
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

            .modal, .config {
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
            .config-content, .modal-content {
              background-color: white;
              margin: auto;
              padding: 20px;
              border: 1px solid #888;
              width: 800px;
              height: 700px;
              border-radius: 10px;
            }

            .configContent, .reportContent {
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

            #changelog, #settings {
               font-size: 10px;
            }
            ul#tabs {
              position: relative;
              list-style-type: none;
              padding: 0;
              width: 100%;
              -webkit-filter: drop-shadow(
                0 0 8px rgba(0,0,0,0.2));

              li {
                float: left;

                > input {
                  display: none;

                  &:checked {
                    ~ label {
                      color: #000;
                        border-bottom-color: transparent;
                    }
                    ~ section {
                      display: block;
                      z-index: 1;
                      -webkit-transition-delay: 0.5s
                    }
                  }
                }
                > label {
                  display: block;
                  padding: 8px;
                  background: #fff;
                  border-top-left-radius: 4px;
                  border-top-right-radius: 4px;
                  border-right: 1px solid rgba(0,0,0, 0.2);
                  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
                }
                > section {
                  position: absolute;
                  display: none;
                  overflow: hidden;
                  padding: 8px;
                  left: 0;
                  right: 0;
                  background: #fff;
                  text-align: left;
                  -webkit-transition: max-height 0.5s ease-in-out;
                  border-bottom-left-radius: 4px;
                  border-bottom-right-radius: 4px;
                }
              }
            }
       `;

        $('style').text(style);
    }

    // bootstrap the main script
    bootStrap();
})();
