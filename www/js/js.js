jQuery.noConflict();
//jQuery mobile, display panel and header

jQuery( document ).on( "pagecreate", function() {
    jQuery( "body > [data-role='panel']" ).panel();
	jQuery( "body > [data-role='panel'] [data-role='listview']" ).listview();          
});

jQuery( document ).one( "pageshow", function() {
    jQuery( "body > [data-role='header'], [data-role='footer']" ).toolbar();
    jQuery( "body > [data-role='header'] [data-role='navbar']" ).navbar();
});

// ################# DATABASE
// created thanks to tutorial: https://tejasrpatel.wordpress.com/2011/12/29/create-sqlite-off-line-database-and-insertupdatedeletedrop-operations-in-sqlite-using-jquery-html5-inputs/
 
var createStatement = "CREATE TABLE IF NOT EXISTS base (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age TEXT, ver TEXT, itemsResp TEXT, result INTEGER, testdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
 
var selectAllStatement = "SELECT * FROM base";
 
var insertStatement = "INSERT INTO base (name, age, ver, itemsResp, result) VALUES (?, ?, ?, ?, ?)";
 
var deleteStatement = "DELETE FROM base WHERE id=?";
 
var db = openDatabase("EMQResultsBase", "1.0", "EMQ results", 200000);  // Open SQLite Database
 
var dataset;

// global (to display and update them during filling out) variables separate for emq1 and emq2 (in order to switch between versions)
var totalEmq1 = 0;
var totalEmq2 = 0;
var itemsToStringEmq1 = "";
var itemsToStringEmq2 = "";

var resultsToFile = ""; //global string save to html file
 
 function initDatabase()  // Function Call When Page is ready.
    {
     try {
        if (!window.openDatabase)  // Check browser is supported SQLite or not.
        {
            alert('Databases are not supported in this browser.');
        } else {
            createTable();  // If supported then call Function for create table in SQLite
        }
        }
    catch (e) {
        if (e == 2) {
            // Version number mismatch. 
            console.log("Invalid database version.");
        } else {
            console.log("Unknown error " + e + ".");
        }
        return;
        }
    }
 
function createTable()
    {
        db.transaction(function (tx) { tx.executeSql(createStatement, [], showRecords, onError); });
    }
 
function insertRecord(patientObject)
    {
            var nametemp = patientObject.name;
            var agetemp = patientObject.age;
            var ver = patientObject.ver;
            var itemsToStringTemp = patientObject.answers;
            var totaltemp = patientObject.total;

            db.transaction(function (tx) { tx.executeSql(insertStatement, [nametemp, agetemp, ver, itemsToStringTemp, totaltemp], loadAndReset(patientObject.ver), onError); });
        
            alert("Zapisano!");
            //tx.executeSql(SQL Query Statement,[ Parameters ] , Sucess Result Handler Function, Error Result Handler Function );
    }
 
function deleteRecord(id) // Get id of record . Function Call when Delete Button Click..
    {   
        var iddelete = id.toString();

        db.transaction(function (tx) { tx.executeSql(deleteStatement, [id], showRecords, onError); alert("Usunięto!"); });

    }
 
function loadAndReset(ver) //Function for Load and Reset...
    {
        showRecords(); // on database subpage
        
        ver === "EMQ1" ? resetForm("emq1", "totalEmq1", "itemsToStringEmq1") : resetForm("emq2", "totalEmq2", "itemsToStringEmq2"); // reset saved form
    }
 
function onError(tx, error) // Function for Hendeling Error...
    {
        alert(error.message);
    }

function showRecords() {
    
    jQuery("#results").html('<table>');
 
    db.transaction(function (tx) {
 
        tx.executeSql(selectAllStatement, [], function (tx, result) {
 
            dataset = result.rows;
 
            for (var i = 0, item = null; i < dataset.length; i++) {
 
                item = dataset.item(i);
                
                // show some rows from database in app
                var rowsToTable = 
                    '<tr><td>' 
                    + item['name'] + '</td><td>'
                    + item['ver'] + '</td><td>'
                    + item['result'] + '</td><td>'
                    + item['testdate'] + '</td><td>' 
                    + '<a href="#" onclick="deleteRecord(' + item['id'] + ');">USUŃ</a></td></tr>';
 
                jQuery("#results").append(rowsToTable);
 
            }
            
            jQuery("#results").append('</table>'); 
            
        });
    });
}

function getAllRecords() {
    
    resultsToFile = "<table>";
 
    db.transaction(function (tx) {
 
        tx.executeSql(selectAllStatement, [], function (tx, result) {
 
            dataset = result.rows;
 
            for (var i = 0, item = null; i < dataset.length; i++) {
 
                item = dataset.item(i);
                
                // gathers all rows from database
                var rowsToFile = 
                    '<tr><td>'
                    + item['id'] + '</td><td>'
                    + item['name'] + '</td><td>' 
                    + item['age'] + '</td><td>' 
                    + item['ver'] + '</td><td>' 
                    + item['result'] + '</td><td>'
                    + item['itemsResp'] + '</td><td>' 
                    + item['testdate'] + '</td><td></tr>';
                
                resultsToFile += rowsToFile;
 
            }
            
            resultsToFile += "</table>";
            //alert(resultsToFile);
            saveFileContent();
        });
    });
}
// ###########################/database

// ############################################# FileWrite
var fileObject;
// Wait for Cordova to load
//
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
//
function onDeviceReady() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
}

