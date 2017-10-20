var projectContent = '';


function getGradientFromProject() {
    projectContent = parseProjectFile();
    $.writeln(projectContent)
}

function parseProjectFile() {
    var projectFile = app.project.file;
    var file = File(projectFile);
    file.encoding = 'UTF-8';
    file.open('r');
    var content = file.read(file.length);

    $.writeln(file.absoluteURI);
    $.writeln(file.length);
    $.writeln(typeof content);
    $.writeln('content ---------------------');
    $.writeln(content.indexOf('ADBE Vector'));
    $.writeln('---------------------');
    file.close();


    //
    // var myFile=new File('C:\\Users\\Luc\\Desktop\\test.txt');
    // myFile.open();
    // myFile.write(content);
    // myFile.close();

    // if (!projectFile) {
    //     $.writeln('File read Error');
    //     return null;
    // } else {
    //     var file = new File(projectFile.absoluteURI);
    //     file.open('r', 'TEXT', '????');
    //     return file.read(file.length);
    // }
}