function gotFS(fileSystem) {
    fileSystem.root.getFile("emq.html", {create: true, exclusive: false}, gotFileEntry, fail);
}

function gotFileEntry(fileEntry) {
    fileObject = fileEntry;
    jQuery("#saveToFile").click(function(){
        getAllRecords(); //from database
    });
}

function saveFileContent() {
    fileObject.createWriter(gotFileWriter, fail);
}

function gotFileWriter(writer) {
    writer.write(resultsToFile);
    resultsToFile = ""; // performance: memory usage
    alert("Zapisano w pliku emq.html.");
}

function fail(error) {
    console.log(error.code);
}

// ############################################# /FileWrite

// ################################## SUM and display during filling out
function sumResult(emqX, totalEmqX, itemsToStringEmqX){ //args: form id, global var for sum, global var for answers
    window[totalEmqX] = 0; //reset total value
    window[itemsToStringEmqX] = ""; //reset answers
    var radioCheckedSelector = "input[class=" + emqX + "_radio]:checked";
    var divID = "#totalSum_" + emqX;

    jQuery(radioCheckedSelector).each(function() {
            window[totalEmqX] += parseFloat(jQuery(this).val()); //add this value to total
            window[itemsToStringEmqX] += jQuery(this).attr("name") + ": " + jQuery(this).val() + ", "; //add this answer to global string
        });

        jQuery(divID).text(window[totalEmqX] + " | " + window[itemsToStringEmqX]); //display
}
// ################################### /sum

// ################## FORM RESET

function resetForm(emqX, totalEmqX, itemsToStringEmqX){ //args: form id, global var for sum, global var for answers
    var formSelector = "form[id=" + emqX + "]";
    var divID = "#totalSum_" + emqX;
    
    jQuery(formSelector).trigger('reset'); //reset form
    window[totalEmqX] = 0; //reset global var
    window[itemsToStringEmqX] = ""; //reset global var
    jQuery(divID).text(window[totalEmqX]); //reset display
    
    formSelector += " fieldset"; //reset eventual marks from previous validations
    jQuery(formSelector).attr('style',  'border-bottom:none');
}

// ################## /form reset

// ##################################### VALIDATE FORM

function validateSaveForm(emqX, totalEmqX, itemsToStringEmqX){ //args: form id, global var for sum, global var for answers
    var idSelector = "#patientID_" + emqX;
    var ageSelector = "#age_" + emqX;
    var radioCheckedSelector = "input[class=" + emqX + "_radio]:checked";
    
    var patientID = jQuery(idSelector).val().trim(); //trim value from ID input
    var patientAge = parseInt(jQuery(ageSelector).val()); //integer from age input
    var noOfAnswers = jQuery(radioCheckedSelector).length; //no of answered items
    var versionOfQ = emqX.toUpperCase();
    
    if (!patientID || !patientAge){
        alert("Brak danych Pacjenta.");
    } else if (noOfAnswers < 28) {
        alert("Pominięto " + (28 - noOfAnswers) + " pytania/ń.");
        
        // ############### mark unchecked
        for(var i=1; i<=28; i++){ //outer loop for each question/firldset
            var fieldsetSelector = "form[id=" + emqX + "] fieldset:nth-of-type(" + i + ")"; //check each fieldset in form emqX
            var counter = 0;
            jQuery(fieldsetSelector).attr('style',  'border-bottom:none'); //reset marks
            
            for(var i2=0; i2<=8; i2++){ //inner loop for each answer for particular question
                var inputSelector = "form[id=" + emqX + "] fieldset:nth-of-type(" + i + ") input[id$=_" + i2 + "]"; //check each input in fieldset
                
                if(jQuery(inputSelector).is(':checked')){
                    counter++; // count checked inputs in fieldset
                }
            }
            
            if (counter == 0){ // if none of inputs was checked...
                //alert(fieldsetSelector);
                jQuery(fieldsetSelector).attr('style',  'border-bottom:2px solid red'); // ... mark whole fieldset (question)
            }
            
        }
        // ################ /mark unchecked
        
    } else {
        var patientToDatabase = {
            name: patientID,
            age: patientAge,
            ver: versionOfQ,
            total: window[totalEmqX],
            answers: window[itemsToStringEmqX]
        };
        
        insertRecord(patientToDatabase); // save object
    }
}

// ##################################### /validate form

jQuery(document).ready(function () {
    
    initDatabase();
    
    jQuery("#btnSubmit_emq1").click(function(){
        validateSaveForm("emq1", "totalEmq1", "itemsToStringEmq1");
    });
    jQuery("#btnSubmit_emq2").click(function(){
        validateSaveForm("emq2", "totalEmq2", "itemsToStringEmq2");
    });
    
    
    // SUM RESULT EMQ1
    jQuery("input[class=emq1_radio]").click(function() {
        sumResult("emq1", "totalEmq1", "itemsToStringEmq1");
    });
    
    // SUM RESULT EMQ2
    jQuery("input[class=emq2_radio]").click(function(){
        sumResult("emq2", "totalEmq2", "itemsToStringEmq2");
    });
    
    // reset form emq1
    jQuery("input[id=reset_emq1]").click(function() {
        resetForm("emq1", "totalEmq1", "itemsToStringEmq1");
    });
    
    // reset form emq2
    jQuery("input[id=reset_emq2]").click(function() {
        resetForm("emq2", "totalEmq2", "itemsToStringEmq2");
    });
    
});